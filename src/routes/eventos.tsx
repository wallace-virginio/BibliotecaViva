import { createFileRoute } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { useMemo, useState } from "react";
import { EventCard, PageHero } from "@/components/common";
import { Container, EmptyState, Tabs } from "@/components/ui";
import { EVENTS } from "@/data/content";
import { FEATURED_LIBRARIES, type Library } from "@/data/libraries";
import type { PlatformEvent } from "@/data/content";
import { useAskLocationOnce, useLocation, useNearbyLibraries } from "@/lib/location";
import { formatDistance, haversineKm } from "@/lib/utils";
import { Globe2, MapPin } from "lucide-react";
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
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)

  component: FEATURES.eventos ? Eventos : () => <EmDesenvolvimento feature="eventos" />,
});

const CATS = ["Todos", "Clube de leitura", "Oficina", "Curso", "Cultura", "Crianças", "Exposição", "Hackathon"] as const;

function Eventos() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("Todos");
  const [day, setDay] = useState<number | null>(null);
  const [mode, setMode] = useState<"todos" | "presencial" | "online">("todos");
  const joined = useStore((s) => s.reservations.filter((r) => r.kind === "evento").map((r) => r.id));
  useAskLocationOnce();
  const { location, ask } = useLocation();
  const nearby = useNearbyLibraries();
  const [showFar, setShowFar] = useState(false);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
      }),
    [],
  );

  // Eventos das bibliotecas perto da pessoa (agenda de hoje de cada uma) + agenda da rede.
  type Item = { event: PlatformEvent; lib?: Library; km?: number };
  const local: Item[] = (nearby.data ?? []).slice(0, 15).flatMap(({ lib, km }) =>
    lib.eventsToday.map((ev, i) => ({
      lib,
      km,
      event: {
        id: `perto-${lib.slug}-${i}`,
        title: ev.title,
        category: (["Clube de leitura", "Oficina", "Curso", "Cultura", "Crianças", "Exposição"].includes(ev.category) ? ev.category : "Cultura") as PlatformEvent["category"],
        librarySlug: lib.slug,
        date: days[0],
        time: ev.time,
        durationMin: 90,
        spots: 30,
        spotsLeft: ev.spots,
        online: false,
        description: "",
      },
    })),
  );
  const network: Item[] = EVENTS.map((event) => {
    const lib = FEATURED_LIBRARIES.find((l) => l.slug === event.librarySlug);
    return { event, lib, km: location && lib ? haversineKm(location, lib) : undefined };
  });
  const matches = ({ event: e }: Item) =>
    (cat === "Todos" || e.category === cat) &&
    (day === null || e.date.toDateString() === days[day].toDateString()) &&
    (mode === "todos" || (mode === "online") === e.online);
  const all = [...local, ...network].filter(matches);
  // "Perto": até 60 km da localização da sessão, ou online (dá para participar de qualquer lugar).
  const near = location ? all.filter((i) => i.event.online || (i.km !== undefined && i.km <= 60)).sort((a, b) => (a.km ?? 0) - (b.km ?? 0)) : all;
  const far = location ? all.filter((i) => !near.includes(i)) : [];
  const list = near;

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

        {location ? (
          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" /> Perto de <strong className="text-foreground">{location.label}</strong> e online ·{" "}
            <button onClick={ask} className="text-primary hover:underline">trocar</button>
          </p>
        ) : (
          <button onClick={ask} className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-dashed bg-surface p-4 text-left text-sm hover:border-primary">
            <MapPin className="size-5 shrink-0 text-primary" />
            <span><strong>Defina onde você está</strong> para ver primeiro os eventos da sua cidade.</span>
          </button>
        )}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map(({ event: e, lib, km }) => {
            const id = `evento-${e.id}`;
            return (
              <EventCard
                key={e.id}
                event={e}
                library={lib}
                distance={!e.online && km !== undefined && location ? formatDistance(km) : undefined}
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
          <EmptyState icon={<CalendarX className="size-6" />} title={location ? `Nenhum evento perto de ${location.label} com esses filtros` : "Nenhum evento com esses filtros"} description="Tente outro dia ou categoria." />
        )}
        {far.length > 0 && (
          <div className="mt-12">
            {showFar ? (
              <>
                <h2 className="mb-5 flex items-center gap-2 text-xl"><Globe2 className="size-5 text-primary" /> Em outras cidades</h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {far.map(({ event: e, lib }) => (
                    <EventCard key={e.id} event={e} library={lib} joined={joined.includes(`evento-${e.id}`)} onJoin={() => actions.reserve({ id: `evento-${e.id}`, kind: "evento", title: e.title, subtitle: lib?.name, when: `${e.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} · ${e.time}` })} />
                  ))}
                </div>
              </>
            ) : (
              <button onClick={() => setShowFar(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-surface py-4 text-sm font-medium hover:border-primary">
                <Globe2 className="size-4 text-primary" /> Ver {far.length} eventos em outras cidades
              </button>
            )}
          </div>
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
