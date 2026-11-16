/**
 * Integração com o ambiente de app:
 *  - Registra o service worker (PWA) em produção no navegador.
 *  - Dentro do Capacitor (iOS/Android), configura status bar e esconde a splash.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = () => typeof window !== "undefined" && Capacitor.isNativePlatform();

export async function initAppShell() {
  if (typeof window === "undefined") return;

  if (isNative()) {
    document.documentElement.classList.add("native");
    try {
      const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([import("@capacitor/status-bar"), import("@capacitor/splash-screen")]);
      const dark = document.documentElement.classList.contains("dark");
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
      await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      await SplashScreen.hide().catch(() => {});
    } catch {
      /* plugins indisponíveis */
    }
    return;
  }

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

/** Geolocalização: usa o plugin nativo no app (permissões do sistema) e a API web no navegador. */
export async function nativeLocation(): Promise<{ lat: number; lon: number } | undefined> {
  if (!isNative()) return undefined;
  const { Geolocation } = await import("@capacitor/geolocation");
  const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000 });
  return { lat: p.coords.latitude, lon: p.coords.longitude };
}
