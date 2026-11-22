import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Eye, EyeOff, Loader2, MailCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AppleIcon, AuthLayout, FormError, GoogleIcon } from "@/components/AuthLayout";
import { Button, Input, Tabs } from "@/components/ui";
import { authErrorMessage, useAuth, type AccountType, type OAuthProvider } from "@/lib/auth";
import { MIN_PASSWORD } from "@/lib/legal";
import { SOCIAL_LOGIN_ENABLED } from "@/lib/platform";
import { cn } from "@/lib/utils";

type Search = { modo?: "biblioteca" | "cadastro"; redirect?: string };

export const Route = createFileRoute("/entrar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    modo: s.modo === "biblioteca" || s.modo === "cadastro" ? s.modo : undefined,
    // só caminhos internos, para evitar redirecionamento aberto
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Biblioteca Viva" },
      { name: "description", content: "Entre ou crie sua conta na Biblioteca Viva." },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const { modo, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const auth = useAuth();
  const [tab, setTab] = useState<"entrar" | "cadastro">(modo ? "cadastro" : "entrar");
  const [perfil, setPerfil] = useState<AccountType>(modo === "biblioteca" ? "biblioteca" : "leitor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"form" | OAuthProvider | null>(null);
  const [error, setError] = useState<string>();
  const [confirmSent, setConfirmSent] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const destination = redirect ?? (perfil === "biblioteca" && tab === "cadastro" ? "/app/admin" : "/app");

  // Já logado? Vai direto para o app.
  useEffect(() => {
    if (auth.user) navigate({ to: destination, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (tab === "cadastro" && !accepted) return setError("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
    if (!auth.configured) return navigate({ to: destination }); // modo demonstração
    setBusy("form");
    try {
      if (tab === "entrar") {
        await auth.signIn(email.trim(), password);
      } else {
        const { needsConfirmation } = await auth.signUp({ email: email.trim(), password, fullName: name.trim(), accountType: perfil });
        if (needsConfirmation) setConfirmSent(true);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const social = async (provider: OAuthProvider) => {
    setError(undefined);
    if (!auth.configured) return navigate({ to: destination });
    setBusy(provider);
    try {
      await auth.signInWithProvider(provider);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(null);
    }
  };

  if (confirmSent)
    return (
      <AuthLayout title="Confirme seu e-mail" subtitle={<>Enviamos um link para <strong className="text-foreground">{email}</strong>.</>}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground"><MailCheck className="size-7" /></span>
          <p className="text-sm text-muted-foreground">Abra o e-mail neste aparelho e toque no link para ativar a conta. Depois disso você entra automaticamente.</p>
          <Button variant="outline" className="w-full" onClick={() => { setConfirmSent(false); setTab("entrar"); }}>Voltar para o login</Button>
        </div>
      </AuthLayout>
    );

  return (
    <AuthLayout
      title={tab === "entrar" ? "Bem-vindo de volta" : "Crie sua conta"}
      subtitle={tab === "entrar" ? "Continue de onde parou." : "Leva menos de um minuto."}
      footer={<><Link to="/termos" className="text-primary">Termos de Uso</Link> · <Link to="/privacidade" className="text-primary">Política de Privacidade</Link></>}
    >
      {!auth.configured && (
        <p className="mb-5 rounded-xl bg-warning-soft px-4 py-3 text-xs text-warning">
          Modo demonstração: o Supabase não está configurado (.env.local), então o login apenas abre o app.
        </p>
      )}
      <Tabs className="mb-6 w-full [&>button]:flex-1" value={tab} onChange={(v) => { setTab(v); setError(undefined); }} options={[{ value: "entrar", label: "Entrar" }, { value: "cadastro", label: "Criar conta" }]} />

      {SOCIAL_LOGIN_ENABLED && (
      <>
      <div className="grid gap-2">
        <Button type="button" variant="outline" size="lg" disabled={!!busy} onClick={() => social("apple")} className="w-full">
          {busy === "apple" ? <Loader2 className="size-4 animate-spin" /> : <AppleIcon className="size-5" />} Continuar com Apple
        </Button>
        <Button type="button" variant="outline" size="lg" disabled={!!busy} onClick={() => social("google")} className="w-full">
          {busy === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon className="size-5" />} Continuar com Google
        </Button>
      </div>

      <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
        Ao continuar com Apple ou Google você concorda com os <Link to="/termos" className="text-primary">Termos</Link> e a{" "}
        <Link to="/privacidade" className="text-primary">Política de Privacidade</Link>.
      </p>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> ou com e-mail <span className="h-px flex-1 bg-border" /></div>
      </>
      )}

      <form onSubmit={submit} className="space-y-3">
        {tab === "cadastro" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["leitor", "Sou leitor", User],
                ["biblioteca", "Sou biblioteca", Building2],
              ] as const).map(([v, label, Icon]) => (
                <button key={v} type="button" onClick={() => setPerfil(v)} className={cn("flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition", perfil === v && "border-primary bg-primary-soft text-primary-soft-foreground")}>
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder={perfil === "biblioteca" ? "Nome da biblioteca" : "Seu nome"} autoComplete="name" />
          </>
        )}
        <Input required type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
        <div className="relative">
          <Input
            required
            minLength={tab === "cadastro" ? MIN_PASSWORD : 1}
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tab === "cadastro" ? `Crie uma senha (mín. ${MIN_PASSWORD} caracteres)` : "Senha"}
            autoComplete={tab === "entrar" ? "current-password" : "new-password"}
            className="pr-12"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center text-muted-foreground" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {tab === "entrar" && (
          <div className="text-right">
            <Link to="/recuperar-senha" search={{ email: email || undefined }} className="text-sm font-medium text-primary">Esqueci minha senha</Link>
          </div>
        )}
        {tab === "cadastro" && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-muted-foreground">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" />
            <span>
              Li e aceito os <Link to="/termos" target="_blank" className="font-medium text-primary">Termos de Uso</Link> e a{" "}
              <Link to="/privacidade" target="_blank" className="font-medium text-primary">Política de Privacidade</Link>, e declaro ter 18 anos ou mais
              — ou ter autorização do meu responsável legal (obrigatória para menores de 12 anos).
            </span>
          </label>
        )}
        <FormError message={error} />
        <Button type="submit" className="w-full" size="lg" disabled={!!busy}>
          {busy === "form" ? <Loader2 className="size-4 animate-spin" /> : null}
          {tab === "entrar" ? "Entrar" : "Criar conta"} {busy !== "form" && <ArrowRight className="size-4" />}
        </Button>
      </form>
    </AuthLayout>
  );
}
