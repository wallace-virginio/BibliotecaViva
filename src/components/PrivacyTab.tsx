import { Link, useNavigate } from "@tanstack/react-router";
import { Download, FileText, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { CONTROLLER } from "@/lib/legal";
import { actions } from "@/lib/store";
import { FormError } from "./AuthLayout";
import { Button, Card, Input } from "./ui";

/** Direitos do titular (LGPD art. 18) dentro do app: acesso, portabilidade e eliminação. */
export function PrivacyTab() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const exportData = async () => {
    setError(undefined);
    setExporting(true);
    try {
      const blob = await auth.exportMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `biblioteca-viva-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setError(undefined);
    setDeleting(true);
    try {
      await auth.deleteAccount();
      navigate({ to: "/", replace: true });
    } catch (e) {
      setError(authErrorMessage(e));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">Seus dados, suas regras</p>
            <p className="mt-1 text-muted-foreground">
              Guardamos só o necessário para o app funcionar: e-mail, nome, favoritos, reservas, histórico e progresso de leitura. Nada é vendido nem usado
              para publicidade.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/privacidade" className="inline-flex items-center gap-1.5 font-medium text-primary"><FileText className="size-4" /> Política de Privacidade</Link>
              <Link to="/termos" className="inline-flex items-center gap-1.5 font-medium text-primary"><FileText className="size-4" /> Termos de Uso</Link>
            </div>
          </div>
        </div>
      </Card>

      {auth.user ? (
        <>
          <Card className="p-5">
            <p className="font-semibold">Baixar meus dados</p>
            <p className="mt-1 text-sm text-muted-foreground">Um arquivo JSON com tudo o que está associado à sua conta, incluindo os consentimentos registrados.</p>
            <Button className="mt-4" variant="outline" onClick={exportData} disabled={exporting}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Baixar meus dados
            </Button>
          </Card>

          <Card className="border-danger/30 p-5">
            <p className="font-semibold text-danger">Excluir minha conta</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Apaga definitivamente sua conta, perfil, favoritos, reservas, histórico, progresso de leitura e registros de consentimento. Não dá para desfazer.
            </p>
            <label className="mt-4 block text-xs font-medium text-muted-foreground">Para confirmar, digite EXCLUIR</label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="EXCLUIR" autoComplete="off" />
              <Button
                className="shrink-0 !bg-none !bg-danger !text-on-image !shadow-none"
                disabled={confirmText.trim().toUpperCase() !== "EXCLUIR" || deleting}
                onClick={deleteAccount}
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Excluir definitivamente
              </Button>
            </div>
          </Card>
          <FormError message={error} />
        </>
      ) : (
        <Card className="p-5">
          <p className="font-semibold">Dados deste aparelho</p>
          <p className="mt-1 text-sm text-muted-foreground">Sem conta, seus favoritos e leituras ficam só neste aparelho. Você pode apagá-los aqui.</p>
          <Button className="mt-4" variant="outline" onClick={() => actions.reset()}>
            <Trash2 className="size-4" /> Apagar dados deste aparelho
          </Button>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Outras solicitações (correção, informações sobre compartilhamento, revogação de consentimento): fale com o encarregado de dados em{" "}
        <a href={`mailto:${CONTROLLER.dpoEmail}`} className="text-primary">{CONTROLLER.dpoEmail}</a>.
      </p>
    </div>
  );
}
