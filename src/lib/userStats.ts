import { BADGES, USER } from "@/data/content";
import { useAuth } from "./auth";
import { useStore } from "./store";

/**
 * Estatísticas e conquistas do usuário.
 * Com conta real (Supabase), tudo é calculado a partir da atividade salva; no modo demonstração usa os dados de exemplo.
 */
export function useUserStats() {
  const auth = useAuth();
  const reading = useStore((s) => s.reading);
  const reservations = useStore((s) => s.reservations);
  const followed = useStore((s) => s.followedLibraries);

  if (!auth.configured) {
    return { name: USER.name, fullName: USER.fullName, city: USER.city, memberSince: USER.memberSince, stats: USER.stats, badges: BADGES, demo: true as const };
  }

  const progress = Object.values(reading);
  const finished = progress.filter((p) => p.percent >= 95).length;
  const events = reservations.filter((r) => r.kind === "evento");
  const books = reservations.filter((r) => r.kind === "livro").length;

  // sequência: dias seguidos (até hoje) com alguma leitura registrada
  const days = new Set(progress.map((p) => new Date(p.updatedAt).toDateString()));
  let streak = 0;
  const d = new Date();
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const earned: Record<string, boolean> = {
    "primeiro-livro": finished >= 1,
    "primeira-visita": reservations.some((r) => r.kind === "sala" || r.kind === "computador"),
    "primeiro-evento": events.length >= 1,
    "5-bibliotecas": followed.length >= 5,
    "10-livros": finished >= 10,
    clube: events.some((e) => /clube/i.test(e.title)),
    voluntario: reservations.some((r) => r.id.startsWith("vol-")),
    conector: false,
    "open-source": false,
  };

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
    badges: BADGES.map((b) => ({ ...b, earned: !!earned[b.key] })),
    demo: false as const,
  };
}
