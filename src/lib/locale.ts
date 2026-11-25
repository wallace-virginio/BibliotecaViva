/**
 * Idiomas da interface e o idioma "ativo" para quem formata fora do React (números, distâncias, datas).
 * Sem dependências: pode ser importado por utilitários e pelo servidor.
 */
export type Locale = "pt" | "en" | "es";

export const LOCALES: { value: Locale; label: string; short: string; tag: string }[] = [
  { value: "pt", label: "Português", short: "PT", tag: "pt-BR" },
  { value: "en", label: "English", short: "EN", tag: "en" },
  { value: "es", label: "Español", short: "ES", tag: "es" },
];

export const LANG_KEY = "bv-lang";

export function isLocale(v: unknown): v is Locale {
  return v === "pt" || v === "en" || v === "es";
}

/** Tag BCP 47 do idioma ("pt" → "pt-BR"), para `<html lang>` e `toLocaleString`. */
export function localeTag(l: Locale) {
  return LOCALES.find((x) => x.value === l)!.tag;
}

/** "pt-BR" / "en-US" / "es-419" → Locale (o que vier fora dos três vira inglês). */
export function localeFromTag(tag?: string | null): Locale {
  const base = (tag ?? "").toLowerCase().split("-")[0];
  return isLocale(base) ? base : base ? "en" : "pt";
}

/**
 * Escolhe o idioma a partir do Accept-Language (ou da lista do navegador, separada por vírgula).
 * Respeita a ordem de preferência; quem não fala nenhum dos três recebe inglês, e sem informação nenhuma, português.
 */
export function pickLocale(header?: string | null): Locale {
  if (!header?.trim()) return "pt";
  const prefs = header
    .split(",")
    .map((p, i) => {
      const [tag, ...params] = p.trim().split(";");
      const q = params.map((x) => x.trim()).find((x) => x.startsWith("q="));
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((p) => p.base && p.base !== "*" && p.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const p of prefs) if (isLocale(p.base)) return p.base;
  return prefs.length ? "en" : "pt";
}

let active: Locale = "pt";

/** Chamado pelo I18nProvider a cada renderização: os formatadores de lib/utils seguem o idioma da tela. */
export function setActiveLocale(l: Locale) {
  active = l;
}

export function activeLocale() {
  return active;
}

export function activeTag() {
  return localeTag(active);
}
