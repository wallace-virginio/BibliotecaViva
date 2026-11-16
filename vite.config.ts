import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// MOBILE=1 gera um bundle SPA estático (index.html + assets) para o Capacitor (iOS/Android).
// Sem MOBILE, o build é SSR para Cloudflare Workers (wrangler.jsonc).
const mobile = process.env.MOBILE === "1";

export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    ...(mobile ? [] : [cloudflare({ viteEnvironment: { name: "ssr" } })]),
    tailwindcss(),
    tanstackStart(mobile ? { spa: { enabled: true, prerender: { outputPath: "/index.html" } } } : {}),
    viteReact(),
  ],
});
