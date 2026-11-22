import { createFileRoute, Link } from "@tanstack/react-router";
import { BookCheck, Bookmark, Flame, Star, Trophy } from "lucide-react";
import { BookCover } from "@/components/common";
import { ShelfQuickToggle } from "@/components/ShelfButton";
import { Container, EmptyState } from "@/components/ui";
import { POPULAR_SUBJECTS, ranked, trending, type RankedBook, type RankSort, type TrendPeriod } from "@/lib/api/rankings";
import { useAsync } from "@/lib/hooks";
import { cn, compactNumber } from "@/lib/utils";

type Lista = "em-alta" | "mais-lidos" | "mais-desejados" | "mais-bem-avaliados";
type Search = { lista?: Lista; periodo?: TrendPeriod; tema?: string; pt?: boolean };

const LISTS: { value: Lista; label: string; icon: typeof Flame; sort?: RankSort; hint: string }[] = [
  { value: "em-alta", label: "Em alta", icon: Flame, hint: "Os livros mais procurados por leitores do mundo todo no período." },
  { value: "mais-lidos", label: "Mais lidos", icon: BookCheck, sort: "already_read", hint: "Quantas pessoas marcaram o livro como lido." },
  { value: "mais-desejados", label: "Mais desejados", icon: Bookmark, sort: "want_to_read", hint: "Os que mais gente colocou na lista de “quero ler”." },
  { value: "mais-bem-avaliados", label: "Mais bem avaliados", icon: Star, sort: "rating", hint: "Maior nota média, entre livros com pelo menos 50 avaliações." },
];
const PERIODS: { value: TrendPeriod; label: string }[] = [
  { value: "daily", label: "Hoje" },
  { value: "weekly", label: "Semana" },
  { value: "monthly", label: "Mês" },
  { value: "yearly", label: "Ano" },
];

export const Route = createFileRoute("/ranking")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    lista: LISTS.some((l) => l.value === s.lista) ? (s.lista as Lista) : undefined,
    periodo: PERIODS.some((p) => p.value === s.periodo) ? (s.periodo as TrendPeriod) : undefined,
    tema: typeof s.tema === "string" && s.tema ? s.tema : undefined,
    pt: s.pt === true || s.pt === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ranking de livros — Biblioteca Viva" },
      { name: "description", content: "Os livros em alta, mais lidos, mais desejados e mais bem avaliados, com dados abertos da Open Library." },
    ],
  }),
  component: Ranking,
});

function Ranking() {
  const s = Route.useSearch();
  const navigate = Route.useNavigate();
  const lista = s.lista ?? "em-alta";
  const periodo = s.periodo ?? "weekly";
  const cfg = LISTS.find((l) => l.value === lista)!;
  const usesTrending = lista === "em-alta" && !s.tema && !s.pt;
  const set = (patch: Partial<Search>) => navigate({ search: (prev: Search) => ({ ...prev, ...patch }), replace: true });

  const data = useAsync<RankedBook[]>(
    (signal) =>
      usesTrending
        ? trending(periodo, 25, signal)
        : ranked(cfg.sort ?? "currently_reading", { subject: s.tema, lang: s.pt ? "por" : undefined, limit: 25, signal }),
    [lista, periodo, s.tema, s.pt],
  );
  const books = data.data ?? [];

  return (
    <div className="pt-16 pb-16 lg:pt-24">
      <div className="border-b bg-surface-2/60">
        <Container className="py-6 md:py-8">
          <h1 className="flex items-center gap-2.5 text-3xl md:text-4xl">
            <Trophy className="size-7 text-accent" /> Ranking de livros
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{cfg.hint} Dados abertos da Open Library, atualizados todo dia.</p>

          <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0" role="tablist" aria-label="Lista">
            {LISTS.map((l) => (
              <button
                key={l.value}
                role="tab"
                aria-selected={lista === l.value}
                onClick={() => set({ lista: l.value === "em-alta" ? undefined : l.value })}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
                  lista === l.value ? "border-primary bg-primary text-primary-foreground" : "bg-surface hover:border-primary",
                )}
              >
                <l.icon className="size-4" /> {l.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {lista === "em-alta" && !s.tema && !s.pt && (
              <div className="flex gap-1 rounded-full border bg-surface p-1" role="radiogroup" aria-label="Período">
                {PERIODS.map((p) => (
                  <button key={p.value} role="radio" aria-checked={periodo === p.value} onClick={() => set({ periodo: p.value === "weekly" ? undefined : p.value })} className={cn("rounded-full px-3 py-1", periodo === p.value ? "bg-foreground text-background" : "text-muted-foreground")}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <select
              value={s.tema ?? ""}
              onChange={(e) => set({ tema: e.target.value || undefined })}
              className="h-9 rounded-full border bg-surface px-3 outline-none focus:border-primary"
              aria-label="Filtrar por tema"
            >
              <option value="">Todos os temas</option>
              {POPULAR_SUBJECTS.map((t) => (
                <option key={t.slug} value={t.slug}>{t.label}</option>
              ))}
            </select>
            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border bg-surface px-3">
              <input type="checkbox" checked={!!s.pt} onChange={(e) => set({ pt: e.target.checked || undefined })} className="accent-primary" />
              Só em português
            </label>
          </div>
        </Container>
      </div>

      <Container className="mt-8">
        {data.loading ? (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] rounded-xl" />)}</div>
        ) : data.error || books.length === 0 ? (
          <EmptyState icon={<Trophy className="size-6" />} title="Ranking indisponível agora" description="A Open Library pode estar instável. Tente de novo em instantes ou mude o filtro." />
        ) : (
          <>
            {/* Pódio */}
            <ol className="grid grid-cols-3 items-end gap-3 sm:gap-6 md:mx-auto md:max-w-3xl">
              {[1, 0, 2].map((i) => books[i] && <Podium key={books[i].id} book={books[i]} pos={i + 1} lista={lista} />)}
            </ol>

            {/* 4º em diante */}
            <ol start={4} className="mt-10 divide-y rounded-3xl border bg-surface">
              {books.slice(3).map((b, i) => (
                <li key={b.id}>
                  <Link to="/livro/$id" params={{ id: b.id }} className="group flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                    <span className="w-8 shrink-0 text-center font-serif text-2xl font-semibold text-muted-foreground tabular-nums">{i + 4}</span>
                    <BookCover coverId={b.coverId} title={b.title} size="S" className="w-12 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-primary">{b.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{b.authors[0]}{b.year ? ` · ${b.year}` : ""}</p>
                    </div>
                    <Stat book={b} lista={lista} className="hidden sm:flex" />
                    <ShelfQuickToggle book={{ id: b.id, title: b.title, author: b.authors[0], coverId: b.coverId }} />
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </Container>
    </div>
  );
}

function Stat({ book, lista, className }: { book: RankedBook; lista: Lista; className?: string }) {
  const v =
    lista === "mais-lidos" ? book.alreadyRead && `${compactNumber(book.alreadyRead)} leram`
    : lista === "mais-desejados" ? book.wantToRead && `${compactNumber(book.wantToRead)} querem ler`
    : lista === "mais-bem-avaliados" ? book.rating && `★ ${book.rating.toFixed(2).replace(".", ",")}`
    : undefined;
  if (!v) return null;
  return <span className={cn("shrink-0 items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground", className)}>{v}</span>;
}

function Podium({ book, pos, lista }: { book: RankedBook; pos: number; lista: Lista }) {
  return (
    <li className={cn("relative flex flex-col items-center text-center", pos === 1 ? "order-2" : pos === 2 ? "order-1" : "order-3")}>
      <Link to="/livro/$id" params={{ id: book.id }} className="group w-full">
        <div className={cn("relative mx-auto", pos === 1 ? "w-full" : "w-[86%]")}>
          <BookCover coverId={book.coverId} title={book.title} author={book.authors[0]} size="L" className="shadow-elevated transition group-hover:-translate-y-1" />
          <span
            className={cn(
              "absolute -bottom-4 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full border-4 border-background font-serif text-lg font-bold",
              pos === 1 ? "bg-accent text-foreground" : "bg-surface-3 text-foreground",
            )}
          >
            {pos}
          </span>
          <ShelfQuickToggle book={{ id: book.id, title: book.title, author: book.authors[0], coverId: book.coverId }} className="absolute top-2 right-2" />
        </div>
        <p className="mt-6 line-clamp-2 text-sm font-semibold group-hover:text-primary">{book.title}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.authors[0]}</p>
        <div className="mt-1.5 flex justify-center"><Stat book={book} lista={lista} className="flex" /></div>
      </Link>
    </li>
  );
}
