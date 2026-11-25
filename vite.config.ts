import { defineConfig, loadEnv } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// MOBILE=1 gera um bundle SPA estático (index.html + assets) para o Capacitor (iOS/Android).
// Sem MOBILE, o build é SSR para Cloudflare Workers (wrangler.jsonc).
const mobile = process.env.MOBILE === "1";

const SUPABASE_VARS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;

export default defineConfig(({ command, mode }) => {
  // A URL e a publishable key do Supabase não ficam no repositório: vêm do `.env.production` do PC
  // ou das variáveis de build da Cloudflare (docs/DEPLOY.md). Sem elas o site sairia sem login,
  // então o build de produção para aqui. BV_DEMO=1 gera de propósito a versão demonstração.
  if (command === "build" && mode === "production" && process.env.BV_DEMO !== "1") {
    const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };
    const missing = SUPABASE_VARS.filter((k) => !env[k]);
    if (missing.length) {
      throw new Error(
        `Faltam ${missing.join(" e ")} para o build de produção. ` +
          "No PC: crie o .env.production (modelo em .env.example). " +
          "Na Cloudflare: Workers Builds → Settings → Build → Variables (docs/DEPLOY.md). " +
          "Para gerar a versão demonstração sem login: BV_DEMO=1.",
      );
    }
  }

  return {
    server: { port: 3000 },
    resolve: { tsconfigPaths: true },
    plugins: [
      ...(mobile ? [] : [cloudflare({ viteEnvironment: { name: "ssr" } })]),
      tailwindcss(),
      tanstackStart(mobile ? { spa: { enabled: true, prerender: { outputPath: "/index.html" } } } : {}),
      viteReact(),
    ],
  };
});
