import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Clock, Flame, Heart, MapPin, Ticket, Trophy } from "lucide-react";
import { BadgeGrid } from "@/components/dashboard";
import { Card } from "@/components/ui";
import { RANKING } from "@/data/content";
import { useUserStats } from "@/lib/userStats";
import { useStore } from "@/lib/store";
import { cn, formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Biblioteca Viva" }, { name: "description", content: "Livros lidos, conquistas, badges, ranking e sequência de leitura." }] }),
  component: Perfil,
});

function Perfil() {
  const reserved = useStore((s) => s.reservations.filter((r) => r.kind === "livro").length);
  const favLibs = useStore((s) => s.followedLibraries.length);
  const me = useUserStats();
  const s = me.stats;
  const stats = [
    { icon: BookOpen, label: "Livros lidos", value: s.read },
    { icon: Ticket, label: "Livros reservados", value: s.reserved + reserved },
    { icon: CalendarDays, label: "Eventos", value: s.events },
    { icon: Heart, label: "Bibliotecas favoritas", value: s.libraries + favLibs },
    { icon: Clock, label: "Horas estudando", value: s.hours },
    { icon: Trophy, label: "Ranking", value: s.rank ? `#${s.rank}` : "—" },
  ];
  // calendário de sequência das últimas 5 semanas
  const reading = useStore((st) => st.reading);
  const active = new Set(Object.values(reading).map((p) => new Date(p.updatedAt).toDateString()));
  const days = Array.from({ length: 35 }).map((_, i) => {
    if (me.demo) return i >= 35 - s.streak ? 3 : (i * 7) % 5 > 2 ? 1 + (i % 2) : 0;
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return active.has(d.toDateString()) ? 3 : 0;
  });

  return (
    <>
      <Card className="relative overflow-hidden p-0">
        <div className="h-28 bg-gradient-primary md:h-36" />
        <div className="px-5 pb-6 md:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <span className="grid size-24 place-items-center rounded-3xl border-4 border-surface bg-cover-6 text-3xl font-semibold text-on-image shadow-card">{(me.name || "?")[0]?.toUpperCase()}</span>
            <div className="flex items-center gap-2 rounded-full bg-warning-soft px-4 py-2 text-sm font-semibold text-warning">
              <Flame className="size-4" /> {s.streak} dias de sequência
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-semibold">{me.fullName}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {[me.city, me.memberSince && `membro desde ${me.memberSince}`].filter(Boolean).join(" · ")}</p>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((st) => (
          <Card key={st.label} className="p-4">
            <st.icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-semibold tabular-nums">{st.value}</p>
            <p className="text-xs text-muted-foreground">{st.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Conquistas e badges</h2>
          <BadgeGrid badges={me.badges} />
        </section>
        <div className="space-y-6">
          <Card className="p-5">
            <p className="font-semibold">Sequência de leitura</p>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {days.map((d, i) => (
                <span key={i} className={cn("aspect-square rounded-md", ["bg-surface-3", "bg-primary-soft", "bg-primary/60", "bg-primary"][d])} />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Últimas 5 semanas</p>
          </Card>
          {me.demo && <Card className="divide-y">
            <p className="p-4 font-semibold">Ranking da cidade</p>
            {RANKING.map((r, i) => (
              <div key={r.name} className={cn("flex items-center gap-3 px-4 py-3 text-sm", r.me && "bg-primary-soft/50 font-medium")}>
                <span className="w-4 text-muted-foreground">{i + 1}</span>
                <span className="flex-1">{r.name}</span>
                <span className="tabular-nums text-muted-foreground">{formatNumber(r.points)}</span>
              </div>
            ))}
          </Card>}
        </div>
      </div>
    </>
  );
}
