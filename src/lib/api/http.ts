/**
 * Acesso às fontes abertas pelo nosso proxy com cache (/api/…) quando o site roda no servidor da Cloudflare.
 * No app nativo (Capacitor) não há servidor próprio, então vai direto à fonte — e também cai para o acesso
 * direto se o proxy falhar.
 */
export function canUseProxy() {
  if (typeof window === "undefined") return false;
  if (!/^https?:$/.test(window.location.protocol)) return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !cap?.isNativePlatform?.();
}

/** `path` sem barra inicial, ex.: "search.json?q=…" ou "works/OL1W.json". */
export async function olFetch(path: string, signal?: AbortSignal): Promise<Response> {
  if (canUseProxy()) {
    try {
      const res = await fetch(`/api/ol/${path}`, { signal });
      if (res.ok) return res;
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }
  const url = `https://openlibrary.org/${path}`;
  return withOfflineCache(url, () => fetch(url, { signal }), signal);
}

/* ------------------------------------------------------------------ */
/* Uso sem internet (app): guarda a última resposta boa de cada fonte  */
/* ------------------------------------------------------------------ */

const OFFLINE_CACHE = "bv-dados-v1";
const isNativeApp = () =>
  typeof window !== "undefined" && Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
const cacheAvailable = () => isNativeApp() && typeof caches !== "undefined";

/**
 * No app: devolve a resposta da rede e guarda uma cópia; se a rede falhar (sem internet, fonte fora do ar),
 * devolve a última cópia guardada. No navegador não faz nada além de buscar (lá quem cuida é o proxy/SW).
 */
export async function withOfflineCache(key: string, load: () => Promise<Response>, signal?: AbortSignal): Promise<Response> {
  if (!cacheAvailable()) return load();
  const fromCache = () => caches.open(OFFLINE_CACHE).then((c) => c.match(key)).catch(() => undefined);
  try {
    const res = await load();
    if (res.ok) {
      const copy = res.clone();
      caches.open(OFFLINE_CACHE).then((c) => c.put(key, copy)).catch(() => {});
      return res;
    }
    return (await fromCache()) ?? res;
  } catch (e) {
    if (signal?.aborted) throw e;
    const hit = await fromCache();
    if (hit) return hit;
    throw e;
  }
}

/** Mesmo princípio para resultados já processados (ex.: lista de bibliotecas perto de um ponto). */
export async function withOfflineJson<T>(key: string, load: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!cacheAvailable()) return load();
  const url = `https://cache.bibliotecaviva.local/${encodeURIComponent(key)}`;
  try {
    const value = await load();
    caches
      .open(OFFLINE_CACHE)
      .then((c) => c.put(url, new Response(JSON.stringify(value), { headers: { "content-type": "application/json" } })))
      .catch(() => {});
    return value;
  } catch (e) {
    if (signal?.aborted) throw e;
    const hit = await caches.open(OFFLINE_CACHE).then((c) => c.match(url)).catch(() => undefined);
    if (hit) return (await hit.json()) as T;
    throw e;
  }
}

/** Overpass pelo proxy; devolve null para o chamador tentar os espelhos diretamente. */
export async function overpassViaProxy(query: string, signal?: AbortSignal): Promise<Response | null> {
  if (!canUseProxy()) return null;
  try {
    const res = await fetch(`/api/overpass?data=${encodeURIComponent(query)}`, { signal });
    return res.ok ? res : null;
  } catch (e) {
    if (signal?.aborted) throw e;
    return null;
  }
}
