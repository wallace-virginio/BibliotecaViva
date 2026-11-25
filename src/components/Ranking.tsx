import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame } from "lucide-react";
import type { ReactNode } from "react";
import type { Book } from "@/lib/api/openlibrary";
import { POPULAR_SUBJECTS, subjectCount, trending, type RankedBook } from "@/lib/api/rankings";
import { useAsync } from "@/lib/hooks";
import { cn, compactNumber } from "@/lib/utils";
import { useDragScroll } from "@/lib/motion";
import { BookCard, BookCover } from "./common";
import { useT } from "@/lib/i18n";

/** Lista numerada compacta (sidebar): "Em alta esta semana". */
export function TrendingSidebar({ className }: { className?: string }) {
  const { data, loading, error } = useAsync((s) => trending("weekly", 10, s), []);
  const t = useT();
  return (
    <section className={cn("rounded-3xl border bg-surface p-5", className)} aria-labelledby="em-alta">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="em-alta" className="flex items-center gap-2 text-lg">
          <Flame className="size-4 text-deep" /> {t.ranking.trending}
        </h2>
        <Link to="/ranking" className="text-xs font-medium text-primary">{t.ranking.seeRanking}</Link>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">{t.ranking.unavailable}</p>
      ) : (
        <ol className="space-y-1">
          {(data ?? []).map((b, i) => (
            <li key={b.id}>
              <Link to="/livro/$id" params={{ id: b.id }} className="group flex items-center gap-3 rounded-xl p-1.5 hover:bg-surface-2">
                <span className={cn("w-6 shrink-0 text-center font-serif text-xl font-semibold tabular-nums", i < 3 ? "text-deep" : "text-muted-foreground")}>{i + 1}</span>
                <BookCover coverId={b.coverId} title={b.title} size="S" className="w-9 shrink-0 rounded-md shadow-soft" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium group-hover:text-primary">{b.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.authors[0]}</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Chips de temas populares com o tamanho do acervo de cada um. */
export function PopularSubjects({ onPick, active, className }: { onPick: (slug: string) => void; active?: string; className?: string }) {
  const counts = useAsync(async (s) => Promise.all(POPULAR_SUBJECTS.map((t) => subjectCount(t.slug, s).catch(() => 0))), []);
  const tr = useT();
  return (
    <section className={cn("rounded-3xl border bg-surface p-5", className)} aria-labelledby="temas">
      <h2 id="temas" className="mb-3 text-lg">{tr.ranking.popular}</h2>
      <div className="flex flex-wrap gap-2">
        {POPULAR_SUBJECTS.map((t, i) => (
          <button
            key={t.slug}
            onClick={() => onPick(t.slug)}
            aria-pressed={active === t.slug}
            className={cn("rounded-full border px-3 py-1.5 text-sm transition hover:border-primary", active === t.slug && "border-primary bg-primary-soft text-primary-soft-foreground")}
          >
            {tr.subjects[t.slug]}
            {counts.data?.[i] ? <span className="ml-1.5 text-xs text-muted-foreground">{compactNumber(counts.data[i])}</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Estante horizontal (rolagem no celular), com título e link. */
export function ShelfRow({ title, icon, books, loading, link, badge }: { title: string; icon?: ReactNode; books?: Book[]; loading?: boolean; link?: { to: string; label: string; search?: Record<string, string> }; badge?: (b: Book, i: number) => ReactNode }) {
  const drag = useDragScroll<HTMLDivElement>();
  return (
    <section>
      {(title || link) && <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl">{icon}{title}</h2>
        {link && (
          <Link to={link.to} search={link.search} className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
            {link.label} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>}
      <div ref={drag} className="-mx-4 flex snap-x gap-3.5 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:cursor-grab sm:snap-none sm:px-0">
        {loading || !books
          ? Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] w-28 shrink-0 rounded-xl sm:w-32" />)
          : books.map((b, i) => <BookCard key={b.id} book={b} badge={badge?.(b, i)} className="w-28 shrink-0 snap-start sm:w-32" />)}
      </div>
    </section>
  );
}

export function RankNumber({ n }: { n: number }) {
  return <span className="rounded-md bg-foreground/85 px-1.5 py-0.5 font-serif text-sm font-semibold text-background tabular-nums">#{n}</span>;
}

export type { RankedBook };
