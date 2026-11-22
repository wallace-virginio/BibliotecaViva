/**
 * Botão "voltar" do Android (e gesto de voltar).
 *
 * Ordem do que acontece ao voltar:
 *  1. fecha o que estiver aberto por cima (folha de localização, menus, painéis) — último aberto primeiro;
 *  2. volta uma tela no histórico;
 *  3. numa aba principal sem histórico, vai para o Início;
 *  4. já no Início, minimiza/fecha o app (como os apps nativos).
 */
import { useEffect, useRef } from "react";
import { isNative } from "./native";

type Closer = () => void;
const stack: { id: number; close: Closer }[] = [];
let seq = 0;

/** Registra uma camada aberta (sheet, menu, painel) para ser fechada pelo botão voltar. */
export function useBackHandler(open: boolean, close: Closer) {
  const latest = useRef(close);
  latest.current = close;
  useEffect(() => {
    if (!open) return;
    const id = ++seq;
    stack.push({ id, close: () => latest.current() });
    return () => {
      const i = stack.findIndex((s) => s.id === id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [open]);
}

/** Fecha a camada mais recente; devolve true se havia alguma. */
export function closeTopLayer() {
  const top = stack.pop();
  if (!top) return false;
  top.close();
  return true;
}

const ROOT_TABS = ["/", "/mapa", "/acervo", "/app/livros", "/app/perfil"];

export async function installBackButton(navigateHome: () => void) {
  if (!isNative()) return () => {};
  const { App } = await import("@capacitor/app");
  const handle = await App.addListener("backButton", ({ canGoBack }) => {
    if (closeTopLayer()) return;
    const path = window.location.pathname;
    if (canGoBack && window.history.length > 1 && path !== "/") {
      window.history.back();
      return;
    }
    if (path !== "/" && ROOT_TABS.includes(path)) {
      navigateHome();
      return;
    }
    App.minimizeApp().catch(() => App.exitApp());
  });
  return () => handle.remove();
}
