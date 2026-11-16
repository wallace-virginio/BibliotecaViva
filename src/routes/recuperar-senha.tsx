import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { AuthLayout, FormError } from "@/components/AuthLayout";
import { Button, Input } from "@/components/ui";
import { authErrorMessage, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/recuperar-senha")({
  validateSearch: (s: Record<string, unknown>): { email?: string } => ({ email: typeof s.email === "string" ? s.email : undefined }),
  head: () => ({ meta: [{ title: "Recuperar senha — Biblioteca Viva" }, { name: "description", content: "Receba um link para criar uma nova senha." }] }),
  component: Recuperar,
});

function Recuperar() {
  const { email: initial } = Route.useSearch();
  const auth = useAuth();
  const [email, setEmail] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await auth.sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para você criar uma nova senha." footer={<Link to="/entrar" className="text-primary">Voltar para o login</Link>}>
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground"><MailCheck className="size-7" /></span>
          <p className="text-sm text-muted-foreground">Se existir uma conta com <strong className="text-foreground">{email}</strong>, o link chega em instantes. Confira também o spam.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <Input required type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
          <FormError message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Enviar link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
