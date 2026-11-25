import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FREE_CLASSICS } from "@/data/content";
import { DEMO_BADGES, type BadgeView } from "@/lib/badges";
import type { SavedBook } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BookCover } from "./common";
import { Card } from "./ui";
import { useT } from "@/lib/i18n";

export function DashHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SavedBookRow({ books, empty }: { books: SavedBook[]; empty?: ReactNode }) {
  if (!books.length) return <>{empty}</>;
  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-6">
      {books.map((b) => (
        <Link key={b.id} to="/livro/$id" params={{ id: b.id }} className="group w-28 shrink-0 sm:w-auto">
          <BookCover coverId={b.coverId} title={b.title} author={b.author} className="transition group-hover:-translate-y-1" />
          <p className="mt-2 line-clamp-2 text-sm font-medium">{b.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{b.author}</p>
        </Link>
      ))}
    </div>
  );
}

export function BadgeGrid({ compact = false, badges = DEMO_BADGES }: { compact?: boolean; badges?: BadgeView[] }) {
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-9" : "grid-cols-2 sm:grid-cols-3")}>
      {badges.map((b) => (
        <button
          key={b.key}
          type="button"
          className="flip-card text-left"
          onClick={(e) => {
            const el = e.currentTarget;
            el.dataset.flipped = el.dataset.flipped === "true" ? "false" : "true";
          }}
          aria-label={`${b.title}: ${b.description}. ${b.earned ? "Conquistada" : "Ainda não conquistada"}`}
        >
          <div className="flip-inner h-full">
            <Card className={cn("flip-face flex h-full flex-col items-center p-4 text-center", !b.earned && "opacity-45 grayscale")}>
              <span className={cn("grid place-items-center rounded-2xl text-2xl", compact ? "size-12" : "size-14", b.earned ? "bg-primary-soft" : "bg-surface-2")}>{b.emoji}</span>
              <p className="mt-2 text-xs leading-tight font-semibold">{b.title}</p>
              {!compact && <p className="mt-1 text-[11px] text-muted-foreground">{b.description}</p>}
              {/* progresso das que têm meta (ex.: estante 2 de 5) */}
              {!b.earned && b.goal > 1 && (
                <div className="mt-2 w-full">
                  <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(b.progress / b.goal) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                    {b.progress} de {b.goal}
                  </p>
                </div>
              )}
            </Card>
            <Card className="flip-face flip-back flex flex-col items-center justify-center bg-primary-soft p-3 text-center">
              <p className="text-[11px] leading-snug font-medium text-primary-soft-foreground">{b.description}</p>
              <p className="mt-1.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                {b.earned ? (b.earnedAt ? `Conquistada em ${new Date(b.earnedAt).toLocaleDateString("pt-BR")}` : "Conquistada") : `Falta${b.goal - b.progress === 1 ? "" : "m"} ${b.goal - b.progress}`}
              </p>
            </Card>
          </div>
        </button>
      ))}
    </div>
  );
}

export function FreeClassics() {
  const t = useT();
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{t.estante.freeClassics}</p>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-6">
        {FREE_CLASSICS.map((b) => (
          <Link key={b.id} to="/ler/$id" params={{ id: b.id }} className="group w-28 shrink-0 sm:w-auto">
            <BookCover coverId={b.coverId} title={b.title} author={b.author} className="transition group-hover:-translate-y-1" />
            <p className="mt-2 line-clamp-2 text-sm font-medium">{b.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{b.author}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
