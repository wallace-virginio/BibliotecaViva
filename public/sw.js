/* Biblioteca Viva — service worker (offline básico)
 * - Navegação: network-first, com fallback para a última versão em cache (app shell).
 * - Assets do build, fontes, capas e tiles do mapa: stale-while-revalidate.
 * - APIs (Open Library, Overpass, Nominatim): network-first com fallback ao cache.
 */
const VERSION = "bv-v1";
const SHELL = ["/", "/mapa", "/acervo", "/eventos", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const STATIC_HOSTS = ["covers.openlibrary.org", "tile.openstreetmap.org", "upload.wikimedia.org"];
const API_HOSTS = ["openlibrary.org", "overpass-api.de", "nominatim.openstreetmap.org", "commons.wikimedia.org", "wikipedia.org"];

async function staleWhileRevalidate(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const net = fetch(req)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || net;
}

async function networkFirst(req, fallbackUrl) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (fallbackUrl && (await cache.match(fallbackUrl))) || Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") return e.respondWith(networkFirst(req, "/"));
  if (url.origin === location.origin && /\.(js|css|png|svg|woff2?)$/.test(url.pathname)) return e.respondWith(staleWhileRevalidate(req));
  if (STATIC_HOSTS.some((h) => url.hostname.endsWith(h))) return e.respondWith(staleWhileRevalidate(req));
  if (API_HOSTS.some((h) => url.hostname.endsWith(h))) return e.respondWith(networkFirst(req));
});
