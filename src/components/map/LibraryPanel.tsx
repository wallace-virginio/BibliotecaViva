import { Link } from "@tanstack/react-router";
import {
  Accessibility,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Cpu,
  DoorOpen,
  Monitor,
  Navigation,
  Printer,
  ScanLine,
  Share2,
  Wifi,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Library } from "@/data/libraries";
import { DAY_NAMES, formatRanges, openStatus } from "@/lib/hours";
import { cn, compactNumber, formatDistance, haversineKm } from "@/lib/utils";
import { useLibraryPhotos } from "../common";
import { Badge, buttonClass, Stars } from "../ui";

export function OpenBadge({ lib }: { lib: Library }) {
  const s = openStatus(lib.hours);
  if (!s.known) return <Badge>Horário não informado</Badge>;
  return s.open ? (
    <Badge tone="success">
      <span className="size-1.5 rounded-full bg-success" /> Aberta agora · até {s.until}
    </Badge>
  ) : (
    <Badge tone="danger">Fechada{s.opensAt ? ` · abre às ${s.opensAt}` : ""}</Badge>
  );
}

export const AMENITY_META = [
  { key: "acessibilidade", label: "Acessibilidade", icon: Accessibility },
  { key: "wifi", label: "Wi-Fi", icon: Wifi },
  { key: "makerspace", label: "Makerspace", icon: Cpu },
  { key: "cafe", label: "Café", icon: Coffee },
  { key: "impressao", label: "Impressão", icon: Printer },
  { key: "scanner", label: "Scanner", icon: ScanLine },
] as const;

export function PhotoCarousel({ lib, className }: { lib: Library; className?: string }) {
  const { data: photos, loading } = useLibraryPhotos(lib);
  const [i, setI] = useState(0);
  const list = photos ?? [];
  if (loading && !photos) return <div className={cn("skeleton", className)} />;
  if (!list.length)
    return (
      <div className={cn("grid place-items-center bg-cover-2 text-on-image", className)}>
        <BookOpen className="size-10 opacity-70" />
      </div>
    );
  const idx = i % list.length;
  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <img key={list[idx]} src={list[idx]} alt={lib.name} className="size-full animate-fade-in object-cover" />
      {list.length > 1 && (
        <>
          <button onClick={() => setI((idx - 1 + list.length) % list.length)} className="absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-full glass border opacity-0 transition group-hover:opacity-100" aria-label="Foto anterior">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setI((idx + 1) % list.length)} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full glass border opacity-0 transition group-hover:opacity-100" aria-label="Próxima foto">
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {list.slice(0, 8).map((_, j) => (
              <span key={j} className={cn("size-1.5 rounded-full bg-on-image/60", j === idx && "w-4 bg-on-image")} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LibraryPanel({
  lib,
  user,
  onClose,
  className,
}: {
  lib: Library;
  user?: { lat: number; lon: number };
  onClose: () => void;
  className?: string;
}) {
  const today = new Date().getDay();
  const dist = user ? formatDistance(haversineKm(user, lib)) : undefined;
  const directions = `https://www.openstreetmap.org/directions?to=${lib.lat}%2C${lib.lon}`;

  return (
    <aside className={cn("flex flex-col overflow-hidden bg-surface", className)}>
      <div className="relative shrink-0">
        <PhotoCarousel key={lib.slug} lib={lib} className="h-48 w-full" />
        <button onClick={onClose} className="absolute top-3 right-3 grid size-9 place-items-center rounded-full glass border shadow-soft" aria-label="Fechar">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{lib.kind}</Badge>
            {lib.featured && <Badge>Conectada</Badge>}
          </div>
          <h3 className="text-xl font-semibold tracking-tight">{lib.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Stars value={lib.rating} className="text-foreground" />
            <span>({compactNumber(lib.reviews)} avaliações)</span>
            {dist && (
              <span className="flex items-center gap-1">
                <Navigation className="size-3.5" /> {dist}
              </span>
            )}
          </div>
          <div className="mt-3">
            <OpenBadge lib={lib} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Stat icon={<DoorOpen className="size-4" />} label="Salas disponíveis" value={`${lib.rooms.available}/${lib.rooms.total}`} />
          <Stat icon={<Monitor className="size-4" />} label="Computadores livres" value={`${lib.computers.available}/${lib.computers.total}`} />
          <Stat icon={<BookOpen className="size-4" />} label="Livros (aprox.)" value={compactNumber(lib.books)} />
          <Stat icon={<Clock className="size-4" />} label="Eventos hoje" value={String(lib.eventsToday.length)} />
        </div>

        {lib.eventsToday.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Acontecendo hoje</h4>
            <ul className="space-y-2">
              {lib.eventsToday.map((e) => (
                <li key={e.title} className="flex items-center gap-3 rounded-2xl border p-3">
                  <span className="rounded-xl bg-primary-soft px-2.5 py-1.5 text-xs font-semibold text-primary-soft-foreground tabular-nums">{e.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.spots ? `${e.spots} vagas` : "Esgotado"} · {e.category}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-semibold">Serviços</h4>
          <div className="flex flex-wrap gap-2">
            {AMENITY_META.map(({ key, label, icon: Icon }) => {
              const on = lib.amenities[key];
              return (
                <span key={key} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs", on ? "text-foreground" : "text-muted-foreground line-through opacity-60")}>
                  <Icon className={cn("size-3.5", on && "text-primary")} /> {label}
                </span>
              );
            })}
          </div>
        </div>

        {lib.hours && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Horário de funcionamento</h4>
            <ul className="space-y-1 text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <li key={d} className={cn("flex justify-between", d === today ? "font-semibold" : "text-muted-foreground")}>
                  <span>{DAY_NAMES[d]}</span>
                  <span className="tabular-nums">{formatRanges(lib.hours![d].ranges)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-2 border-t p-4">
        <Link to="/biblioteca/$slug" params={{ slug: lib.slug }} className={buttonClass("primary", "md", "flex-1")}>
          Ver Biblioteca
        </Link>
        <a href={directions} target="_blank" rel="noreferrer" className={buttonClass("outline", "icon")} aria-label="Como chegar">
          <Navigation className="size-4" />
        </a>
        <button
          className={buttonClass("outline", "icon")}
          aria-label="Compartilhar"
          onClick={() => {
            const url = `${location.origin}/biblioteca/${lib.slug}`;
            if (navigator.share) navigator.share({ title: lib.name, url }).catch(() => {});
            else navigator.clipboard?.writeText(url);
          }}
        >
          <Share2 className="size-4" />
        </button>
      </div>
    </aside>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
