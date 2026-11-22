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
  return fetch(`https://openlibrary.org/${path}`, { signal });
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
