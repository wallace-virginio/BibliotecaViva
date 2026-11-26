import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenText, BookX, Flame, MapPin, PenLine, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard, BookGridSkeleton } from "@/components/common";
import { closeUnlessWindowSwitch, SuggestList, useSuggestBox } from "@/components/SearchSuggest";
import { LoadMoreSentinel } from "@/components/motion";
import { PopularSubjects, RankNumber, ShelfRow, TrendingSidebar } from "@/components/Ranking";
import { Button, Container, EmptyState } from "@/components/ui";
import { FREE_CLASSICS } from "@/data/content";
import { booksBySubject, searchBooks, type Book } from "@/lib/api/openlibrary";
import { POPULAR_SUBJECTS, trending } from "@/lib/api/rankings";
import { FEATURES } from "@/lib/features";
import { CATEGORIES, COMIC_CATEGORIES, hasLatinTitle, isAvailable, MATERIAL_TYPES } from "@/lib/catalog";
import { useAsync } from "@/lib/hooks";
import { useLocation, useNearbyLibraries } from "@/lib/location";
import { cn, formatNumber } from "@/lib/utils";
import { usePageTitle, useT } from "@/lib/i18n";

type Search = { q?: string; autor?: string; categoria?: string; tipo?: string; disponivel?: boolean; ebook?: boolean; pagina?: number };

export const Route = createFileRoute("/acervo")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    autor: typeof s.autor === "string" && s.autor.trim() ? s.autor.trim().slice(0, 80) : undefined,
    categoria: typeof s.categoria === "string" && s.categoria ? s.categoria : undefined,
    tipo: typeof s.tipo === "string" && s.tipo ? s.tipo : undefined,
    disponivel: s.disponivel === true || s.disponivel === "true" ? true : undefined,
    ebook: s.ebook === true || s.ebook === "true" ? true : undefined,
    pagina: Number(s.pagina) > 1 ? Number(s.pagina) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acervo — Biblioteca Viva" },
      { name: "description", content: "Busque livros, revistas, jornais e documentos históricos — leia de graça os de domínio público ou veja onde comprar." },
    ],
  }),
  component: Acervo,
});

const PAGE = 30;
const FREE_BOOKS: Book[] = FREE_CLASSICS.map((b) => ({ id: b.id, title: b.title, authors: [b.author], coverId: b.coverId, subjects: [], ebook: true }));

function Acervo() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/acervo" });
  const [input, setInput] = useState(search.q ?? "");
  useEffect(() => setInput(search.q ?? ""), [search.q]);
  const [focused, setFocused] = useState(false);
  const suggest = useSuggestBox(input, ["books", "authors"], (s) => {
    setFocused(false);
    if (s.type === "book") navigate({ to: "/livro/$id", params: { id: s.book.id } });
    else {
      setInput("");
      navigate({ search: (p: Search) => ({ ...p, pagina: undefined, q: undefined, autor: s.author.name }) });
    }
  });
  const { location, ask } = useLocation();
  const nearby = useNearbyLibraries();
  const t = useT();
  usePageTitle(t.acervo.metaTitle);

  const tipo = MATERIAL_TYPES.find((t) => t.value === (search.tipo ?? "livros")) ?? MATERIAL_TYPES[0];
  const subject = search.categoria || tipo.subject || undefined;
  // filtro de retirada só vale com bibliotecas conectadas; links antigos com ?disponivel= são ignorados
  const disponivel = FEATURES.reservas && !!search.disponivel;
  const browsing = !search.q && !search.autor && !search.categoria && !search.tipo && !search.ebook && !disponivel;
  // com autor escolhido e sem categoria, não restringe ao assunto padrão do tipo (senão some parte da obra do autor)
  const subjectFor = search.autor && !search.categoria ? undefined : subject;

  const results = useAsync(
    (signal) =>
      browsing ? Promise.resolve(undefined) : searchBooks(search.q ?? "", { subject: subjectFor, author: search.autor, page: 1, limit: PAGE, ebook: search.ebook, signal }),
    [browsing, search.q, search.autor, subjectFor, search.ebook],
  );

  // j24 · carregar mais ao chegar no fim (no lugar de "próxima página")
  const queryKey = `${search.q}|${search.autor}|${subjectFor}|${search.ebook}`;
  const [more, setMore] = useState<{ key: string; books: Book[]; page: number; loading: boolean; failed: boolean }>({ key: "", books: [], page: 1, loading: false, failed: false });
  const extra = more.key === queryKey ? more : { key: queryKey, books: [] as Book[], page: 1, loading: false, failed: false };
  const loaded = (results.data?.books.length ?? 0) + extra.books.length;
  const hasMore = !!results.data && loaded < results.data.total && !extra.failed;
  const loadMore = async () => {
    if (!hasMore || extra.loading) return;
    const page = extra.page + 1;
    setMore({ ...extra, loading: true });
    try {
      const r = await searchBooks(search.q ?? "", { subject: subjectFor, author: search.autor, page, limit: PAGE, ebook: search.ebook });
      setMore((m) => (m.key === queryKey || extra.key === queryKey ? { key: queryKey, books: [...extra.books, ...r.books], page, loading: false, failed: r.books.length === 0 } : m));
    } catch {
      setMore({ ...extra, loading: false, failed: true });
    }
  };

  const near = nearby.data;
  const comics = COMIC_CATEGORIES.has(search.categoria ?? "");
  const books = [...(results.data?.books ?? []), ...extra.books]
    .filter((b) => !disponivel || isAvailable(b.id, near))
    // em quadrinhos, esconde títulos só em japonês/chinês (ilegíveis para quem busca aqui)
    .filter((b) => !comics || hasLatinTitle(b.title));
  const set = (patch: Partial<Search>) => navigate({ search: (s: Search) => ({ ...s, pagina: undefined, ...patch }) });

  const toggleNearMe = () => {
    if (!search.disponivel && !location) ask();
    set({ disponivel: search.disponivel ? undefined : true });
  };

  return (
    <div className="pt-16 pb-16 lg:pt-24">
      {/* Cabeçalho compacto: tipo de material + busca + botão no fim da mesma barra */}
      <div className="border-b bg-surface-2/60">
        <Container className="py-5 md:py-7">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl">{t.acervo.title}</h1>
              <p className="text-sm text-muted-foreground">{t.acervo.subtitle}</p>
            </div>
          </div>
          <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFocused(false);
              set({ q: input.trim() || undefined });
            }}
            className="mt-4 flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-soft focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 md:flex-row md:items-center md:rounded-full"
            role="search"
          >
            <div className="flex shrink-0 gap-1 overflow-x-auto border-b p-1.5 scrollbar-none md:border-r md:border-b-0" role="radiogroup" aria-label={t.acervo.materialType}>
              {MATERIAL_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={tipo.value === m.value}
                  onClick={() => set({ tipo: m.value === "livros" ? undefined : m.value, categoria: undefined })}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition",
                    tipo.value === m.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  {t.materials[m.value]}
                </button>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 items-center">
              <Search className="ml-4 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setFocused(true);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => closeUnlessWindowSwitch(() => setFocused(false))}
                onKeyDown={(e) => (e.key === "Escape" ? setFocused(false) : suggest.onKeyDown(e))}
                placeholder={t.acervo.placeholder(t.materials[tipo.value])}
                className="h-12 min-w-0 flex-1 bg-transparent px-3 outline-none"
                aria-label={t.acervo.searchLabel}
                role="combobox"
                aria-expanded={focused && suggest.visible}
                aria-controls="acervo-sugestoes"
                aria-autocomplete="list"
                autoComplete="off"
              />
              {input && (
                <button type="button" onClick={() => { setInput(""); set({ q: undefined }); }} className="grid size-9 place-items-center text-muted-foreground" aria-label={t.acervo.clear}>
                  <X className="size-4" />
                </button>
              )}
              <Button type="submit" className="mr-1.5 shrink-0" size="sm">
                {t.common.search}
              </Button>
            </div>
          </form>
          {/* sugestões ao digitar: autores (aplicam o filtro) e livros (abrem a página do livro) */}
          {focused && <SuggestList box={suggest} id="acervo-sugestoes" />}
          </div>

          {/* Filtros ANTES dos resultados */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* disponibilidade física só existe com bibliotecas conectadas (lib/features.ts) */}
            {FEATURES.reservas && (
              <FilterChip active={!!search.disponivel} onClick={toggleNearMe} icon={<MapPin className="size-3.5" />}>
                {t.acervo.pickupNear(location?.label)}
              </FilterChip>
            )}
            <FilterChip active={!!search.ebook} onClick={() => set({ ebook: search.ebook ? undefined : true })} icon={<BookOpenText className="size-3.5" />}>
              {t.acervo.freeFilter}
            </FilterChip>
            <AuthorFilter value={search.autor} onChange={(autor) => set({ autor })} />
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <div className="-mx-4 flex w-full gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:w-auto sm:flex-wrap sm:px-0">
              {CATEGORIES.slice(1).map((c) => (
                <FilterChip key={c.value} active={search.categoria === c.value} onClick={() => set({ categoria: search.categoria === c.value ? undefined : c.value })}>
                  {t.categories[c.value as keyof typeof t.categories]}
                </FilterChip>
              ))}
            </div>
          </div>
        </Container>
      </div>

      <Container className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {browsing ? (
            <Shelves onSubject={(slug) => set({ categoria: slug })} />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {results.data ? (
                    <>
                      <strong className="text-foreground">{formatNumber(results.data.total)}</strong> {t.acervo.results}
                      {disponivel && t.acervo.availableNear(books.length, location?.label)}
                    </>
                  ) : (
                    t.common.searching
                  )}
                </span>
                {!browsing && (
                  <button onClick={() => navigate({ search: {} })} className="text-primary hover:underline">{t.acervo.clearFilters}</button>
                )}
              </div>
              {results.loading ? (
                <BookGridSkeleton count={15} className="grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5" />
              ) : results.error ? (
                <EmptyState icon={<BookX className="size-6" />} title={t.acervo.errorTitle} description={t.acervo.errorText} />
              ) : books.length === 0 ? (
                <EmptyState
                  icon={<BookX className="size-6" />}
                  title={disponivel ? t.acervo.emptyNearTitle : t.acervo.emptyTitle}
                  description={disponivel ? t.acervo.emptyNearText : t.acervo.emptyText}
                />
              ) : (
                <div className="grid grid-cols-3 gap-x-3.5 gap-y-6 sm:grid-cols-4 md:grid-cols-5">
                  {books.map((b) => {
                    // com o filtro "Grátis para ler" ligado, todos são grátis: o selo seria repetição
                    const free = b.ebook && !search.ebook;
                    const ok = FEATURES.reservas && isAvailable(b.id, near);
                    const badge = free ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success shadow-soft">
                        <BookOpenText className="size-3" aria-hidden /> {t.acervo.freeBadge}
                      </span>
                    ) : FEATURES.reservas ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-soft", ok ? "bg-success-soft text-success" : "bg-surface/90 text-muted-foreground")}>
                        {ok ? (location ? t.acervo.nearBadge : t.acervo.available) : t.acervo.lent}
                      </span>
                    ) : undefined;
                    return <BookCard key={b.id} book={b} badge={badge} />;
                  })}
                </div>
              )}
              {hasMore && books.length > 0 && <LoadMoreSentinel onVisible={loadMore} disabled={extra.loading} />}
              {results.data && books.length > 0 && (
                <div className="mt-8 flex justify-center">
                  {extra.loading ? (
                    <BookGridSkeleton count={5} className="w-full grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5" />
                  ) : hasMore ? (
                    <Button variant="outline" onClick={loadMore}>{t.acervo.loadMore}</Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.acervo.end(formatNumber(loaded))}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Lateral: ranking e temas (no celular vem depois dos resultados) */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* sem busca, "Em alta esta semana" já é a primeira estante da página: não repete aqui */}
          {!browsing && <TrendingSidebar />}
          <PopularSubjects onPick={(slug) => set({ categoria: slug })} active={search.categoria} />
        </aside>
      </Container>
    </div>
  );
}

/**
 * Filtro por autor: um botão "Autor" que vira campo de texto; aplicado, mostra "Autor: Fulano ✕".
 * Soma com os outros filtros (categoria, grátis para ler, disponível perto) e com a busca por título.
 */
function AuthorFilter({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [text, setText] = useState(value ?? "");
  const t = useT();
  useEffect(() => setText(value ?? ""), [value]);
  // sugestões de autores enquanto digita (nome + nº de obras)
  const suggest = useSuggestBox(open ? text : "", ["authors"], (s) => {
    if (s.type !== "author") return;
    setOpen(false);
    onChange(s.author.name);
  });

  if (value && !open)
    return (
      <FilterChip active onClick={() => onChange(undefined)} icon={<PenLine className="size-3.5" />}>
        {t.acervo.authorIs(value)} <X className="size-3.5" aria-label={t.acervo.removeAuthor} />
      </FilterChip>
    );
  if (!open)
    return (
      <FilterChip active={false} onClick={() => setOpen(true)} icon={<PenLine className="size-3.5" />}>
        {t.acervo.author}
      </FilterChip>
    );
  return (
    <div className="relative">
    <form
      role="search"
      aria-label={t.acervo.filterByAuthor}
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        onChange(text.trim() || undefined);
      }}
      className="flex h-9 items-center gap-1 rounded-full border border-primary bg-surface pr-1 pl-3"
    >
      <PenLine className="size-3.5 shrink-0 text-primary" aria-hidden />
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.key === "Escape" ? setOpen(false) : suggest.onKeyDown(e))}
        onFocus={() => setListOpen(true)}
        onBlur={() =>
          closeUnlessWindowSwitch(() => {
            setListOpen(false);
            if (!text.trim()) setOpen(false);
          })
        }
        placeholder={t.acervo.authorName}
        aria-label={t.acervo.authorName}
        role="combobox"
        aria-expanded={suggest.visible}
        aria-controls="autor-sugestoes"
        aria-autocomplete="list"
        autoComplete="off"
        className="w-36 min-w-0 bg-transparent text-sm outline-none sm:w-44"
      />
      <button type="submit" className="h-7 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">
        {t.acervo.filter}
      </button>
    </form>
    {listOpen && <SuggestList box={suggest} id="autor-sugestoes" className="right-auto w-[min(20rem,calc(100vw-2rem))]" />}
    </div>
  );
}

function FilterChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm transition",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-surface hover:border-primary",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Sem busca: estantes que aproveitam o espaço em vez de uma grade aleatória. */
function Shelves({ onSubject }: { onSubject: (slug: string) => void }) {
  const hot = useAsync((s) => trending("weekly", 12, s), []);
  const t1 = POPULAR_SUBJECTS[9]; // literatura brasileira
  const t2 = POPULAR_SUBJECTS[0]; // fantasia
  const s1 = useAsync((s) => booksBySubject(t1.slug, 12, s), []);
  const s2 = useAsync((s) => booksBySubject(t2.slug, 12, s), []);
  const t = useT();
  return (
    <div className="space-y-10">
      <ShelfRow title={t.ranking.trending} icon={<Flame className="size-5 text-deep" />} books={hot.data} loading={hot.loading} link={{ to: "/ranking", label: t.nav.ranking }} badge={(_, i) => <RankNumber n={i + 1} />} />
      <ShelfRow title={t.acervo.freeShelf} icon={<BookOpenText className="size-5 text-primary" />} books={FREE_BOOKS} link={{ to: "/acervo", label: t.acervo.seeMore, search: { ebook: "true" } }} />
      <ShelfRow title={t.subjects[t1.slug]} books={s1.data} loading={s1.loading} />
      <ShelfRow title={t.subjects[t2.slug]} books={s2.data} loading={s2.loading} />
      <button onClick={() => onSubject("history")} className="w-full rounded-2xl border border-dashed py-4 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary">
        {t.acervo.moreTopics}
      </button>
    </div>
  );
}
