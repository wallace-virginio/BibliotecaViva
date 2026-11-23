import type { CapacitorConfig } from "@capacitor/cli";

/**
 * App nativo iOS/Android.
 * Gere o bundle SPA com `npm run build:mobile` (saída em dist/mobile) e sincronize com `npx cap sync`.
 */
const config: CapacitorConfig = {
  appId: "org.bibliotecaviva.app",
  appName: "Biblioteca Viva",
  webDir: "dist/mobile",
  // marrom da abertura: é o que aparece por trás do WebView antes da primeira pintura (nada de tela branca)
  backgroundColor: "#6B3D20",
  ios: { contentInset: "never" },
  // Android: WebView transparente enquanto carrega, para o fundo da janela (marrom + livro fechado,
  // res/drawable/launch_background.xml) continuar aparecendo até a página pintar — sem "buraco" marrom
  android: { allowMixedContent: false, backgroundColor: "#00000000" },
  plugins: {
    // a abertura nativa fica até o app mandar esconder (src/lib/native.ts), já com a animação web pintada por baixo
    SplashScreen: { launchAutoHide: false, launchShowDuration: 0, backgroundColor: "#6B3D20", showSpinner: false },
    StatusBar: { overlaysWebView: true },
  },
};

export default config;
