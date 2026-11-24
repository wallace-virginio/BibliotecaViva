/**
 * Conquistas — todas REAIS: cada uma vem de algo que o app registra de verdade (store.ts, salvo no aparelho
 * e sincronizado com a conta). Simples de conquistar no começo, com algumas metas para quem continua.
 * Conquistas de presença (visitar biblioteca, ir a evento) voltam quando houver check-in nas bibliotecas.
 */
import { FEATURES } from "./features";
import type { State } from "./store";

export type BadgeDef = {
  key: string;
  emoji: string;
  title: string;
  /** o que é preciso fazer, em linguagem de gente */
  description: string;
  /** quantas vezes */
  goal: number;
  /** quanto a pessoa já fez */
  count: (s: State) => number;
};

const finished = (s: State) => Object.values(s.reading).filter((p) => p.percent >= 95).length;

/** Dias seguidos (até hoje) com alguma leitura registrada no leitor. */
export function readingStreak(s: State, now = new Date()) {
  const days = new Set(Object.values(s.reading).map((p) => new Date(p.updatedAt).toDateString()));
  let streak = 0;
  const d = new Date(now);
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export const BADGE_DEFS: BadgeDef[] = [
  { key: "primeira-pagina", emoji: "📖", title: "Primeira página", description: "Abra um livro grátis no leitor do app", goal: 1, count: (s) => Object.keys(s.reading).length },
  { key: "conversa-ori", emoji: "🌱", title: "Oi, Ori!", description: "Converse com o Ori, o assistente", goal: 1, count: (s) => s.oriChats },
  { key: "primeiro-favorito", emoji: "❤️", title: "Coração de leitor", description: "Favorite um livro", goal: 1, count: (s) => s.favorites.length },
  { key: "biblioteca-do-coracao", emoji: "🏛️", title: "Biblioteca do coração", description: "Siga uma biblioteca", goal: 1, count: (s) => s.followedLibraries.length },
  // dependem de funções ainda em desenvolvimento: só aparecem quando forem ligadas em lib/features.ts
  ...(FEATURES.reservas
    ? [{ key: "primeira-reserva", emoji: "🔖", title: "Primeira reserva", description: "Reserve um livro numa biblioteca", goal: 1, count: (s: State) => s.reservations.filter((r) => r.kind === "livro").length }]
    : []),
  ...(FEATURES.eventos
    ? [{ key: "na-agenda", emoji: "🎟️", title: "Na agenda", description: "Inscreva-se em um evento", goal: 1, count: (s: State) => s.reservations.filter((r) => r.kind === "evento").length }]
    : []),
  { key: "estante-montada", emoji: "📚", title: "Estante montada", description: "Coloque 5 livros na sua estante", goal: 5, count: (s) => Object.keys(s.shelf).length },
  { key: "primeiro-livro", emoji: "✅", title: "Livro terminado", description: "Leia um livro até o fim no app", goal: 1, count: finished },
  { key: "tres-dias", emoji: "🔥", title: "Três dias seguidos", description: "Leia no app 3 dias seguidos", goal: 3, count: (s) => readingStreak(s) },
  { key: "dez-livros", emoji: "🏆", title: "Leitor dedicado", description: "Leia 10 livros até o fim no app", goal: 10, count: finished },
];

export type BadgeView = {
  key: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
  /** quando foi conquistada (ms), se já foi */
  earnedAt?: number;
  progress: number;
  goal: number;
};

/** Situação de cada conquista. Uma vez ganha, continua ganha (mesmo que a pessoa desfaça a ação). */
export function computeBadges(s: State): BadgeView[] {
  return BADGE_DEFS.map((b) => {
    const progress = Math.min(b.count(s), b.goal);
    const earnedAt = s.badges[b.key];
    return { key: b.key, emoji: b.emoji, title: b.title, description: b.description, goal: b.goal, progress, earned: !!earnedAt || progress >= b.goal, earnedAt };
  });
}

/** Conquistas alcançadas agora que ainda não têm data guardada. */
export function newlyEarned(s: State): BadgeView[] {
  return computeBadges(s).filter((b) => b.earned && !s.badges[b.key]);
}

/** Exemplo para o modo demonstração (sem Supabase): metade ganha. */
export const DEMO_BADGES: BadgeView[] = BADGE_DEFS.map((b, i) => ({
  key: b.key,
  emoji: b.emoji,
  title: b.title,
  description: b.description,
  goal: b.goal,
  progress: i < 5 ? b.goal : Math.floor(b.goal / 2),
  earned: i < 5,
}));
