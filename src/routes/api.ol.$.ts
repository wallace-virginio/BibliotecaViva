import { createFileRoute } from "@tanstack/react-router";
import { cachedFetch, resolveOpenLibrary, UPSTREAM_HEADERS } from "@/lib/server/proxy";

/** GET /api/ol/<caminho permitido>?… → Open Library, com cache na Cloudflare. */
export const Route = createFileRoute("/api/ol/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const upstream = resolveOpenLibrary(params._splat ?? "", url.search);
        if (!upstream) return new Response(JSON.stringify({ error: "caminho não permitido" }), { status: 404, headers: { "Content-Type": "application/json" } });
        return cachedFetch(`ol/${params._splat ?? ""}${url.search}`, upstream.ttl, () =>
          fetch(upstream.url, { headers: UPSTREAM_HEADERS, signal: AbortSignal.timeout(12_000) }),
        );
      },
    },
  },
});
