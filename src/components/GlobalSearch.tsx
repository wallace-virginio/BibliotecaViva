import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarDays, Coffee, GraduationCap, Hammer, Library as LibraryIcon, Loader2, MessagesSquare, PenLine, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EVENTS } from "@/data/content";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { coverUrl, suggestAll, type AuthorSuggestion, type Book } from "@/lib/api/openlibrary";
import { localAuthorSuggestions } from "@/components/SearchSuggest";
import { useDebounce } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const TOPICS = ["Arquitetura de Dados", "História do Brasil", "Programação", "Inteligência Artificial", "Machado de Assis"];
const TYPES = ["Livros", "Eventos", "Bibliotecas", "Cursos", "Oficinas", "Clubes de leitura", "Espaços de estudo"];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function GlobalSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<AuthorSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(q, 180);
  const navigate = useNavigate();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = debounced.trim();
    if (t.length < 2) {
      setBooks([]);
      setAuthors([]);
      return;
    }
    // autores conhecidos na hora (sem rede); livros e mais autores chegam num pedido só, a partir de 3 letras
    const quick = localAuthorSuggestions(t);
    setAuthors(quick.slice(0, 3));
    if (t.length < 3) {
      setBooks([]);
      return;
    }
    const c = new AbortController();
    setLoading(true);
    suggestAll(t, c.signal)
      .then((r) => {
        if (c.signal.aborted) return;
        setBooks(r.books);
        const seen = new Set(quick.map((a) => a.name.toLowerCase()));
        setAuthors([...quick, ...r.authors.filter((a) => !seen.has(a.name.toLowerCase()))].slice(0, 3));
      })
      .catch(() => {})
      .finally(() => !c.signal.aborted && setLoading(false));
    return () => c.abort();
  }, [debounced]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const local = useMemo(() => {
    const t = norm(q.trim());
    if (t.length < 2) return { libs: [], events: [], courses: [], workshops: [], clubs: [], spaces: [] };
    const words = t.split(/\s+/);
    const match = (s: string) => words.every((w) => norm(s).includes(w));
    const libs = FEATURED_LIBRARIES.filter((l) => match(`${l.name} ${l.city} ${l.country} ${l.kind}`)).slice(0, 4);
    const evs = EVENTS.filter((e) => match(`${e.title} ${e.category} ${e.description}`));
    return {
      libs,
      events: evs.filter((e) => !["Curso", "Oficina", "Clube de leitura"].includes(e.category)).slice(0, 3),
      courses: evs.filter((e) => e.category === "Curso").slice(0, 3),
      workshops: evs.filter((e) => e.category === "Oficina").slice(0, 3),
      clubs: evs.filter((e) => e.category === "Clube de leitura").slice(0, 3),
      spaces: FEATURED_LIBRARIES.filter((l) => l.curations.includes("estudar") && match(`${l.name} ${l.city} estudo estudar silencio ${l.country}`)).slice(0, 3),
    };
  }, [q]);

  const submit = (term = q) => {
    if (!term.trim()) return;
    setOpen(false);
    navigate({ to: "/acervo", search: { q: term.trim() } });
  };

  const hasQuery = q.trim().length >= 2;

  return (
    <div ref={box} className={cn("relative mx-auto w-full max-w-3xl", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          "group relative flex items-center rounded-xl border bg-surface shadow-soft transition-all",
          open && "border-primary shadow-elevated ring-4 ring-primary/10",
        )}
      >
        <Search className="ml-6 size-5 shrink-0 text-muted-foreground" />
        <input
          value={q}
          autoFocus={autoFocus}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder="O que você deseja aprender hoje?"
          className="h-16 min-w-0 flex-1 bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground md:h-[72px] md:text-lg"
          aria-label="Busca global"
        />
        {loading && <Loader2 className="mr-2 size-5 animate-spin text-primary" />}
        <button type="submit" className="mr-2 grid size-12 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover md:size-14" aria-label="Buscar">
          <ArrowRight className="size-5" />
        </button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+10px)] z-50 max-h-[70vh] animate-fade-up overflow-y-auto rounded-3xl border bg-surface p-3 text-left shadow-elevated">
          {!hasQuery ? (
            <div className="p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sugestões</p>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} onClick={() => setQ(t)} className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition hover:border-primary hover:text-primary">
                    <Search className="size-3.5 text-muted-foreground" /> {t}
                  </button>
                ))}
              </div>
              <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pesquisa simultaneamente em</p>
              <p className="text-sm text-muted-foreground">{TYPES.join(" · ")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <Group title="Autores" icon={<PenLine className="size-4" />}>
                {authors.map((a) => (
                  <Link
                    key={a.key}
                    to="/acervo"
                    search={{ autor: a.name }}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 hover:bg-surface-2"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                      <PenLine className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Autor{a.topWork ? ` · ${a.topWork}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </Group>
              <Group title="Livros" icon={<BookOpen className="size-4" />} loading={loading && !books.length}>
                {books.map((b) => (
                  <Link key={b.id} to="/livro/$id" params={{ id: b.id }} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-surface-2">
                    <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-surface-3">
                      {b.coverId && <img src={coverUrl(b.coverId, "S")} alt="" className="size-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.authors[0]}{b.year ? ` · ${b.year}` : ""}</p>
                    </div>
                  </Link>
                ))}
              </Group>
              <Group title="Bibliotecas" icon={<LibraryIcon className="size-4" />}>
                {local.libs.map((l) => (
                  <Row key={l.slug} to={`/biblioteca/${l.slug}`} title={l.name} sub={`${l.city}, ${l.country}`} onClick={() => setOpen(false)} />
                ))}
              </Group>
              <Group title="Cursos" icon={<GraduationCap className="size-4" />}>
                {local.courses.map((e) => <Row key={e.id} to="/eventos" title={e.title} sub={e.time} onClick={() => setOpen(false)} />)}
              </Group>
              <Group title="Oficinas" icon={<Hammer className="size-4" />}>
                {local.workshops.map((e) => <Row key={e.id} to="/eventos" title={e.title} sub={e.time} onClick={() => setOpen(false)} />)}
              </Group>
              <Group title="Clubes de leitura" icon={<MessagesSquare className="size-4" />}>
                {local.clubs.map((e) => <Row key={e.id} to="/comunidade" title={e.title} sub={e.time} onClick={() => setOpen(false)} />)}
              </Group>
              <Group title="Eventos" icon={<CalendarDays className="size-4" />}>
                {local.events.map((e) => <Row key={e.id} to="/eventos" title={e.title} sub={e.category} onClick={() => setOpen(false)} />)}
              </Group>
              <Group title="Espaços de estudo" icon={<Coffee className="size-4" />}>
                {local.spaces.map((l) => <Row key={l.slug} to="/salas" title={l.name} sub={`${l.rooms.available} salas livres`} onClick={() => setOpen(false)} />)}
              </Group>
              <button onClick={() => submit()} className="mt-1 flex w-full items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-sm font-medium hover:bg-surface-3">
                Ver todos os resultados para “{q}” <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ title, icon, children, loading }: { title: string; icon: ReactNode; children: ReactNode; loading?: boolean }) {
  const arr = Array.isArray(children) ? children : [children];
  if (!loading && arr.filter(Boolean).length === 0) return null;
  return (
    <div className="py-1">
      <p className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span> {title}
      </p>
      {loading ? <div className="skeleton mx-3 h-12 rounded-2xl" /> : children}
    </div>
  );
}

function Row({ to, title, sub, onClick }: { to: string; title: string; sub?: string; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 hover:bg-surface-2">
      <span className="truncate text-sm font-medium">{title}</span>
      {sub && <span className="shrink-0 text-xs text-muted-foreground">{sub}</span>}
    </Link>
  );
}
