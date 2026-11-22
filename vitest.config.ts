import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes unitários: sem os plugins de build (Cloudflare/TanStack Start), só o alias "@/".
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
