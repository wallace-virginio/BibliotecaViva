import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App nativo iOS/Android.
 * Gere o bundle SPA com `npm run build:mobile` (saída em dist/mobile) e sincronize com `npx cap sync`.
 */
const config: CapacitorConfig = {
  appId: "org.bibliotecaviva.app",
  appName: "Biblioteca Viva",
  webDir: "dist/mobile",
  backgroundColor: "#FCFDFE",
  ios: { contentInset: "never" },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, backgroundColor: "#00AEEF", showSpinner: false },
    StatusBar: { overlaysWebView: true },
  },
};

export default config;
