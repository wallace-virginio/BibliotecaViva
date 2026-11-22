import { useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LocationChip } from "@/components/LocationSheet";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";

/** Telas que são abas: mostram a marca. As demais mostram "voltar", como num app nativo. */
const TAB_ROOTS = ["/", "/acervo", "/app/livros", "/app/perfil", "/app"];

/**
 * Cabeçalho do app (celular): simples, sem menu de site.
 * Mesma altura do cabeçalho do site (56px + área segura), então as telas não precisam mudar.
 */
export function AppHeader() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/mapa") return null; // o mapa ocupa a tela toda e tem a própria busca
  const isRoot = TAB_ROOTS.includes(pathname);

  return (
    <header className="vt-static-header fixed inset-x-0 top-0 z-[1000] border-b bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between gap-2 px-3">
        {isRoot ? (
          <Logo tagline={false} className="pl-1 [&>span:first-child]:size-9" />
        ) : (
          <button
            onClick={() => router.history.back()}
            className="-ml-1 flex h-11 items-center gap-0.5 rounded-full pr-3 pl-1.5 text-[15px] font-medium text-foreground active:bg-surface-2"
            aria-label="Voltar"
          >
            <ChevronLeft className="size-6" /> Voltar
          </button>
        )}
        <div className="flex items-center gap-1">
          <LocationChip className="max-w-[9rem]" />
          <AccessibilityMenu />
        </div>
      </div>
    </header>
  );
}
