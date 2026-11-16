import { useRef, useSyncExternalStore } from "react";

/**
 * Store local (localStorage) de favoritos, reservas, histórico, progresso de leitura e preferências.
 * Quando o usuário está logado, `lib/sync.ts` espelha o estado na tabela `user_state` do Supabase.
 */
export type SavedBook = { id: string; title: string; author?: string; coverId?: number; savedAt: number };
export type Reservation = {
  id: string;
  kind: "livro" | "sala" | "computador" | "evento";
  title: string;
  subtitle?: string;
  when: string;
  createdAt: number;
  /** Para reservas de livro: id da obra no Open Library e capa. */
  bookId?: string;
  author?: string;
  coverId?: number;
};
export type ReadingProgress = {
  id: string;
  title: string;
  author?: string;
  coverId?: number;
  /** 0–100 */
  percent: number;
  chapter?: number;
  /** posição de rolagem dentro do capítulo (0–1) */
  offset?: number;
  updatedAt: number;
};
export type ReaderPrefs = { fontSize: number; theme: "claro" | "sepia" | "escuro"; font: "serif" | "sans" };

export type State = {
  favorites: SavedBook[];
  history: SavedBook[];
  reservations: Reservation[];
  followedLibraries: string[];
  reading: Record<string, ReadingProgress>;
  readerPrefs: ReaderPrefs;
  /** Ativado pelo próprio usuário em Configurações → Desenvolvedor. */
  developerMode: boolean;
};

const KEY = "bv-state-v1";
export const emptyState: State = {
  favorites: [],
  history: [],
  reservations: [],
  followedLibraries: [],
  reading: {},
  readerPrefs: { fontSize: 19, theme: "claro", font: "serif" },
  developerMode: false,
};
let state: State = emptyState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...emptyState, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

function set(updater: (s: State) => State) {
  load();
  state = updater(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeStore(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getState() {
  load();
  return state;
}

export function useStore<T>(selector: (s: State) => T): T {
  // Memoiza o resultado por versão do estado: seletores podem retornar arrays/objetos novos.
  const cache = useRef<{ s?: State; v?: T }>({});
  const serverCache = useRef<{ v?: T; done?: boolean }>({});
  const get = () => {
    load();
    if (cache.current.s !== state) cache.current = { s: state, v: selector(state) };
    return cache.current.v as T;
  };
  const getServer = () => {
    if (!serverCache.current.done) serverCache.current = { v: selector(emptyState), done: true };
    return serverCache.current.v as T;
  };
  return useSyncExternalStore(subscribeStore, get, getServer);
}

export const actions = {
  /** Substitui o estado inteiro (usado pela sincronização com o Supabase). */
  replace(next: State) {
    set(() => ({ ...emptyState, ...next }));
  },
  /** Limpa os dados locais (logout), mantendo só as preferências do leitor. */
  reset() {
    set((s) => ({ ...emptyState, readerPrefs: s.readerPrefs }));
  },
  setDeveloperMode(on: boolean) {
    set((s) => ({ ...s, developerMode: on }));
  },
  toggleFavorite(book: Omit<SavedBook, "savedAt">) {
    set((s) => {
      const exists = s.favorites.some((b) => b.id === book.id);
      return {
        ...s,
        favorites: exists ? s.favorites.filter((b) => b.id !== book.id) : [{ ...book, savedAt: Date.now() }, ...s.favorites],
      };
    });
  },
  pushHistory(book: Omit<SavedBook, "savedAt">) {
    set((s) => ({
      ...s,
      history: [{ ...book, savedAt: Date.now() }, ...s.history.filter((b) => b.id !== book.id)].slice(0, 20),
    }));
  },
  reserve(r: Omit<Reservation, "createdAt">) {
    set((s) => ({
      ...s,
      reservations: [{ ...r, createdAt: Date.now() }, ...s.reservations.filter((x) => x.id !== r.id)],
    }));
  },
  cancelReservation(id: string) {
    set((s) => ({ ...s, reservations: s.reservations.filter((x) => x.id !== id) }));
  },
  toggleFollowLibrary(slug: string) {
    set((s) => ({
      ...s,
      followedLibraries: s.followedLibraries.includes(slug)
        ? s.followedLibraries.filter((x) => x !== slug)
        : [...s.followedLibraries, slug],
    }));
  },
  saveProgress(p: Omit<ReadingProgress, "updatedAt">) {
    set((s) => ({ ...s, reading: { ...s.reading, [p.id]: { ...s.reading[p.id], ...p, updatedAt: Date.now() } } }));
  },
  setReaderPrefs(p: Partial<ReaderPrefs>) {
    set((s) => ({ ...s, readerPrefs: { ...s.readerPrefs, ...p } }));
  },
};
