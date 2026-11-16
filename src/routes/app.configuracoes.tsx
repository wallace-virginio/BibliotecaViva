import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Code2, KeyRound, Loader2, LogOut, Plug, Terminal } from "lucide-react";
import { useState } from "react";
import { DashHeader } from "@/components/dashboard";
import { PrivacyTab } from "@/components/PrivacyTab";
import { Button, buttonClass, Card, Input, Tabs } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { USER } from "@/data/content";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Aba = "conta" | "notificacoes" | "privacidade" | "desenvolvedor";
type Search = { aba?: Aba };

export const Route = createFileRoute("/app/configuracoes")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    aba: s.aba === "notificacoes" || s.aba === "privacidade" || s.aba === "desenvolvedor" ? s.aba : undefined,
  }),
  head: () => ({ meta: [{ title: "Configurações — Biblioteca Viva" }, { name: "description", content: "Conta, notificações, privacidade e modo desenvolvedor." }] }),
  component: Config,
});

const PREFS = [
  { key: "eventos", label: "Eventos perto de mim", desc: "Avisar sobre eventos em bibliotecas que você segue." },
  { key: "reservas", label: "Lembretes de reserva", desc: "Notificar 1 hora antes de uma sala ou retirada." },
  { key: "clubes", label: "Clubes de leitura", desc: "Novas discussões nos seus grupos." },
  { key: "perfil", label: "Perfil público", desc: "Outras pessoas podem ver seus livros lidos e conquistas." },
  { key: "localizacao", label: "Usar localização precisa", desc: "Mostrar distância exata no mapa (GPS)." },
];

function Config() {
  const { aba = "conta" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [on, setOn] = useState<string[]>(["eventos", "reservas", "clubes"]);
  const devMode = useStore((s) => s.developerMode);

  return (
    <>
      <DashHeader title="Configurações" />
      <Tabs
        className="mb-6"
        value={aba}
        onChange={(v) => navigate({ search: { aba: v === "conta" ? undefined : v }, replace: true })}
        options={[
          { value: "conta", label: "Conta" },
          { value: "notificacoes", label: "Notificações" },
          { value: "privacidade", label: "Privacidade" },
          { value: "desenvolvedor", label: <span className="flex items-center gap-1.5"><Code2 className="size-4" /> Desenvolvedor</span> },
        ]}
      />

      <div className="max-w-2xl">
        {aba === "conta" && <AccountTab />}
        {aba === "privacidade" && <PrivacyTab />}

        {aba === "notificacoes" && (
          <Card className="divide-y">
            {PREFS.map((p) => (
              <Toggle key={p.key} label={p.label} desc={p.desc} checked={on.includes(p.key)} onChange={(c) => setOn((o) => (c ? [...o, p.key] : o.filter((x) => x !== p.key)))} />
            ))}
          </Card>
        )}

        {aba === "desenvolvedor" && (
          <div className="space-y-5">
            <Card className="overflow-hidden p-0">
              <div className="bg-code-bg p-6 text-code-fg">
                <Terminal className="size-7 text-code-key" />
                <p className="mt-3 text-lg font-semibold">Modo desenvolvedor</p>
                <p className="mt-1 text-sm text-code-muted">
                  Integre a biblioteca da sua cidade criando um Provider. Ao ativar, você ganha acesso aos SDKs, ao API Playground, ao marketplace de conectores e às suas chaves de API.
                </p>
              </div>
              <Toggle
                label="Ativar modo desenvolvedor"
                desc="Adiciona a área Desenvolvedor ao seu menu. Você pode desativar quando quiser."
                checked={devMode}
                onChange={actions.setDeveloperMode}
              />
            </Card>

            {devMode && (
              <div className="grid animate-fade-up gap-3 sm:grid-cols-3">
                {[
                  { icon: Plug, label: "Criar um Provider" },
                  { icon: KeyRound, label: "Chaves de API" },
                  { icon: Code2, label: "SDKs e Playground" },
                ].map((x) => (
                  <Card key={x.label} className="flex items-center gap-3 p-4 text-sm font-medium">
                    <x.icon className="size-5 text-primary" /> {x.label}
                  </Card>
                ))}
                <Link to="/app/desenvolvedor" className={buttonClass("primary", "md", "sm:col-span-3")}>
                  Abrir área do desenvolvedor <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 p-5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-primary" : "bg-surface-3")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow-soft transition", checked && "translate-x-5")} />
      </button>
    </label>
  );
}

function AccountTab() {
  const auth = useAuth();
  const meta = (auth.user?.user_metadata ?? {}) as { full_name?: string };
  const [name, setName] = useState(auth.profile?.full_name ?? meta.full_name ?? (auth.configured ? "" : USER.fullName));
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const save = async () => {
    const sb = getSupabase();
    if (!sb || !auth.user) return;
    setState("saving");
    await sb.from("profiles").update({ full_name: name.trim(), updated_at: new Date().toISOString() }).eq("id", auth.user.id);
    await sb.auth.updateUser({ data: { full_name: name.trim() } });
    await auth.refreshProfile();
    setState("saved");
    setTimeout(() => setState("idle"), 1800);
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-3 p-5">
        <p className="font-semibold">Dados da conta</p>
        <label className="block text-xs font-medium text-muted-foreground">Nome</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <label className="block text-xs font-medium text-muted-foreground">E-mail</label>
        <Input value={auth.user?.email ?? "demo@bibliotecaviva.org"} disabled />
        {auth.user && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" onClick={save} disabled={state === "saving"}>
              {state === "saving" ? <Loader2 className="size-4 animate-spin" /> : state === "saved" ? <Check className="size-4" /> : null}
              {state === "saved" ? "Salvo" : "Salvar"}
            </Button>
            <Link to="/recuperar-senha" search={{ email: auth.user.email }} className={buttonClass("ghost", "sm")}>Alterar senha</Link>
          </div>
        )}
      </Card>
      {auth.user ? (
        <Button variant="outline" className="w-full text-danger" onClick={() => auth.signOut()}>
          <LogOut className="size-4" /> Sair da conta
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">Modo demonstração — configure o Supabase para usar contas reais.</p>
      )}
    </div>
  );
}
