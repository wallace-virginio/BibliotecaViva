import { Link } from "@tanstack/react-router";
import { BookOpenText, CalendarDays, ChevronRight, Clock, Map, MapPin, Monitor, Navigation } from "lucide-react";
import { BookCover, LibraryImage } from "@/components/common";
import { GlobalSearch } from "@/components/GlobalSearch";
import { OriFab } from "@/components/OriFab";
import { EVENTS, FREE_CLASSICS } from "@/data/content";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { useAuth } from "@/lib/auth";
import { openStatus } from "@/lib/hours";
import { useMounted } from "@/lib/hooks";
import { useAskLocationOnce, useLocation, useNearbyLibraries } from "@/lib/location";
import { useStore } from "@/lib/store";
import { cn, formatDistance, greeting, haversineKm } from "@/lib/utils";

/**
 * Tela Início do app (celular). Responde, nesta ordem, ao que a pessoa quer ao abrir o app:
 * qual biblioteca está perto e aberta agora → o que eu estava lendo → o que tem para fazer esta semana.
 */
export function AppHome() {
  useAskLocationOnce();
  const mounted = useMounted();
  const auth = useAuth();
  const name = auth.displayName?.split(" ")[0];

  return (
    <div className="px-4 pt-[calc(3.5rem+env(safe-area-inset-top)+1.25rem)] pb-8">
      <h1 className="font-serif text-[1.75rem] leading-tight font-semibold">
        {mounted ? greeting() : "Olá"}
        {name ? `, ${name}` : ""}.
      </h1>
      <p className="mt-1 text-[15px] text-muted-foreground">O que você quer fazer hoje?</p>

      <div className="mt-4">
        <GlobalSearch className="!mx-0 !max-w-none" />
      </div>

      <QuickActions />
      <NearestOpen />
      <ContinueReading />
      <ThisWeek />
      <OriFab />
    </div>
  );
}

function QuickActions() {
  const items = [
    { to: "/mapa", label: "Mapa", icon: Map },
    { to: "/acervo", label: "Ler grátis", icon: BookOpenText, search: { ebook: true } },
    { to: "/eventos", label: "Eventos", icon: CalendarDays },
    { to: "/salas", label: "Salas", icon: Monitor },
  ] as const;
  return (
    <ul className="mt-5 grid grid-cols-4 gap-2">
      {items.map(({ to, label, icon: Icon, ...rest }) => (
        <li key={to}>
          <Link
            to={to}
            search={"search" in rest ? rest.search : undefined}
            className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border bg-surface text-[13px] font-medium active:scale-[0.97] active:bg-surface-2"
          >
            <Icon className="size-5 text-primary" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SectionTitle({ title, to, label = "Ver tudo" }: { title: string; to?: string; label?: string }) {
  return (
    <div className="mt-8 mb-3 flex items-end justify-between">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {to && (
        <Link to={to} className="flex h-11 items-center gap-0.5 text-sm font-medium text-primary">
          {label} <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

/** A biblioteca mais perto — de preferência uma aberta agora. */
function NearestOpen() {
  const { location, ask } = useLocation();
  const nearby = useNearbyLibraries();
  if (!location)
    return (
      <>
        <SectionTitle title="Perto de você" />
        <button onClick={ask} className="flex w-full items-center gap-3 rounded-xl border border-dashed bg-surface p-4 text-left active:bg-surface-2">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Navigation className="size-5" />
          </span>
          <span>
            <span className="block font-medium">Mostrar a biblioteca mais perto</span>
            <span className="block text-sm text-muted-foreground">Usamos sua localização só nesta sessão.</span>
          </span>
        </button>
      </>
    );

  const list = (nearby.data ?? []).map((x) => ({ ...x, status: openStatus(x.lib.hours) }));
  const openNow = list.filter((x) => x.status.known && x.status.open);
  const picks = (openNow.length ? openNow : list).slice(0, 3);

  return (
    <>
      <SectionTitle title={openNow.length ? "Abertas agora perto de você" : "Perto de você"} to="/mapa" label="Mapa" />
      {nearby.loading && !nearby.data ? (
        <div className="skeleton h-28 rounded-xl" />
      ) : picks.length === 0 ? (
        <p className="rounded-xl border bg-surface p-4 text-sm text-muted-foreground">
          Não achamos bibliotecas num raio de 8 km de {location.label}. <Link to="/mapa" className="font-medium text-primary">Abrir o mapa</Link>
        </p>
      ) : (
        <ul className="space-y-2.5">
          {picks.map(({ lib, km, status }) => (
            <li key={lib.slug}>
              <Link to="/biblioteca/$slug" params={{ slug: lib.slug }} className="flex items-center gap-3 rounded-xl border bg-surface p-2.5 active:bg-surface-2">
                <LibraryImage lib={lib} className="size-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{lib.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {formatDistance(km)}
                  </p>
                  {status.known && (
                    <p className={cn("mt-0.5 flex items-center gap-1 text-sm font-medium", status.open ? "text-success" : "text-muted-foreground")}>
                      <Clock className="size-3.5" />
                      {status.open ? `Aberta até ${status.until}` : status.opensAt ? `Abre às ${status.opensAt}` : "Fechada hoje"}
                    </p>
                  )}
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ContinueReading() {
  const reading = useStore((s) => Object.values(s.reading).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6));
  const mounted = useMounted();
  const items = mounted && reading.length
    ? reading.map((r) => ({ id: r.id, title: r.title, author: r.author ?? "", coverId: r.coverId, percent: r.percent as number | undefined }))
    : FREE_CLASSICS.map((b) => ({ id: b.id, title: b.title, author: b.author, coverId: b.coverId, percent: undefined }));
  const resuming = mounted && reading.length > 0;

  return (
    <>
      <SectionTitle title={resuming ? "Continue lendo" : "Para ler agora, de graça"} to="/app/livros" label="Estante" />
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
        {items.map((b) => (
          <Link key={b.id} to="/ler/$id" params={{ id: b.id }} className="w-[6.5rem] shrink-0 active:opacity-80">
            <BookCover coverId={b.coverId} title={b.title} author={b.author} className="rounded-md shadow-soft" />
            {b.percent !== undefined && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary" style={{ width: `${b.percent}%` }} />
              </div>
            )}
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug font-medium">{b.title}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function ThisWeek() {
  const { location } = useLocation();
  const items = EVENTS.map((e) => {
    const lib = FEATURED_LIBRARIES.find((l) => l.slug === e.librarySlug);
    return { e, lib, km: location && lib ? haversineKm(location, lib) : undefined };
  })
    .filter((x) => x.e.category !== "Hackathon")
    .filter((x) => !location || x.e.online || (x.km ?? 0) <= 60)
    .sort((a, b) => a.e.date.getTime() - b.e.date.getTime())
    .slice(0, 3);
  if (!items.length) return null;

  return (
    <>
      <SectionTitle title="Esta semana" to="/eventos" label="Agenda" />
      <ol className="divide-y rounded-xl border bg-surface">
        {items.map(({ e, lib, km }) => (
          <li key={e.id}>
            <Link to="/eventos" className="flex items-center gap-3 p-3 active:bg-surface-2">
              <div className="w-11 shrink-0 text-center leading-none">
                <div className="font-serif text-2xl font-semibold tabular-nums">{e.date.getDate()}</div>
                <div className="mt-1 text-[11px] font-semibold text-muted-foreground uppercase">
                  {e.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-medium">{e.title}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {e.time} · {e.online ? "Online" : lib?.name}
                  {!e.online && km !== undefined ? ` · ${formatDistance(km)}` : ""}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
