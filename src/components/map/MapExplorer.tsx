import { ClientOnly } from "@tanstack/react-router";
import { Globe2, List, Loader2, LocateFixed, MapPin, RefreshCw, Search, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FEATURED_LIBRARIES, fromOsm, type Library } from "@/data/libraries";
import { browserLocation, geocode, reverseGeocode, DEFAULT_LOCATION, type GeoPoint, type Place } from "@/lib/api/geo";
import { librariesAround } from "@/lib/api/overpass";
import { useDebounce } from "@/lib/hooks";
import { cn, formatDistance, haversineKm } from "@/lib/utils";
import { Badge } from "../ui";
import { LibraryPanel, OpenBadge } from "./LibraryPanel";
import type { MapView } from "./LibraryMap.client";

const LibraryMap = lazy(() => import("./LibraryMap.client"));

const WORLD: MapView = { lat: 20, lon: 0, zoom: 2 };

export function MapExplorer({ className, initialFocus, fullscreen = false }: { className?: string; initialFocus?: string; fullscreen?: boolean }) {
  const [showList, setShowList] = useState(false);
  const [user, setUser] = useState<GeoPoint>();
  const [locStatus, setLocStatus] = useState<"idle" | "locating" | "done" | "denied">("idle");
  const [view, setView] = useState<MapView>(WORLD);
  const [nearby, setNearby] = useState<Library[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState(false);
  const [active, setActive] = useState<Library>();
  const [mapCenter, setMapCenter] = useState<MapView>(WORLD);
  const [searchedCenter, setSearchedCenter] = useState<{ lat: number; lon: number }>();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const debounced = useDebounce(query, 400);
  const ctrl = useRef<AbortController | null>(null);

  const loadAround = useCallback(async (lat: number, lon: number) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoadingNearby(true);
    setNearbyError(false);
    setSearchedCenter({ lat, lon });
    try {
      const osm = await librariesAround(lat, lon, 7000, c.signal);
      if (!c.signal.aborted) setNearby(osm.map(fromOsm));
    } catch (e) {
      if ((e as Error).name !== "AbortError") setNearbyError(true);
    } finally {
      if (!c.signal.aborted) setLoadingNearby(false);
    }
  }, []);

  const focusOn = useCallback(
    (p: { lat: number; lon: number }, zoom = 13) => {
      setView({ lat: p.lat, lon: p.lon, zoom });
      loadAround(p.lat, p.lon);
    },
    [loadAround],
  );

  // Privacidade (LGPD): nenhuma localização é obtida automaticamente.
  // O mapa abre numa cidade padrão; a posição real só é usada quando a pessoa toca em "Perto de mim"
  // e autoriza no próprio aparelho.
  useEffect(() => {
    const focus = initialFocus ? FEATURED_LIBRARIES.find((l) => l.slug === initialFocus) : undefined;
    if (focus) {
      setActive(focus);
      focusOn(focus, 14);
    } else {
      focusOn(DEFAULT_LOCATION, 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locateMe = async () => {
    setLocStatus("locating");
    try {
      const p = await browserLocation();
      const r = await reverseGeocode(p.lat, p.lon).catch(() => undefined);
      const loc = { ...p, ...r };
      setUser(loc);
      focusOn(loc, 14);
      setLocStatus("done");
    } catch {
      // permissão negada ou GPS indisponível: continua na cidade atual do mapa
      setLocStatus("denied");
    }
  };

  useEffect(() => {
    if (debounced.trim().length < 3) {
      setPlaces([]);
      return;
    }
    const c = new AbortController();
    geocode(debounced, c.signal).then(setPlaces).catch(() => {});
    return () => c.abort();
  }, [debounced]);

  const all = useMemo(() => {
    const seen = new Set(nearby.map((l) => l.slug));
    return [...nearby, ...FEATURED_LIBRARIES.filter((l) => !seen.has(l.slug))];
  }, [nearby]);

  const ref = user ?? DEFAULT_LOCATION;
  const sortedNearby = useMemo(
    () =>
      [...nearby, ...FEATURED_LIBRARIES.filter((l) => searchedCenter && haversineKm(searchedCenter, l) < 30)]
        .map((l) => ({ lib: l, d: haversineKm(searchedCenter ?? ref, l) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 30),
    [nearby, searchedCenter, ref],
  );

  const movedAway =
    searchedCenter && mapCenter.zoom >= 11 && haversineKm(searchedCenter, mapCenter) > 6;

  const listBody = (
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingNearby && !nearby.length
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton m-2 h-[68px] rounded-2xl" />)
              : sortedNearby.map(({ lib, d }) => (
                  <button
                    key={lib.slug}
                    onClick={() => { setShowList(false); setActive(lib); setView({ lat: lib.lat, lon: lib.lon, zoom: Math.max(mapCenter.zoom, 15) }); }}
                    className={cn("flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-2", active?.slug === lib.slug && "bg-primary-soft/60")}
                  >
                    <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", lib.featured ? "bg-deep" : "bg-primary")} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{lib.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDistance(d)} · ★ {lib.rating.toFixed(1)} · {lib.kind}
                      </p>
                      <div className="mt-1.5"><OpenBadge lib={lib} /></div>
                    </div>
                  </button>
                ))}
            {nearbyError && <p className="p-4 text-sm text-muted-foreground">Não foi possível consultar o OpenStreetMap agora. Mostrando bibliotecas conectadas.</p>}
            {!loadingNearby && !nearbyError && sortedNearby.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma biblioteca mapeada nesta área ainda. Que tal ajudar a mapear no OpenStreetMap?</p>
            )}
          </div>
  );

  return (
    <div className={cn("relative overflow-hidden bg-surface", fullscreen ? "h-full" : "rounded-[2rem] border shadow-elevated", className)}>
      <div className={cn("grid lg:grid-cols-[360px_1fr]", fullscreen ? "h-full" : "h-[72dvh] min-h-[520px] md:h-[680px]")}>
        {/* Lista lateral */}
        <div className="hidden min-h-0 flex-col border-r lg:flex">
          <div className="space-y-3 border-b p-4">
            <CitySearch query={query} setQuery={setQuery} places={places} onPick={(p) => { setQuery(""); setPlaces([]); focusOn(p, 13); }} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" />
                {locStatus === "locating"
                  ? "Obtendo sua localização…"
                  : locStatus === "denied"
                    ? "Localização não autorizada"
                    : user
                      ? user.city ?? "Sua localização"
                      : "São Paulo · toque em “Perto de mim”"}
              </span>
              <span>{loadingNearby ? "Buscando…" : `${sortedNearby.length} por perto`}</span>
            </div>
          </div>
          {listBody}
        </div>

        {/* Mapa */}
        <div className="relative min-h-0">
          <ClientOnly fallback={<div className="skeleton size-full rounded-none" />}>
            <Suspense fallback={<div className="skeleton size-full rounded-none" />}>
              <LibraryMap
                className="size-full"
                libraries={all}
                activeSlug={active?.slug}
                user={user}
                view={view}
                onSelect={(l) => setActive(l)}
                onMoveEnd={setMapCenter}
              />
            </Suspense>
          </ClientOnly>

          {/* Controles */}
          <div className={cn("pointer-events-none absolute inset-x-3 top-3 z-[500] flex flex-wrap items-start gap-2", fullscreen && "max-lg:top-[calc(env(safe-area-inset-top)+0.75rem)]")}>
            <div className="pointer-events-auto w-full max-w-sm lg:hidden">
              <CitySearch query={query} setQuery={setQuery} places={places} onPick={(p) => { setQuery(""); setPlaces([]); focusOn(p, 13); }} />
            </div>
            <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto scrollbar-none">
              <button onClick={locateMe} className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border glass px-4 text-sm font-medium shadow-soft">
                {locStatus === "locating" ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4 text-primary" />}
                <span className="max-sm:hidden">Perto de mim</span><span className="sm:hidden">Perto</span>
              </button>
              <button onClick={() => setView({ ...WORLD })} className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border glass px-4 text-sm font-medium shadow-soft">
                <Globe2 className="size-4 text-primary" /> Mundo
              </button>
              <button onClick={() => setShowList(true)} className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border glass px-4 text-sm font-medium shadow-soft lg:hidden">
                <List className="size-4 text-primary" /> Lista · {sortedNearby.length}
              </button>
            </div>
          </div>
          {movedAway && !loadingNearby && (
            <button
              onClick={() => loadAround(mapCenter.lat, mapCenter.lon)}
              className="absolute top-28 left-1/2 z-[500] flex -translate-x-1/2 animate-fade-up items-center gap-2 whitespace-nowrap rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-elevated lg:top-3"
            >
              <RefreshCw className="size-4" /> Buscar nesta área
            </button>
          )}
          {loadingNearby && (
            <div className="absolute top-28 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border glass px-4 py-2 text-sm shadow-soft lg:top-3">
              <Loader2 className="size-4 animate-spin text-primary" /> Buscando bibliotecas…
            </div>
          )}
          <div className="absolute bottom-3 left-3 z-[500] hidden gap-2 sm:flex">
            <Badge tone="glass"><span className="size-2 rounded-full bg-deep" /> Conectada</Badge>
            <Badge tone="glass"><span className="size-2 rounded-full bg-primary" /> OpenStreetMap</Badge>
          </div>

          {/* Lista em bottom sheet (celular) */}
          {showList && (
            <div className="absolute inset-0 z-[650] flex flex-col justify-end bg-overlay lg:hidden" onClick={() => setShowList(false)}>
              <div className="flex max-h-[75%] animate-fade-up flex-col rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-elevated" onClick={(e) => e.stopPropagation()}>
                <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border-strong" />
                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                  <p className="font-semibold">{sortedNearby.length} bibliotecas por perto</p>
                  <button onClick={() => setShowList(false)} className="grid size-9 place-items-center rounded-full bg-surface-2" aria-label="Fechar lista"><X className="size-4" /></button>
                </div>
                {listBody}
              </div>
            </div>
          )}

          {/* Painel lateral estilo Google Maps */}
          {active && (
            <LibraryPanel
              key={active.slug}
              lib={active}
              user={user}
              onClose={() => setActive(undefined)}
              className="absolute inset-x-0 bottom-0 z-[600] max-h-[78%] animate-fade-up rounded-t-3xl border-t shadow-elevated md:inset-y-3 md:right-3 md:left-auto md:max-h-none md:w-[380px] md:animate-slide-in-right md:rounded-3xl md:border"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CitySearch({
  query,
  setQuery,
  places,
  onPick,
}: {
  query: string;
  setQuery: (q: string) => void;
  places: Place[];
  onPick: (p: Place) => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && places[0] && onPick(places[0])}
        placeholder="Explorar outra cidade…"
        className="h-10 w-full rounded-full border bg-surface pr-4 pl-10 text-sm shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
      />
      {places.length > 0 && (
        <ul className="absolute inset-x-0 top-12 z-[700] overflow-hidden rounded-2xl border bg-surface shadow-elevated">
          {places.map((p) => (
            <li key={`${p.lat},${p.lon}`}>
              <button onClick={() => onPick(p)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-surface-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="line-clamp-2">{p.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
