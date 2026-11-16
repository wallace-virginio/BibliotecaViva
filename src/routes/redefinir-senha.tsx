import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthLayout, FormError } from "@/components/AuthLayout";
import { Button, buttonClass, Input } from "@/components/ui";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { MIN_PASSWORD } from "@/lib/legal";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [{ title: "Nova senha — Biblioteca Viva" }, { name: "description", content: "Crie uma nova senha para sua conta." }] }),
  component: Redefinir,
});

/** O link do e-mail traz um código (PKCE) que o Supabase troca por uma sessão; aí o usuário define a nova senha. */
function Redefinir() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("As senhas não coincidem.");
    setBusy(true);
    setError(undefined);
    try {
      await auth.updatePassword(password);
      navigate({ to: "/app", replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  if (auth.loading)
    return (
      <AuthLayout title="Validando link…">
        <div className="grid place-items-center py-6"><Loader2 className="size-6 animate-spin text-primary" /></div>
      </AuthLayout>
    );

  if (!auth.user)
    return (
      <AuthLayout title="Link inválido ou expirado" subtitle="Peça um novo link de recuperação de senha.">
        <Link to="/recuperar-senha" className={buttonClass("primary", "lg", "w-full")}>Enviar novo link</Link>
      </AuthLayout>
    );

  return (
    <AuthLayout title="Crie uma nova senha" subtitle={auth.user.email}>
      <form onSubmit={submit} className="space-y-3">
        <Input required minLength={MIN_PASSWORD} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`Nova senha (mín. ${MIN_PASSWORD} caracteres)`} autoComplete="new-password" />
        <Input required minLength={MIN_PASSWORD} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a nova senha" autoComplete="new-password" />
        <FormError message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} Salvar nova senha
        </Button>
      </form>
    </AuthLayout>
  );
}
