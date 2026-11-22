import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { FREE_CLASSICS } from "@/data/content";
import { booksBySubject, coverUrl, type Book } from "@/lib/api/openlibrary";
import { useAsync } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const FALLBACK: Book[] = FREE_CLASSICS.map((b) => ({ id: b.id, title: b.title, authors: [b.author], coverId: b.coverId, subjects: [] }));

/**
 * "Vídeo" de capas de clássicos: três faixas de capas reais (Open Library) deslizando devagar,
 * como a vitrine de acervo de um museu. Tem botão de pausa (WCAG 2.2.2) e para sozinho
 * quando o sistema pede menos movimento.
 */
export function CoverWall({ className, rows = 3 }: { className?: string; rows?: number }) {
  const [paused, setPaused] = useState(false);
  const { data } = useAsync(async (signal) => {
    const [a, b] = await Promise.all([
      booksBySubject("classic_literature", 30, signal).catch(() => []),
      booksBySubject("brazilian_literature", 18, signal).catch(() => []),
    ]);
    const all = [...b, ...a].filter((x) => x.coverId);
    return all.length >= 12 ? all : [...all, ...FALLBACK];
  }, []);
  const books = data ?? FALLBACK;
  const perRow = Math.ceil(books.length / rows);

  return (
    <div className={cn("relative overflow-hidden", className)} aria-label="Capas de livros clássicos do acervo" role="region">
      <div className="flex h-full flex-col justify-center gap-4 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        {Array.from({ length: rows }).map((_, r) => {
          const row = books.slice(r * perRow, (r + 1) * perRow);
          const items = row.length ? [...row, ...row] : [];
          return (
            <div
              key={r}
              className={cn("flex w-max gap-4", r % 2 ? "animate-marquee-reverse" : "animate-marquee", paused && "[animation-play-state:paused]")}
              style={{ animationDuration: `${70 + r * 15}s` }}
            >
              {items.map((b, i) => (
                <Link
                  key={`${b.id}-${i}`}
                  to="/livro/$id"
                  params={{ id: b.id }}
                  tabIndex={i >= row.length ? -1 : 0}
                  aria-hidden={i >= row.length}
                  className="block w-24 shrink-0 overflow-hidden rounded-lg bg-surface-3 shadow-card ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-elevated sm:w-28"
                >
                  <img src={coverUrl(b.coverId, "M")} alt={b.title} loading="lazy" className="aspect-[2/3] w-full object-cover" />
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      <button
        onClick={() => setPaused((p) => !p)}
        className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full border glass shadow-soft"
        aria-label={paused ? "Retomar animação das capas" : "Pausar animação das capas"}
      >
        {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </button>
    </div>
  );
}
