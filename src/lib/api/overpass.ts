/**
 * Bibliotecas reais do OpenStreetMap via Overpass API (gratuita, sem chave).
 * https://wiki.openstreetmap.org/wiki/Overpass_API
 */
export type OsmLibrary = {
  osmId: string; // ex: node-123
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

type Element = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function overpass(query: string, signal?: AbortSignal, maxMirrors = ENDPOINTS.length, timeoutMs = 12_000): Promise<{ elements: Element[] }> {
  let lastErr: unknown;
  for (const url of ENDPOINTS.slice(0, maxMirrors)) {
    try {
      // cada espelho tem um tempo limite; se falhar, tenta o próximo
      const t = AbortSignal.timeout(timeoutMs);
      const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: query }), signal: signal ? AbortSignal.any([signal, t]) : t });
      if (res.ok) return await res.json();
      lastErr = new Error(`Overpass ${res.status}`);
    } catch (e) {
      if (signal?.aborted) throw e;
      lastErr = e;
    }
  }
  throw lastErr;
}

const toLib = (e: Element): OsmLibrary => ({
  osmId: `${e.type}-${e.id}`,
  name: e.tags?.name ?? "Biblioteca",
  lat: e.lat ?? e.center?.lat ?? 0,
  lon: e.lon ?? e.center?.lon ?? 0,
  tags: e.tags ?? {},
});

const cache = new Map<string, OsmLibrary[]>();

export async function librariesAround(
  lat: number,
  lon: number,
  radiusM = 6000,
  signal?: AbortSignal,
): Promise<OsmLibrary[]> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)},${radiusM}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const q = `[out:json][timeout:25];nwr["amenity"="library"]["name"](around:${radiusM},${lat},${lon});out center tags 80;`;
  // Overpass e Nominatim em paralelo: usa a primeira fonte que responder com sucesso
  // (os servidores públicos do Overpass às vezes ficam sobrecarregados).
  const libs = await Promise.any([
    overpass(q, signal, 2, 8_000).then((json) => json.elements.map(toLib).filter((l) => l.lat && l.lon)),
    nominatimLibraries(lat, lon, radiusM, signal),
  ]).catch((e: AggregateError) => {
    throw e.errors?.[0] ?? e;
  });
  cache.set(key, libs);
  return libs;
}

export async function libraryByOsmId(osmId: string, signal?: AbortSignal): Promise<OsmLibrary | undefined> {
  const [type, id] = osmId.split("-");
  if (!["node", "way", "relation"].includes(type) || !/^\d+$/.test(id ?? "")) return undefined;
  try {
    const params = new URLSearchParams({ osm_ids: `${type[0].toUpperCase()}${id}`, format: "jsonv2", extratags: "1", addressdetails: "1" });
    const res = await fetch(`https://nominatim.openstreetmap.org/lookup?${params}`, { signal });
    const [hit] = (await res.json()) as NominatimPlace[];
    if (hit) return fromNominatim(hit);
  } catch (e) {
    if (signal?.aborted) throw e;
  }
  const json = await overpass(`[out:json][timeout:25];${type}(${id});out center tags;`, signal);
  const e = json.elements[0];
  return e ? toLib(e) : undefined;
}

/* ---------- Fallback: Nominatim (busca estruturada amenity=library) ---------- */
type NominatimPlace = {
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string>;
};

function fromNominatim(p: NominatimPlace): OsmLibrary {
  const a = p.address ?? {};
  const tags: Record<string, string> = { ...(p.extratags ?? {}) };
  if (a.road) tags["addr:street"] = a.road;
  if (a.house_number) tags["addr:housenumber"] = a.house_number;
  if (a.suburb) tags["addr:suburb"] = a.suburb;
  const city = a.city || a.town || a.village || a.municipality;
  if (city) tags["addr:city"] = city;
  if (a.country) tags["addr:country"] = a.country;
  return { osmId: `${p.osm_type}-${p.osm_id}`, name: p.name || p.display_name.split(",")[0], lat: +p.lat, lon: +p.lon, tags };
}

async function nominatimLibraries(lat: number, lon: number, radiusM: number, signal?: AbortSignal) {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const params = new URLSearchParams({
    amenity: "library",
    format: "jsonv2",
    viewbox: `${lon - dLon},${lat + dLat},${lon + dLon},${lat - dLat}`,
    bounded: "1",
    limit: "40",
    extratags: "1",
    addressdetails: "1",
    "accept-language": "pt-BR",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return ((await res.json()) as NominatimPlace[]).filter((p) => p.name).map(fromNominatim);
}
