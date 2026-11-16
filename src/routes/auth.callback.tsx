import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { buttonClass } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Entrando… — Biblioteca Viva" }, { name: "description", content: "Concluindo o login." }] }),
  component: Callback,
});

/**
 * Retorno do Google/Apple e da confirmação de e-mail (web).
 * O supabase-js troca o `?code=` da URL por uma sessão automaticamente (detectSessionInUrl).
 */
function Callback() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  useEffect(() => setProviderError(new URLSearchParams(window.location.search).get("error_description")), []);

  useEffect(() => {
    if (auth.user) navigate({ to: "/app", replace: true });
  }, [auth.user, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (providerError || timedOut)
    return (
      <AuthLayout
        title="Não foi possível concluir o login"
        subtitle={providerError ?? "O link pode ter expirado ou ter sido aberto em outro aparelho. Se você acabou de confirmar o e-mail, é só entrar com sua senha."}
      >
        <Link to="/entrar" className={buttonClass("primary", "lg", "w-full")}>Ir para o login</Link>
      </AuthLayout>
    );

  return (
    <AuthLayout title="Entrando…" subtitle="Só um instante.">
      <div className="grid place-items-center py-6"><Loader2 className="size-6 animate-spin text-primary" /></div>
    </AuthLayout>
  );
}
