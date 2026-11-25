/**
 * Regras do proxy com cache (rodam no Worker da Cloudflare).
 *
 * Por que existe: a Open Library e o Overpass são serviços gratuitos que limitam acessos e às vezes caem.
 * Passando pelo nosso servidor, cada resposta fica guardada no cache da Cloudflare por algumas horas
 * (todo mundo reaproveita) e, se a fonte cair, servimos a última cópia boa.
 *
 * Segurança: só caminhos e consultas que o app realmente usa são aceitos (não é um proxy aberto).
 */

const OL_RULES: { re: RegExp; ttl: number }[] = [
  { re: /^trending\/(daily|weekly|monthly|yearly)\.json$/, ttl: 60 * 60 }, // 1 h
  { re: /^search\.json$/, ttl: 6 * 60 * 60 }, // 6 h
  { re: /^subjects\/[a-z0-9_]{1,60}\.json$/, ttl: 24 * 60 * 60 },
  { re: /^works\/OL\d{1,12}W(\.json|\/ratings\.json)$/, ttl: 24 * 60 * 60 },
  // edições de uma obra (para achar a edição brasileira em "Onde comprar"): muda pouco e a origem é lenta
  { re: /^works\/OL\d{1,12}W\/editions\.json$/, ttl: 7 * 24 * 60 * 60 },
  { re: /^authors\/OL\d{1,12}A\.json$/, ttl: 7 * 24 * 60 * 60 },
];

/** Caminho permitido na Open Library → URL de origem e tempo de cache (segundos). */
export function resolveOpenLibrary(splat: string, search: string): { url: string; ttl: number } | null {
  const path = splat.replace(/^\/+/, "");
  const rule = OL_RULES.find((r) => r.re.test(path));
  if (!rule) return null;
  if (search.length > 600) return null;
  return { url: `https://openlibrary.org/${path}${search}`, ttl: rule.ttl };
}

/** Só as duas consultas que o app faz ao Overpass: bibliotecas num raio e um elemento pelo id. */
const OVERPASS_ALLOWED = [
  /^\[out:json\]\[timeout:\d{1,2}\];nwr\["amenity"="library"\]\["name"\]\(around:\d{1,5},-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?\);out center tags \d{1,3};$/,
  /^\[out:json\]\[timeout:\d{1,2}\];(node|way|relation)\(\d{1,12}\);out center tags;$/,
];

export function isAllowedOverpassQuery(q: string | null): q is string {
  return !!q && q.length < 400 && OVERPASS_ALLOWED.some((re) => re.test(q));
}

export const OVERPASS_TTL = 24 * 60 * 60;
export const OVERPASS_MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

/** Cópia reserva: servida quando a fonte falha (até 7 dias). */
export const BACKUP_TTL = 7 * 24 * 60 * 60;

/** Identificação educada para os serviços gratuitos (pedido das políticas de uso deles). Não leva dado de usuário. */
export const UPSTREAM_HEADERS = { "User-Agent": "BibliotecaViva/1.0 (+https://biblioteca-viva.biblioteca-viva.workers.dev)", Accept: "application/json" };

type CacheLike = { match(req: Request): Promise<Response | undefined>; put(req: Request, res: Response): Promise<void> };

function edgeCache(): CacheLike | null {
  const c = (globalThis as unknown as { caches?: { default?: CacheLike } }).caches;
  return c?.default ?? null;
}

function withTtl(res: Response, ttl: number, source: string) {
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", `public, max-age=${Math.min(ttl, 3600)}, s-maxage=${ttl}`);
  out.headers.set("Access-Control-Allow-Origin", "*");
  out.headers.set("X-BV-Cache", source);
  return out;
}

/**
 * Busca com cache em duas camadas:
 *  1. cópia "fresca" (TTL normal) → resposta imediata;
 *  2. senão vai à fonte; se der certo, guarda fresca + reserva;
 *  3. se a fonte falhar, devolve a reserva (até 7 dias) — o site continua funcionando.
 */
export async function cachedFetch(cacheKey: string, ttl: number, load: () => Promise<Response>): Promise<Response> {
  const cache = edgeCache();
  const fresh = new Request(`https://cache.bibliotecaviva/${cacheKey}`);
  const backup = new Request(`https://cache.bibliotecaviva/backup/${cacheKey}`);
  if (cache) {
    const hit = await cache.match(fresh);
    if (hit) return withTtl(hit, ttl, "HIT");
  }
  try {
    const res = await load();
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const body = await res.arrayBuffer();
    const headers = { "Content-Type": res.headers.get("Content-Type") ?? "application/json" };
    if (cache) {
      await cache.put(fresh, withTtl(new Response(body, { headers }), ttl, "MISS"));
      await cache.put(backup, withTtl(new Response(body, { headers }), BACKUP_TTL, "BACKUP"));
    }
    return withTtl(new Response(body, { headers }), ttl, "MISS");
  } catch {
    if (cache) {
      const old = await cache.match(backup);
      if (old) return withTtl(old, 300, "STALE");
    }
    return new Response(JSON.stringify({ error: "fonte indisponível" }), { status: 502, headers: { "Content-Type": "application/json", "X-BV-Cache": "ERROR" } });
  }
}
