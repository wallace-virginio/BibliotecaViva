import { Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { FormError } from "./AuthLayout";
import { Button } from "./ui";

/**
 * Pede o aceite dos Termos e da Política quando a conta ainda não tem o consentimento da versão atual
 * (ex.: quem entrou com Google/Apple, ou quando os documentos mudam de versão).
 */
export function ConsentGate() {
  const auth = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!auth.needsConsent) return null;

  const accept = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await auth.acceptConsent();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="w-full max-w-md animate-fade-up rounded-t-3xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-elevated sm:rounded-3xl">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
          <ShieldCheck className="size-6" />
        </span>
        <h2 id="consent-title" className="mt-4 text-xl font-semibold">Antes de continuar</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Para usar sua conta precisamos do seu aceite. Explicamos quais dados guardamos, para quê e como você pode baixá-los ou excluí-los a qualquer momento.
        </p>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-muted-foreground">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" />
          <span>
            Li e aceito os <Link to="/termos" target="_blank" className="font-medium text-primary">Termos de Uso</Link> e a{" "}
            <Link to="/privacidade" target="_blank" className="font-medium text-primary">Política de Privacidade</Link>, e declaro ter 18 anos ou mais — ou ter
            autorização do meu responsável legal (obrigatória para menores de 12 anos).
          </span>
        </label>
        <div className="mt-3"><FormError message={error} /></div>
        <div className="mt-4 flex flex-col gap-2">
          <Button size="lg" disabled={!accepted || busy} onClick={accept}>
            {busy && <Loader2 className="size-4 animate-spin" />} Aceitar e continuar
          </Button>
          <Button variant="ghost" onClick={() => auth.signOut()}>Não aceito — sair</Button>
        </div>
      </div>
    </div>
  );
}
