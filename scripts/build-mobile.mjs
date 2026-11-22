// Build SPA para o app nativo: copia dist/client → dist/mobile (webDir do Capacitor).
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";

// VITE_APP=1 liga a experiência de app (src/lib/platform.ts): Início do app, abas próprias, sem área de site.
execSync("vite build", { stdio: "inherit", env: { ...process.env, MOBILE: "1", VITE_APP: "1" } });
rmSync("dist/mobile", { recursive: true, force: true });
cpSync("dist/client", "dist/mobile", { recursive: true });
rmSync("dist/mobile/sw.js", { force: true }); // no app nativo os arquivos já são locais
if (!existsSync("dist/mobile/index.html")) throw new Error("index.html não foi gerado");
console.log("\n✔ Bundle mobile pronto em dist/mobile — rode `npx cap sync`.");
