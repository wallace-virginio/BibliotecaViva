/**
 * Idioma da interface (pt, en, es).
 *
 * - Site: o servidor decide antes de renderizar (cookie `bv-lang`, senão o Accept-Language do navegador), então a
 *   página já chega no idioma certo, sem piscar. No navegador, o idioma inicial é lido do cookie / `<html lang>`.
 * - App nativo: o HTML é pré-renderizado em português; logo depois de abrir, troca para o idioma salvo ou o do aparelho.
 * - Trocar no seletor grava o cookie (site) e o localStorage (app) — vale para as próximas visitas.
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "@/i18n/en";
import es from "@/i18n/es";
import pt, { type Messages } from "@/i18n/pt";
import { isLocale, LANG_KEY, localeFromTag, localeTag, pickLocale, setActiveLocale, type Locale } from "./locale";
import { IS_APP } from "./platform";

export type { Locale, Messages };
export { LOCALES } from "./locale";

const MESSAGES: Record<Locale, Messages> = { pt, en, es };

/** Textos de um idioma (para quem está fora do React, ex.: mensagens de erro). */
export function messagesFor(l: Locale): Messages {
  return MESSAGES[l];
}

/** Idioma com que a página é renderizada pela primeira vez (servidor e hidratação têm de concordar). */
const initialLocale = createIsomorphicFn()
  .server((): Locale => {
    if (IS_APP) return "pt";
    try {
      const saved = getCookie(LANG_KEY);
      return isLocale(saved) ? saved : pickLocale(getRequestHeader("accept-language"));
    } catch {
      return "pt"; // pré-renderização sem requisição
    }
  })
  .client((): Locale => {
    if (IS_APP) return "pt";
    const m = document.cookie.match(/(?:^|;\s*)bv-lang=(pt|en|es)\b/);
    return m ? (m[1] as Locale) : localeFromTag(document.documentElement.lang);
  });

type Ctx = { locale: Locale; t: Messages; setLocale: (l: Locale) => void };
const I18nContext = createContext<Ctx>({ locale: "pt", t: pt, setLocale: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setState] = useState<Locale>(() => initialLocale());
  setActiveLocale(locale);

  // app nativo: preferência salva ou idioma do aparelho
  useEffect(() => {
    if (!IS_APP) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {
      /* sem armazenamento */
    }
    const next = isLocale(saved) ? saved : pickLocale((navigator.languages ?? [navigator.language]).join(","));
    if (next !== "pt") setState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeTag(locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setState(l);
    document.cookie = `${LANG_KEY}=${l}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ locale, t: MESSAGES[locale], setLocale }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Atalho: só os textos. `const t = useT(); t.nav.acervo` */
export function useT() {
  return useContext(I18nContext).t;
}

/**
 * Título da aba no idioma da tela. O `head()` das rotas é renderizado em português no servidor;
 * este efeito troca logo depois de abrir a página e quando a pessoa muda o idioma.
 */
export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
