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
/** "Minha estante" — como a watchlist do Letterboxd. */
export type ShelfStatus = "quero-ler" | "lendo" | "lido";
export type ShelfItem = { id: string; title: string; author?: string; coverId?: number; status: ShelfStatus; addedAt: number };
export const SHELF_LABEL: Record<ShelfStatus, string> = { "quero-ler": "Quero ler", lendo: "Lendo", lido: "Lido" };

export type ReaderPrefs = { fontSize: number; theme: "claro" | "sepia" | "escuro"; font: "serif" | "sans" };

/** Configurações da pessoa (Configurações → Notificações). Salvas no aparelho e na conta. */
export type NotificationKey = "eventos" | "reservas" | "clubes";
export type Settings = { notificacoes: Record<NotificationKey, boolean>; localizacaoPrecisa: boolean };

export type State = {
  favorites: SavedBook[];
  history: SavedBook[];
  reservations: Reservation[];
  followedLibraries: string[];
  reading: Record<string, ReadingProgress>;
  shelf: Record<string, ShelfItem>;
  readerPrefs: ReaderPrefs;
  /** Ativado pelo próprio usuário em Configurações → Desenvolvedor. */
  developerMode: boolean;
  settings: Settings;
  /** Conquistas já ganhas: chave → quando (ms). Ver lib/badges.ts. */
  badges: Record<string, number>;
  /** Conversas feitas com o Ori (conta para a conquista). */
  oriChats: number;
  /** Comunidade: posts curtidos e pessoas seguidas. */
  community: { liked: string[]; following: string[] };
  /** Área do desenvolvedor: conectores instalados. */
  devConnectors: string[];
};

export const defaultSettings: Settings = { notificacoes: { eventos: true, reservas: true, clubes: true }, localizacaoPrecisa: false };

const KEY = "bv-state-v1";
export const emptyState: State = {
  favorites: [],
  history: [],
  reservations: [],
  followedLibraries: [],
  reading: {},
  shelf: {},
  readerPrefs: { fontSize: 19, theme: "claro", font: "serif" },
  developerMode: false,
  settings: defaultSettings,
  badges: {},
  oriChats: 0,
  community: { liked: [], following: [] },
  devConnectors: [],
};

/** Junta o que veio guardado com os padrões (dados antigos não têm os campos novos). */
export function normalizeState(raw: Partial<State> | null | undefined): State {
  const s = { ...emptyState, ...(raw ?? {}) };
  return {
    ...s,
    settings: { ...defaultSettings, ...s.settings, notificacoes: { ...defaultSettings.notificacoes, ...s.settings?.notificacoes } },
    community: { liked: s.community?.liked ?? [], following: s.community?.following ?? [] },
    badges: s.badges ?? {},
    devConnectors: s.devConnectors ?? [],
    oriChats: s.oriChats ?? 0,
  };
}
let state: State = emptyState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = normalizeState(JSON.parse(raw));
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
    set(() => normalizeState(next));
  },
  setNotification(key: NotificationKey, on: boolean) {
    set((s) => ({ ...s, settings: { ...s.settings, notificacoes: { ...s.settings.notificacoes, [key]: on } } }));
  },
  setPreciseLocation(on: boolean) {
    set((s) => ({ ...s, settings: { ...s.settings, localizacaoPrecisa: on } }));
  },
  /** Guarda a data das conquistas recém-ganhas (as já guardadas mantêm a data original). */
  markBadges(keys: string[]) {
    if (!keys.length) return;
    set((s) => ({ ...s, badges: { ...Object.fromEntries(keys.map((k) => [k, Date.now()])), ...s.badges } }));
  },
  countOriChat() {
    set((s) => ({ ...s, oriChats: s.oriChats + 1 }));
  },
  toggleLike(postId: string) {
    set((s) => {
      const liked = s.community.liked.includes(postId) ? s.community.liked.filter((x) => x !== postId) : [...s.community.liked, postId];
      return { ...s, community: { ...s.community, liked } };
    });
  },
  toggleFollowMember(name: string) {
    set((s) => {
      const following = s.community.following.includes(name) ? s.community.following.filter((x) => x !== name) : [...s.community.following, name];
      return { ...s, community: { ...s.community, following } };
    });
  },
  toggleConnector(name: string) {
    set((s) => ({ ...s, devConnectors: s.devConnectors.includes(name) ? s.devConnectors.filter((x) => x !== name) : [...s.devConnectors, name] }));
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
  /** status null = tirar da estante */
  setShelf(book: Omit<ShelfItem, "status" | "addedAt">, status: ShelfStatus | null) {
    set((s) => {
      const shelf = { ...s.shelf };
      if (status) shelf[book.id] = { ...book, status, addedAt: s.shelf[book.id]?.addedAt ?? Date.now() };
      else delete shelf[book.id];
      return { ...s, shelf };
    });
  },
  setReaderPrefs(p: Partial<ReaderPrefs>) {
    set((s) => ({ ...s, readerPrefs: { ...s.readerPrefs, ...p } }));
  },
};
