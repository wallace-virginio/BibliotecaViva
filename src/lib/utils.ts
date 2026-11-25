import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { activeTag } from "./locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic PRNG (mulberry32) seeded by a string — used to derive stable mock data. */
export function seeded(seed: string | number) {
  let h = 1779033703 ^ String(seed).length;
  for (const ch of String(seed)) {
    h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    bool: (p = 0.5) => next() < p,
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
  };
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Formatadores seguem o idioma da tela (lib/locale.ts): "1,5 km" em português, "1.5 km" em inglês.
export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toLocaleString(activeTag(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
  return `${Math.round(km).toLocaleString(activeTag())} km`;
}

export function formatNumber(n: number) {
  return n.toLocaleString(activeTag());
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat(activeTag(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Parte do dia, para a saudação no idioma da tela: t.greeting[greetingKey()]. */
export function greetingKey(date = new Date()): "morning" | "afternoon" | "evening" {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export function greeting(date = new Date()) {
  return { morning: "Bom dia", afternoon: "Boa tarde", evening: "Boa noite" }[greetingKey(date)];
}
