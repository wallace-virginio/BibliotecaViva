import { USER } from "@/data/content";
import { useAuth } from "./auth";
import { computeBadges, DEMO_BADGES, readingStreak } from "./badges";
import { useStore } from "./store";

/**
 * Estatísticas e conquistas do usuário.
 * Com conta real (Supabase), tudo é calculado a partir da atividade salva; no modo demonstração usa os dados de exemplo.
 */
export function useUserStats() {
  const auth = useAuth();
  const state = useStore((s) => s);

  if (!auth.configured) {
    return { name: USER.name, fullName: USER.fullName, city: USER.city, memberSince: USER.memberSince, stats: USER.stats, badges: DEMO_BADGES, demo: true as const };
  }

  const progress = Object.values(state.reading);
  const finished = progress.filter((p) => p.percent >= 95).length;
  const events = state.reservations.filter((r) => r.kind === "evento");
  const books = state.reservations.filter((r) => r.kind === "livro").length;
  const followed = state.followedLibraries;
  const streak = readingStreak(state);

  const meta = (auth.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const fullName = auth.profile?.full_name || meta.full_name || meta.name || auth.user?.email?.split("@")[0] || "";
  const created = auth.user?.created_at ? new Date(auth.user.created_at).getFullYear().toString() : "";

  return {
    name: auth.displayName,
    fullName,
    city: "",
    memberSince: created,
    stats: {
      read: finished,
      reserved: books,
      events: events.length,
      libraries: followed.length,
      // estimativa: ~4 h para ler um livro inteiro
      hours: Math.round(progress.reduce((sum, p) => sum + p.percent, 0) / 25),
      streak,
      rank: 0,
    },
    badges: computeBadges(state),
    demo: false as const,
  };
}
