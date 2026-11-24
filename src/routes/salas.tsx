import { createFileRoute, Link } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { Check, DoorOpen, Monitor, Users, Wifi } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHero } from "@/components/common";
import { OpenBadge } from "@/components/map/LibraryPanel";
import { Badge, Button, Card, Container, Tabs } from "@/components/ui";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { actions, useStore } from "@/lib/store";
import { cn, formatDistance, seeded } from "@/lib/utils";
import { useAskLocationOnce, useLocation, useNearbyLibraries } from "@/lib/location";

type Search = { biblioteca?: string };

export const Route = createFileRoute("/salas")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    biblioteca: typeof s.biblioteca === "string" ? s.biblioteca : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Salas e computadores — Biblioteca Viva" },
      { name: "description", content: "Reserve salas de estudo e computadores nas bibliotecas da rede." },
    ],
  }),
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)

  component: FEATURES.salas ? Salas : () => <EmDesenvolvimento feature="salas" />,
});

const SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

function Salas() {
  const { biblioteca } = Route.useSearch();
  useAskLocationOnce();
  const { ask } = useLocation();
  const nearby = useNearbyLibraries();
  // Com localização: as bibliotecas mais próximas primeiro (com distância). Sem: as conectadas da rede.
  const featured = FEATURED_LIBRARIES.filter((l) => l.kind !== "Digital");
  const near = (nearby.data ?? []).filter((n) => n.lib.kind !== "Digital").slice(0, 8);
  const libs = near.length ? near.map((n) => n.lib) : featured;
  const kmOf = (s: string) => near.find((n) => n.lib.slug === s)?.km;
  const [picked, setSlug] = useState<string | undefined>(biblioteca);
  const slug = picked && [...libs, ...featured].some((l) => l.slug === picked) ? picked : libs[0]?.slug ?? featured[1].slug;
  const [kind, setKind] = useState<"sala" | "computador">("sala");
  const [dayOffset, setDayOffset] = useState(0);
  const [slot, setSlot] = useState<string>();
  const [resource, setResource] = useState<string>();
  const [done, setDone] = useState(false);
  const lib = [...libs, ...featured].find((l) => l.slug === slug)!;
  const reservations = useStore((s) => s.reservations);

  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const dateKey = date.toISOString().slice(0, 10);

  const resources = useMemo(() => {
    const r = seeded(`${slug}-${kind}-${dateKey}-${slot}`);
    const total = kind === "sala" ? Math.min(lib.rooms.total, 8) : Math.min(lib.computers.total, 12);
    return Array.from({ length: total }).map((_, i) => ({
      id: kind === "sala" ? `Sala ${String.fromCharCode(65 + i)}` : `PC ${String(i + 1).padStart(2, "0")}`,
      capacity: kind === "sala" ? [2, 4, 6, 8, 12][i % 5] : 1,
      free: slot ? r.bool(0.6) : true,
    }));
  }, [slug, kind, dateKey, slot, lib]);

  const confirm = () => {
    if (!slot || !resource) return;
    actions.reserve({
      id: `${kind}-${slug}-${dateKey}-${slot}-${resource}`,
      kind,
      title: `${resource} · ${lib.name}`,
      subtitle: kind === "sala" ? "Sala de estudo" : "Computador",
      when: `${date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} · ${slot}`,
    });
    setDone(true);
  };

  const mine = reservations.filter((r) => r.kind === "sala" || r.kind === "computador");

  return (
    <>
      <PageHero eyebrow="Espaços" title="Reserve salas e computadores" description="Escolha a biblioteca, o dia e o horário. Simples como reservar uma mesa." />
      <Container className="grid gap-8 pb-28 lg:grid-cols-[1fr_360px] lg:pb-16">
        <div className="space-y-7">
          <Step n={1} title="Biblioteca">
            <p className="-mt-1 mb-3 text-sm text-muted-foreground">
              {nearby.location ? <>Mais perto de <strong className="text-foreground">{nearby.location.label}</strong> · </> : "Bibliotecas da rede · "}
              <button onClick={ask} className="text-primary hover:underline">{nearby.location ? "trocar" : "usar minha localização"}</button>
            </p>
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
              {libs.slice(0, 8).map((l) => (
                <button
                  key={l.slug}
                  onClick={() => { setSlug(l.slug); setResource(undefined); setDone(false); }}
                  className={cn("w-64 shrink-0 snap-start rounded-2xl border bg-surface p-4 text-left transition sm:w-auto", slug === l.slug && "border-primary ring-4 ring-primary/10")}
                >
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{kmOf(l.slug) !== undefined ? formatDistance(kmOf(l.slug)!) : l.city} · {l.rooms.available} salas · {l.computers.available} PCs livres</p>
                  <div className="mt-2"><OpenBadge lib={l} /></div>
                </button>
              ))}
            </div>
          </Step>

          <Step n={2} title="O que você precisa?">
            <Tabs
              value={kind}
              onChange={(v) => { setKind(v); setResource(undefined); setDone(false); }}
              options={[
                { value: "sala", label: <span className="flex items-center gap-1.5"><DoorOpen className="size-4" /> Sala de estudo</span> },
                { value: "computador", label: <span className="flex items-center gap-1.5"><Monitor className="size-4" /> Computador</span> },
              ]}
            />
          </Step>

          <Step n={3} title="Dia e horário">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                return (
                  <button key={i} onClick={() => { setDayOffset(i); setDone(false); }} className={cn("h-16 w-16 shrink-0 rounded-2xl border text-center", dayOffset === i ? "border-transparent bg-gradient-primary text-primary-foreground" : "bg-surface")}>
                    <span className="block text-[11px] uppercase opacity-80">{i === 0 ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                    <span className="text-lg font-semibold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {SLOTS.map((s) => (
                <button key={s} onClick={() => { setSlot(s); setResource(undefined); setDone(false); }} className={cn("h-11 rounded-xl border text-sm font-medium tabular-nums", slot === s ? "border-primary bg-primary-soft text-primary-soft-foreground" : "bg-surface")}>
                  {s}
                </button>
              ))}
            </div>
          </Step>

          <Step n={4} title={kind === "sala" ? "Escolha a sala" : "Escolha o computador"}>
            {!slot ? (
              <p className="text-sm text-muted-foreground">Selecione um horário para ver a disponibilidade.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {resources.map((r) => (
                  <button
                    key={r.id}
                    disabled={!r.free}
                    onClick={() => { setResource(r.id); setDone(false); }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition disabled:opacity-40",
                      resource === r.id ? "border-primary bg-primary-soft" : "bg-surface",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {kind === "sala" ? <DoorOpen className="size-5 text-primary" /> : <Monitor className="size-5 text-primary" />}
                      {resource === r.id && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="mt-3 font-medium">{r.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.free ? (kind === "sala" ? `${r.capacity} pessoas` : "Livre") : "Ocupado"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Step>
        </div>

        {/* Resumo: fixo no rodapé no celular, lateral no desktop */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Card className="hidden p-6 lg:block">
            <Summary lib={lib.name} kind={kind} date={date} slot={slot} resource={resource} />
            <Button className="mt-5 w-full" disabled={!slot || !resource || done} onClick={confirm}>{done ? "Reservado ✓" : "Confirmar reserva"}</Button>
            {done && <Link to="/app/reservas" className="mt-3 block text-center text-sm font-medium text-primary">Ver minhas reservas →</Link>}
          </Card>
          {mine.length > 0 && (
            <Card className="mt-5 p-5">
              <p className="text-sm font-semibold">Suas próximas reservas</p>
              <ul className="mt-3 space-y-2">
                {mine.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{r.title}</span>
                    <Badge>{r.when}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </Container>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[900] border-t glass p-3 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-semibold">{resource ?? (kind === "sala" ? "Escolha uma sala" : "Escolha um computador")}</p>
            <p className="truncate text-muted-foreground">{lib.name}{slot ? ` · ${slot}` : ""}</p>
          </div>
          <Button size="md" disabled={!slot || !resource || done} onClick={confirm}>{done ? "Reservado ✓" : "Reservar"}</Button>
        </div>
      </div>
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2.5 font-semibold">
        <span className="grid size-6 place-items-center rounded-full bg-foreground text-xs text-background">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Summary({ lib, kind, date, slot, resource }: { lib: string; kind: string; date: Date; slot?: string; resource?: string }) {
  const rows = [
    ["Biblioteca", lib],
    ["Tipo", kind === "sala" ? "Sala de estudo" : "Computador"],
    ["Dia", date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })],
    ["Horário", slot ? `${slot} – ${String(Number(slot.slice(0, 2)) + 2).padStart(2, "0")}:00` : "—"],
    [kind === "sala" ? "Sala" : "Computador", resource ?? "—"],
  ];
  return (
    <>
      <p className="text-lg font-semibold">Resumo</p>
      <dl className="mt-4 space-y-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Wifi className="size-3.5" /> Wi-Fi</span>
        <span className="flex items-center gap-1"><Users className="size-3.5" /> Cancelamento grátis</span>
      </div>
    </>
  );
}
