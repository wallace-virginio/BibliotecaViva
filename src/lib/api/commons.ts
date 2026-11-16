/**
 * Fotos reais próximas a uma coordenada via Wikimedia Commons, e resumos da Wikipédia.
 * Gratuito, sem chave (CORS via origin=*).
 */
export type Photo = { url: string; thumb: string; title: string; credit?: string };

const cache = new Map<string, Photo[]>();

export async function photosNear(lat: number, lon: number, radius = 250, signal?: AbortSignal): Promise<Photo[]> {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)},${radius}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "geosearch",
    ggscoord: `${lat}|${lon}`,
    ggsradius: String(radius),
    ggsnamespace: "6",
    ggslimit: "10",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "900",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal });
  if (!res.ok) return [];
  const json = await res.json();
  const pages = Object.values(json?.query?.pages ?? {}) as {
    title: string;
    imageinfo?: { url: string; thumburl: string; extmetadata?: { Artist?: { value: string } } }[];
  }[];
  const photos = pages
    .filter((p) => p.imageinfo?.[0] && /\.(jpe?g|png|webp)$/i.test(p.title))
    .map((p) => {
      const info = p.imageinfo![0];
      return {
        url: info.url,
        thumb: info.thumburl,
        title: p.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""),
        credit: info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, "").trim(),
      };
    });
  cache.set(key, photos);
  return photos;
}

export async function wikiSummary(title: string, lang = "pt", signal?: AbortSignal) {
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
    signal,
  });
  if (!res.ok) return undefined;
  const j = await res.json();
  return {
    extract: j.extract as string,
    image: (j.originalimage?.source ?? j.thumbnail?.source) as string | undefined,
    url: j.content_urls?.desktop?.page as string | undefined,
  };
}
