/**
 * Integração com o ambiente de app:
 *  - Registra o service worker (PWA) em produção no navegador.
 *  - Dentro do Capacitor (iOS/Android), configura status bar e esconde a splash.
 */
import { Capacitor } from "@capacitor/core";
import { PUBLIC_SITE_URL } from "./platform";

export const isNative = () => typeof window !== "undefined" && Capacitor.isNativePlatform();

export async function initAppShell() {
  if (typeof window === "undefined") return;

  if (isNative()) {
    const root = document.documentElement;
    root.classList.add("native");
    // dados importantes com cópia nativa: se o Android limpou o WebView, restaura e recarrega uma vez
    try {
      const { restoreDurable, mirrorDurable } = await import("./durable");
      if (await restoreDurable()) {
        window.location.reload();
        return;
      }
      await mirrorDurable();
    } catch {
      /* plugin indisponível: segue só com o localStorage */
    }
    interceptExternalLinks();
    try {
      const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([import("@capacitor/status-bar"), import("@capacitor/splash-screen")]);
      // a cor dos ícones da barra de status acompanha o tema (claro/escuro), inclusive quando a pessoa troca
      const syncStatusBar = () => StatusBar.setStyle({ style: root.classList.contains("dark") ? Style.Dark : Style.Light }).catch(() => {});
      await syncStatusBar();
      new MutationObserver(syncStatusBar).observe(root, { attributes: true, attributeFilter: ["class"] });
      await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      await SplashScreen.hide().catch(() => {});
    } catch {
      /* plugins indisponíveis */
    }
    try {
      // teclado aberto: esconde a barra de abas e barras fixas de baixo (ver .keyboard-open em styles.css)
      const { Keyboard } = await import("@capacitor/keyboard");
      Keyboard.addListener("keyboardWillShow", () => root.classList.add("keyboard-open"));
      Keyboard.addListener("keyboardWillHide", () => root.classList.remove("keyboard-open"));
    } catch {
      /* plugin indisponível */
    }
    return;
  }

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

/**
 * No app, links para fora (site da biblioteca, rotas, Open Library…) abrem no navegador interno
 * (Custom Tabs / SFSafariViewController) em vez de "sumir" o app. Links internos com target=_blank
 * (Termos, Privacidade) abrem dentro do próprio app.
 */
function interceptExternalLinks() {
  document.addEventListener(
    "click",
    (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.protocol === "mailto:" || url.protocol === "tel:" || url.protocol === "geo:") return; // o sistema cuida
      if (url.origin === window.location.origin) {
        if (a.target === "_blank") {
          e.preventDefault();
          window.history.pushState({}, "", url.pathname + url.search + url.hash);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
        return;
      }
      e.preventDefault();
      openExternal(url.toString());
    },
    true,
  );
}

/** Abre um endereço fora do app: navegador interno no celular, nova aba no navegador. */
export async function openExternal(url: string) {
  if (isNative()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url }).catch(() => {});
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Compartilhar: folha nativa no app; Web Share no celular; copia o link no computador.
 * `path` é o caminho no site (ex.: "/livro/OL1W"); o link sempre aponta para o site público,
 * nunca para o endereço interno do app (https://localhost).
 * Devolve "copied" quando só deu para copiar (para a tela avisar).
 */
export async function shareLink(title: string, path: string): Promise<"shared" | "copied" | "failed"> {
  const url = new URL(path, isNative() ? PUBLIC_SITE_URL : window.location.origin).toString();
  try {
    if (isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, url, dialogTitle: "Compartilhar" });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
    await navigator.clipboard?.writeText(url);
    return "copied";
  } catch {
    return "failed"; // a pessoa cancelou ou o sistema recusou
  }
}

/** Vibração curta de confirmação (só no app; no navegador não faz nada). */
export function haptic(kind: "light" | "success" = "light") {
  if (!isNative()) return;
  import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle, NotificationType }) =>
      kind === "success" ? Haptics.notification({ type: NotificationType.Success }) : Haptics.impact({ style: ImpactStyle.Light }),
    )
    .catch(() => {});
}

/** Geolocalização: usa o plugin nativo no app (permissões do sistema) e a API web no navegador. */
export async function nativeLocation(): Promise<{ lat: number; lon: number } | undefined> {
  if (!isNative()) return undefined;
  const { Geolocation } = await import("@capacitor/geolocation");
  const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000 });
  return { lat: p.coords.latitude, lon: p.coords.longitude };
}
