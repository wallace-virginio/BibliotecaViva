import { createFileRoute } from "@tanstack/react-router";
import { aiText, APP_ORIGINS, ASSISTANT_MODEL, parsePlan, sanitizeHistory, systemPrompt } from "@/lib/server/assistant";

/**
 * POST /api/assistente  { messages: [{role, content}], city?: string }  →  { plan } | { error }
 *
 * - IA: Cloudflare Workers AI (binding "AI" em wrangler.jsonc), plano grátis (10.000 neurons/dia).
 * - Nada é guardado: as mensagens só passam pela IA para montar a resposta.
 * - Limite por pessoa (aprox. por IP, por região da Cloudflare) para ninguém esgotar a cota do dia.
 * - Se a IA falhar ou a cota acabar, responde 503 e o app usa o assistente local (sem IA).
 */
const LIMIT = 20; // perguntas
const WINDOW_S = 600; // a cada 10 minutos

type CacheLike = { match(k: string): Promise<Response | undefined>; put(k: string, r: Response): Promise<void> };
const edgeCache = () => (globalThis as unknown as { caches?: { default?: CacheLike } }).caches?.default;

async function overLimit(ip: string) {
  const cache = edgeCache();
  if (!cache) return false;
  const key = `https://limite.bibliotecaviva.local/assistente/${encodeURIComponent(ip)}/${Math.floor(Date.now() / 1000 / WINDOW_S)}`;
  const hit = await cache.match(key);
  const count = hit ? Number(await hit.text()) || 0 : 0;
  if (count >= LIMIT) return true;
  await cache.put(key, new Response(String(count + 1), { headers: { "Cache-Control": `max-age=${WINDOW_S}` } }));
  return false;
}

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  return origin && APP_ORIGINS.includes(origin)
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}

const json = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(request) } });

export const Route = createFileRoute("/api/assistente")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: cors(request) }),
      POST: async ({ request }) => {
        // import só aqui dentro (servidor): o build do app nativo, que não tem servidor, nem chega a ver este módulo
        const { env } = await import("cloudflare:workers");
        const ai = (env as { AI?: { run(model: string, input: unknown): Promise<unknown> } }).AI;
        if (!ai) return json(request, { error: "indisponivel" }, 503);

        const ip = request.headers.get("CF-Connecting-IP") ?? "local";
        if (await overLimit(ip)) return json(request, { error: "limite" }, 429);

        let body: { messages?: unknown; city?: unknown };
        try {
          body = await request.json();
        } catch {
          return json(request, { error: "pedido inválido" }, 400);
        }
        const messages = sanitizeHistory(body.messages);
        if (!messages.length || messages[messages.length - 1].role !== "user") return json(request, { error: "pedido inválido" }, 400);
        const city = typeof body.city === "string" ? body.city.slice(0, 80) : undefined;

        try {
          const out = await ai.run(ASSISTANT_MODEL, {
            messages: [{ role: "system", content: systemPrompt(city) }, ...messages],
            max_tokens: 350,
            temperature: 0.4,
            // sem "pensar em voz alta": o modelo gastava a cota em raciocínio e devolvia a resposta vazia
            chat_template_kwargs: { enable_thinking: false },
          });
          const plan = parsePlan(aiText(out));
          if (!plan) {
            console.warn("[assistente] resposta fora do formato:", JSON.stringify(out).slice(0, 800));
            return json(request, { error: "resposta inválida" }, 503);
          }
          return json(request, { plan });
        } catch {
          // cota do dia esgotada, modelo fora do ar etc.: o app cai no assistente local
          return json(request, { error: "indisponivel" }, 503);
        }
      },
    },
  },
});
