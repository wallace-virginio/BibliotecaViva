import { createFileRoute } from "@tanstack/react-router";
import { cachedFetch, isAllowedOverpassQuery, OVERPASS_MIRRORS, OVERPASS_TTL, UPSTREAM_HEADERS } from "@/lib/server/proxy";

/** GET /api/overpass?data=<consulta permitida> → Overpass (com espelho reserva), com cache na Cloudflare. */
export const Route = createFileRoute("/api/overpass")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams.get("data");
        if (!isAllowedOverpassQuery(q)) return new Response(JSON.stringify({ error: "consulta não permitida" }), { status: 400, headers: { "Content-Type": "application/json" } });
        return cachedFetch(`overpass/${encodeURIComponent(q)}`, OVERPASS_TTL, async () => {
          let last: Response | undefined;
          for (const mirror of OVERPASS_MIRRORS) {
            try {
              const res = await fetch(mirror, { method: "POST", body: new URLSearchParams({ data: q }), headers: UPSTREAM_HEADERS, signal: AbortSignal.timeout(10_000) });
              if (res.ok) return res;
              last = res;
            } catch {
              /* tenta o próximo espelho */
            }
          }
          return last ?? new Response(null, { status: 502 });
        });
      },
    },
  },
});
