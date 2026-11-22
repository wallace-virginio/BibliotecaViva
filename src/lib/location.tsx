import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { FEATURED_LIBRARIES, fromOsm, type Library } from "@/data/libraries";
import { browserLocation, reverseGeocode } from "./api/geo";
import { librariesAround } from "./api/overpass";
import { useAsync } from "./hooks";
import { haversineKm } from "./utils";

/**
 * Localização do usuário definida UMA vez por sessão e usada no app inteiro
 * (mapa, livro mais próximo, eventos, salas, acervo).
 *
 * Privacidade: só é obtida quando a pessoa escolhe (GPS ou cidade), fica no sessionStorage
 * deste aparelho e some quando a sessão do navegador termina. Nada vai para o servidor.
 */
export type UserLocation = { lat: number; lon: number; label: string; source: "gps" | "cidade" };

const KEY = "bv-location";
const ASKED = "bv-location-asked";

type Ctx = {
  location: UserLocation | null;
  ready: boolean;
  setLocation: (l: UserLocation | null) => void;
  locateWithGps: () => Promise<UserLocation>;
  /** abre o seletor "Onde você está?" */
  ask: () => void;
  sheetOpen: boolean;
  closeSheet: () => void;
  /** abre o seletor só se ainda não houver localização nem tiver sido perguntado nesta sessão */
  askOnce: () => void;
};

const LocationContext = createContext<Ctx | null>(null);

function read<T>(k: string): T | null {
  try {
    const raw = sessionStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLoc] = useState<UserLocation | null>(null);
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setLoc(read<UserLocation>(KEY));
    setReady(true);
  }, []);

  const setLocation = useCallback((l: UserLocation | null) => {
    setLoc(l);
    try {
      if (l) sessionStorage.setItem(KEY, JSON.stringify(l));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* armazenamento indisponível: vale só nesta tela */
    }
  }, []);

  const markAsked = () => {
    try {
      sessionStorage.setItem(ASKED, "1");
    } catch {
      /* ignore */
    }
  };

  const locateWithGps = useCallback(async () => {
    const p = await browserLocation();
    const r = await reverseGeocode(p.lat, p.lon).catch(() => undefined);
    const loc: UserLocation = { lat: p.lat, lon: p.lon, label: r?.city ?? "Minha localização", source: "gps" };
    setLocation(loc);
    return loc;
  }, [setLocation]);

  const value = useMemo<Ctx>(
    () => ({
      location,
      ready,
      setLocation,
      locateWithGps,
      ask: () => {
        markAsked();
        setSheetOpen(true);
      },
      sheetOpen,
      closeSheet: () => {
        markAsked();
        setSheetOpen(false);
      },
      askOnce: () => {
        if (!ready || location || read<string>(ASKED)) return;
        markAsked();
        setSheetOpen(true);
      },
    }),
    [location, ready, sheetOpen, setLocation, locateWithGps],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation precisa estar dentro de <LocationProvider>");
  return ctx;
}

/** Pede a localização (uma vez por sessão) assim que uma tela que depende dela abre. */
export function useAskLocationOnce() {
  const { askOnce, ready } = useLocation();
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(askOnce, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}

/**
 * Bibliotecas perto da localização da sessão (OpenStreetMap + conectadas num raio de 40 km),
 * ordenadas pela distância. Compartilhado entre telas (cache por coordenada no módulo overpass).
 */
export function useNearbyLibraries(radiusM = 8000) {
  const { location } = useLocation();
  const key = location ? `${location.lat.toFixed(3)},${location.lon.toFixed(3)}` : "";
  const state = useAsync<{ lib: Library; km: number }[]>(
    async (signal) => {
      if (!location) return [];
      const osm = await librariesAround(location.lat, location.lon, radiusM, signal).catch(() => []);
      const seen = new Set<string>();
      const featured = FEATURED_LIBRARIES.filter((l) => haversineKm(location, l) < 40);
      // A mesma biblioteca pode vir da rede e do OpenStreetMap: a conectada vence (até 200 m de distância).
      const osmOnly = osm.map(fromOsm).filter((o) => !featured.some((f) => haversineKm(f, o) < 0.2));
      const all = [...featured, ...osmOnly];
      return all
        .filter((l) => (seen.has(l.slug) ? false : (seen.add(l.slug), true)))
        .map((lib) => ({ lib, km: haversineKm(location, lib) }))
        .sort((a, b) => a.km - b.km);
    },
    [key, radiusM],
  );
  return { ...state, location };
}
