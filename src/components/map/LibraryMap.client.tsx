import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Library } from "@/data/libraries";
import { useT } from "@/lib/i18n";

export type MapView = { lat: number; lon: number; zoom: number };

type Props = {
  libraries: Library[];
  activeSlug?: string;
  user?: { lat: number; lon: number };
  view: MapView;
  onSelect: (lib: Library) => void;
  onMoveEnd?: (v: MapView) => void;
  className?: string;
};

// Tiles oficiais do OpenStreetMap (gratuitos, com atribuição). O modo escuro é aplicado via CSS.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function icon(lib: Library, active: boolean) {
  const pulse = lib.featured || lib.eventsToday.length > 0;
  return L.divIcon({
    className: "",
    html: `<div class="bv-marker ${lib.featured ? "featured" : ""} ${active ? "active" : ""}">${pulse ? '<span class="ring"></span>' : ""}<span class="dot"></span></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function LibraryMap({ libraries, activeSlug, user, view, onSelect, onMoveEnd, className }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const userLayer = useRef<L.Marker | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const cb = useRef({ onSelect, onMoveEnd });
  cb.current = { onSelect, onMoveEnd };

  // init
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      center: [view.lat, view.lon],
      zoom: view.zoom,
      zoomControl: false,
      worldCopyJump: true,
      minZoom: 2,
      scrollWheelZoom: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.tileLayer(TILE_URL, { attribution: ATTR, maxZoom: 19 }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    m.on("moveend", () => {
      const c = m.getCenter();
      cb.current.onMoveEnd?.({ lat: c.lat, lon: c.lng, zoom: m.getZoom() });
    });
    // habilita zoom de scroll só após clicar no mapa (evita “prender” a rolagem da página)
    m.on("click", () => m.scrollWheelZoom.enable());
    m.on("mouseout", () => m.scrollWheelZoom.disable());

    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // view changes
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    if (Math.abs(c.lat - view.lat) < 1e-4 && Math.abs(c.lng - view.lon) < 1e-4 && m.getZoom() === view.zoom) return;
    m.flyTo([view.lat, view.lon], view.zoom, { duration: 1.4 });
  }, [view.lat, view.lon, view.zoom]);

  // markers
  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.current.clear();
    for (const lib of libraries) {
      const mk = L.marker([lib.lat, lib.lon], { icon: icon(lib, lib.slug === activeSlug), riseOnHover: true })
        .bindTooltip(lib.name, { className: "bv-tip", direction: "top", offset: [0, -10] })
        .on("click", () => cb.current.onSelect(lib));
      mk.addTo(g);
      markers.current.set(lib.slug, mk);
    }
  }, [libraries, activeSlug]);

  // user marker
  const here = useT().map.youAreHere;
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    userLayer.current?.remove();
    if (user) {
      userLayer.current = L.marker([user.lat, user.lon], {
        icon: L.divIcon({ className: "", html: '<div class="bv-user"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }),
        zIndexOffset: 1000,
      })
        .bindTooltip(here, { className: "bv-tip", direction: "top", offset: [0, -10] })
        .addTo(m);
    }
  }, [user?.lat, user?.lon, here]);

  return <div ref={el} className={className} />;
}
