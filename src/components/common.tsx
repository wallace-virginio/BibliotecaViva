import { Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Clock, MapPin, Users, Wifi } from "lucide-react";
import { useState, type ReactNode } from "react";
import { coverUrl, type Book } from "@/lib/api/openlibrary";
import { photosNear, wikiSummary } from "@/lib/api/commons";
import { useAsync, useCountUp, useInView } from "@/lib/hooks";
import { cn, compactNumber, formatNumber } from "@/lib/utils";
import type { Library } from "@/data/libraries";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import type { PlatformEvent } from "@/data/content";
import { Badge, buttonClass, Card } from "./ui";
import { ShelfQuickToggle } from "./ShelfButton";

/* ---------- Reveal on scroll ---------- */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("reveal", inView && "is-visible", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------- Count up ---------- */
export function CountUp({ value, suffix = "", compact = false }: { value: number; suffix?: string; compact?: boolean }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const v = useCountUp(value, inView);
  return (
    <span ref={ref} className="tabular-nums">
      {compact ? compactNumber(v) : formatNumber(v)}
      {suffix}
    </span>
  );
}

/* ---------- Book cover ---------- */
const COVER_TONES = ["bg-cover-1", "bg-cover-2", "bg-cover-3", "bg-cover-4", "bg-cover-5", "bg-cover-6", "bg-cover-7", "bg-cover-8"];

export function BookCover({
  coverId,
  title,
  author,
  size = "M",
  className,
}: {
  coverId?: number;
  title: string;
  author?: string;
  size?: "S" | "M" | "L";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = coverUrl(coverId, size);
  const tone = COVER_TONES[(title.length + (author?.length ?? 0)) % COVER_TONES.length];
  return (
    <div className={cn("relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-3 shadow-card", className)}>
      {src && !failed ? (
        <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <div className={cn("flex size-full flex-col justify-between p-3 text-on-image", tone)}>
          <BookOpen className="size-5 opacity-80" />
          <div>
            <p className="line-clamp-3 text-sm leading-tight font-semibold">{title}</p>
            {author && <p className="mt-1 line-clamp-1 text-[11px] opacity-80">{author}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function BookCard({ book, className, badge }: { book: Book; className?: string; badge?: ReactNode }) {
  return (
    <Link to="/livro/$id" params={{ id: book.id }} className={cn("group flex min-w-0 flex-col gap-2.5", className)}>
      <div className="relative">
        <BookCover
          coverId={book.coverId}
          title={book.title}
          author={book.authors[0]}
          className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated"
        />
        <ShelfQuickToggle book={{ id: book.id, title: book.title, author: book.authors[0], coverId: book.coverId }} className="absolute top-1.5 right-1.5" />
        {badge && <div className="absolute bottom-1.5 left-1.5">{badge}</div>}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-[13px] leading-snug font-medium group-hover:text-primary">{book.title}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {book.authors[0] ?? "Autor desconhecido"}
          {book.year ? ` · ${book.year}` : ""}
        </p>
      </div>
    </Link>
  );
}

export function BookGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="skeleton aspect-[2/3] rounded-xl" />
          <div className="skeleton h-3 w-4/5 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Library photos ---------- */
const photoCache = new Map<string, string[]>();

export function useLibraryPhotos(lib?: Pick<Library, "slug" | "lat" | "lon" | "wiki">) {
  return useAsync<string[]>(
    async (signal) => {
      if (!lib) return [];
      const hit = photoCache.get(lib.slug);
      if (hit) return hit;
      const out: string[] = [];
      if (lib.wiki) {
        const s = await wikiSummary(lib.wiki.title, lib.wiki.lang, signal).catch(() => undefined);
        if (s?.image) out.push(s.image);
      }
      const near = await photosNear(lib.lat, lib.lon, 200, signal).catch(() => []);
      for (const p of near) if (!out.includes(p.thumb)) out.push(p.thumb);
      photoCache.set(lib.slug, out);
      return out;
    },
    [lib?.slug],
  );
}

export function LibraryImage({ lib, className, index = 0 }: { lib: Library; className?: string; index?: number }) {
  const { data, loading } = useLibraryPhotos(lib);
  // se uma foto falhar, tenta a próxima da lista antes de cair no ícone
  const [skip, setSkip] = useState(0);
  const list = data ?? [];
  const src = list[index + skip] ?? (skip === 0 ? list[0] : undefined);
  const tone = COVER_TONES[lib.name.length % COVER_TONES.length];
  if (loading && !data) return <div className={cn("skeleton", className)} />;
  if (!src)
    return (
      <div className={cn("grid place-items-center text-on-image", tone, className)}>
        <BookOpen className="size-8 opacity-70" />
      </div>
    );
  return <img key={src} src={src} alt={lib.name} loading="lazy" onError={() => setSkip((n) => n + 1)} className={cn("object-cover", className)} />;
}

export function LibraryCard({ lib, distance }: { lib: Library; distance?: string }) {
  return (
    <Link to="/biblioteca/$slug" params={{ slug: lib.slug }} className="group block">
      <Card className="card-hover overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <LibraryImage lib={lib} className="size-full transition duration-500 group-hover:scale-105" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge tone="glass">{lib.kind}</Badge>
          </div>
        </div>
        <div className="space-y-1.5 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-semibold group-hover:text-primary">{lib.name}</h3>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">★ {lib.rating.toFixed(1).replace(".", ",")}</span>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {[lib.city, lib.country].filter(Boolean).join(", ") || "Perto de você"}
            {distance && <span> · {distance}</span>}
          </p>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="size-3.5" /> {compactNumber(lib.books)}</span>
            {lib.amenities.wifi && <span className="flex items-center gap-1"><Wifi className="size-3.5" /> Wi-Fi</span>}
            <span className="flex items-center gap-1"><Users className="size-3.5" /> {lib.rooms.available} salas livres</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ---------- Event card ---------- */
export function EventCard({ event, onJoin, joined, library, distance }: { event: PlatformEvent; onJoin?: () => void; joined?: boolean; library?: Library; distance?: string }) {
  const lib = library ?? FEATURED_LIBRARIES.find((l) => l.slug === event.librarySlug)!;
  const date = event.date;
  const full = event.spotsLeft === 0;
  return (
    <Card className="card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <LibraryImage lib={lib} className="size-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-overlay to-transparent" />
        <div className="absolute top-3 left-3 rounded-2xl glass border px-3 py-1.5 text-center leading-none">
          <div className="text-[10px] font-semibold uppercase text-primary">
            {date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
          </div>
          <div className="mt-0.5 text-lg font-bold">{date.getDate()}</div>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          {event.online && <Badge tone="glass">Online</Badge>}
          <Badge tone="glass">{event.category}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-2 font-semibold">{event.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{lib.name}{distance ? ` · ${distance}` : lib.city ? ` · ${lib.city}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
          <span className="flex items-center gap-1"><Clock className="size-3.5" />{event.time}</span>
          <span className={cn("flex items-center gap-1", full ? "text-danger" : event.spotsLeft < 10 && "text-warning")}>
            <Users className="size-3.5" />
            {full ? "Esgotado" : `${event.spotsLeft} vagas`}
          </span>
        </div>
        <div className="mt-auto pt-1">
          <button
            disabled={full && !joined}
            onClick={onJoin}
            className={buttonClass(joined ? "soft" : full ? "outline" : "primary", "sm", "w-full")}
          >
            {joined ? "Inscrito ✓" : full ? "Lista de espera" : "Participar"}
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Page header ---------- */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-20 pb-8 md:pt-40 md:pb-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-up">
          {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-6xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-base md:mt-4 md:text-lg text-pretty text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="mt-8 animate-fade-up [animation-delay:120ms]">{children}</div>}
      </div>
    </section>
  );
}

/* ---------- Code block with lightweight highlighting ---------- */
export function CodeBlock({ code, title, className }: { code: string; title?: string; className?: string }) {
  const html = highlight(code);
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-glass-border bg-code-bg shadow-elevated", className)}>
      <div className="flex items-center gap-2 border-b border-glass-border px-4 py-3">
        <span className="size-3 rounded-full bg-danger" />
        <span className="size-3 rounded-full bg-warning" />
        <span className="size-3 rounded-full bg-success" />
        {title && <span className="ml-3 font-mono text-xs text-code-muted">{title}</span>}
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-code-fg">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

function highlight(src: string) {
  const esc = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tokens = /(\/\/[^\n]*)|(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(import|from|export|default|async|await|return|const|let|new|true|false|null|function)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)(?=\()/g;
  return esc.replace(tokens, (m, comment, str, kw, num, fn) => {
    if (comment) return `<span class="text-code-muted">${m}</span>`;
    if (str) return `<span class="text-code-string">${m}</span>`;
    if (kw) return `<span class="text-code-key">${m}</span>`;
    if (num) return `<span class="text-code-num">${m}</span>`;
    if (fn) return `<span class="text-code-fn">${m}</span>`;
    return m;
  });
}
