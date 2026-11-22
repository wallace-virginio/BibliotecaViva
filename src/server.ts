/**
 * Entrada do servidor (Cloudflare Worker), apontada em wrangler.jsonc → "main".
 * Monta o handler do TanStack Start igual à entrada padrão e acrescenta os cabeçalhos de segurança
 * (CSP, HSTS, anti-clickjacking etc.) em toda resposta.
 */
import { createServerEntry, createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { withSecurityHeaders } from "./lib/server/security";

const startFetch = createStartHandler(defaultStreamHandler);

export default createServerEntry({
  async fetch(request, opts) {
    const res = await startFetch(request, opts);
    return withSecurityHeaders(res, import.meta.env.DEV);
  },
});
