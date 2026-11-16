import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EventCard, PageHero } from "@/components/common";
import { Container, EmptyState, Tabs } from "@/components/ui";
import { EVENTS } from "@/data/content";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CalendarX } from "lucide-react";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Biblioteca Viva" },
      { name: "description", content: "Clubes de leitura, oficinas, cursos, saraus e exposições desta semana em bibliotecas do mundo todo." },
    ],
  }),
  component: Eventos,
});

const CATS = ["Todos", "Clube de leitura", "Oficina", "Curso", "Cultura", "Crianças", "Exposição", "Hackathon"] as const;

function Eventos() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("Todos");
  const [day, setDay] = useState<number | null>(null);
  const [mode, setMode] = useState<"todos" | "presencial" | "online">("todos");
  const joined = useStore((s) => s.reservations.filter((r) => r.kind === "evento").map((r) => r.id));

  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );

  const list = EVENTS.filter(
    (e) =>
      (cat === "Todos" || e.category === cat) &&
      (day === null || e.date.toDateString() === days[day].toDateString()) &&
      (mode === "todos" || (mode === "online") === e.online),
  );

  return (
    <>
      <PageHero eyebrow="Agenda" title="Eventos desta semana" description="Inscreva-se em um toque. Suas inscrições ficam salvas no seu perfil." />
      <Container className="pb-16">
        {/* Seletor de dias — rolagem horizontal no celular */}
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:px-0">
          <DayChip active={day === null} onClick={() => setDay(null)} top="Semana" bottom="Toda" />
          {days.map((d, i) => (
            <DayChip
              key={i}
              active={day === i}
              onClick={() => setDay(i)}
              top={i === 0 ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
              bottom={String(d.getDate())}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn("h-9 shrink-0 rounded-full border px-4 text-sm transition", cat === c ? "border-primary bg-primary-soft text-primary-soft-foreground" : "bg-surface")}
              >
                {c}
              </button>
            ))}
          </div>
          <Tabs value={mode} onChange={setMode} options={[{ value: "todos", label: "Todos" }, { value: "presencial", label: "Presencial" }, { value: "online", label: "Online" }]} />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e) => {
            const id = `evento-${e.id}`;
            const lib = FEATURED_LIBRARIES.find((l) => l.slug === e.librarySlug);
            return (
              <EventCard
                key={e.id}
                event={e}
                joined={joined.includes(id)}
                onJoin={() =>
                  joined.includes(id)
                    ? actions.cancelReservation(id)
                    : actions.reserve({
                        id,
                        kind: "evento",
                        title: e.title,
                        subtitle: e.online ? "Online" : lib?.name,
                        when: `${e.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} · ${e.time}`,
                      })
                }
              />
            );
          })}
        </div>
        {list.length === 0 && (
          <EmptyState icon={<CalendarX className="size-6" />} title="Nenhum evento com esses filtros" description="Tente outro dia ou categoria." />
        )}
      </Container>
    </>
  );
}

function DayChip({ active, onClick, top, bottom }: { active: boolean; onClick: () => void; top: string; bottom: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-16 w-16 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border text-center transition",
        active ? "border-transparent bg-gradient-primary text-primary-foreground shadow-glow" : "bg-surface",
      )}
    >
      <span className={cn("text-[11px] font-medium uppercase", !active && "text-muted-foreground")}>{top}</span>
      <span className="text-lg font-semibold">{bottom}</span>
    </button>
  );
}
