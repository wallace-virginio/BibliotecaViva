/**
 * Localização e geocodificação gratuitas:
 *  - Geolocation API do navegador
 *  - Nominatim / OpenStreetMap (busca e reverse)    https://nominatim.org
 */
export type GeoPoint = {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  source: "gps" | "default" | "search";
};

export const DEFAULT_LOCATION: GeoPoint = {
  lat: -23.5505,
  lon: -46.6333,
  city: "São Paulo",
  country: "Brasil",
  source: "default",
};

export async function browserLocation(timeout = 8000): Promise<GeoPoint> {
  // No app nativo (Capacitor) usa o GPS do sistema com as permissões do iOS/Android.
  const { nativeLocation } = await import("../native");
  const native = await nativeLocation().catch(() => undefined);
  if (native) return { ...native, source: "gps" };
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject(new Error("Sem geolocalização"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, source: "gps" }),
      (e) => reject(e),
      { enableHighAccuracy: false, timeout, maximumAge: 600_000 },
    );
  });
}

export type Place = { name: string; displayName: string; lat: number; lon: number; type: string };

export async function geocode(q: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q, format: "jsonv2", limit: "5", "accept-language": "pt-BR" });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { name: string; display_name: string; lat: string; lon: string; type: string }[];
  return json.map((p) => ({
    name: p.name || p.display_name.split(",")[0],
    displayName: p.display_name,
    lat: +p.lat,
    lon: +p.lon,
    type: p.type,
  }));
}

export async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    zoom: "10",
    "accept-language": "pt-BR",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal });
  if (!res.ok) return undefined;
  const j = await res.json();
  const a = j.address ?? {};
  return { city: a.city || a.town || a.village || a.municipality || a.county, country: a.country } as {
    city?: string;
    country?: string;
  };
}
