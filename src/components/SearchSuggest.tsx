import { BookOpen, Loader2, PenLine } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { FREE_CLASSICS } from "@/data/content";
import { POPULAR_AUTHORS } from "@/data/popularAuthors";
import { authorMatches, coverUrl, suggestAll, type AuthorSuggestion, type Book } from "@/lib/api/openlibrary";
import { useDebounce } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Fecha a lista ao sair do campo — MENOS quando a pessoa só trocou de janela/aba/monitor: aí a página inteira
 * perde o foco (document.hasFocus() = false) e a lista continua lá quando ela voltar.
 */
export function closeUnlessWindowSwitch(close: () => void) {
  setTimeout(() => {
    if (document.hasFocus()) close();
  }, 0);
}

/** Autores conhecidos que combinam com o texto — instantâneo, sem rede. */
export function localAuthorSuggestions(q: string): AuthorSuggestion[] {
  if (q.trim().length < 2) return [];
  return POPULAR_AUTHORS.filter((a) => authorMatches(a.name, q)).map((a) => ({ key: `local:${a.name}`, name: a.name, topWork: a.topWork }));
}

/** Título começa com o texto (palavra a palavra, sem acento) — para clássicos e histórico, sem rede. */
const titleMatches = (title: string, q: string) => {
  const words = norm(title).split(/[\s:,.-]+/);
  const t = norm(q).split(/\s+/).filter(Boolean);
  return t.length > 0 && t.every((w) => words.some((x) => x.startsWith(w)));
};

const uniqueBy = <T,>(list: T[], key: (x: T) => string) => {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(key(x)) ? false : (seen.add(key(x)), true)));
};

/**
 * Sugestões enquanto a pessoa digita: livros (capa, título, autor) e autores (nome, nº de obras).
 * Uso: const box = useSuggestBox(texto, ["books", "authors"], onSelect);
 *      <input onKeyDown={box.onKeyDown} … />  e  {open && <SuggestList box={box} />}
 * Setas ↑/↓ escolhem, Enter abre, Esc fecha. Linhas com 48px+ para o dedo.
 */
export type Suggestion = { type: "book"; book: Book } | { type: "author"; author: AuthorSuggestion };
type Kind = "books" | "authors";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function useSuggestBox(q: string, kinds: Kind[], onSelect: (s: Suggestion) => void) {
  const wantBooks = kinds.includes("books");
  const wantAuthors = kinds.includes("authors");
  const text = q.trim();
  const debounced = useDebounce(text, 160);
  const [net, setNet] = useState<{ books: Book[]; authors: AuthorSuggestion[] }>({ books: [], authors: [] });
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const history = useStore((s) => s.history);

  // 1) instantâneo, sem rede: autores conhecidos, clássicos grátis e livros que a pessoa já abriu
  const local = useMemo(() => {
    if (text.length < 2) return { books: [] as Book[], authors: [] as AuthorSuggestion[] };
    const known: Book[] = [
      ...history.map((h) => ({ id: h.id, title: h.title, authors: h.author ? [h.author] : [], coverId: h.coverId, subjects: [] })),
      ...FREE_CLASSICS.map((b) => ({ id: b.id, title: b.title, authors: [b.author], coverId: b.coverId, subjects: [] })),
    ];
    return {
      books: known.filter((b) => titleMatches(b.title, text) || b.authors.some((a) => authorMatches(a, text))).slice(0, 3),
      authors: localAuthorSuggestions(text),
    };
  }, [text, history]);

  // 2) Open Library (a partir de 3 letras; um pedido só; com memória). Os resultados anteriores ficam
  //    na tela até os novos chegarem — a lista não pisca a cada letra.
  useEffect(() => {
    setActive(-1);
    if (debounced.length < 3) {
      setNet({ books: [], authors: [] });
      setLoading(false);
      return;
    }
    const c = new AbortController();
    setLoading(true);
    suggestAll(debounced, c.signal)
      .then((r) => !c.signal.aborted && setNet(r))
      .catch(() => {})
      .finally(() => !c.signal.aborted && setLoading(false));
    return () => c.abort();
  }, [debounced]);

  const items = useMemo<Suggestion[]>(() => {
    if (text.length < 2) return [];
    const authors = wantAuthors
      ? uniqueBy([...local.authors, ...net.authors.filter((a) => authorMatches(a.name, text))], (a) => norm(a.name)).slice(0, wantBooks ? 3 : 6)
      : [];
    const books = wantBooks ? uniqueBy([...local.books, ...net.books], (b) => b.id).slice(0, 6) : [];
    return [...authors.map((author): Suggestion => ({ type: "author", author })), ...books.map((book): Suggestion => ({ type: "book", book }))];
  }, [text, local, net, wantAuthors, wantBooks]);

  /** Devolve true quando a tecla foi usada pela lista (o formulário não deve tratar o Enter). */
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!items.length) return false;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length));
      return true;
    }
    if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      onSelect(items[active]);
      return true;
    }
    return false;
  };

  return { q: text, items, loading, active, setActive, onKeyDown, onSelect, visible: text.length >= 2 && (loading || items.length > 0) };
}

/** Destaca o trecho digitado (sem ligar para acento ou maiúscula). */
function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? norm(text).indexOf(norm(q)) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-foreground">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function SuggestList({ box, id, className }: { box: ReturnType<typeof useSuggestBox>; id: string; className?: string }) {
  if (!box.visible) return null;
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Sugestões"
      className={cn("absolute inset-x-0 top-full z-50 mt-2 flex max-h-[60vh] flex-col overflow-y-auto rounded-xl border bg-surface p-1.5 text-left shadow-elevated", className)}
      // mousedown (e não click): escolhe antes de o campo perder o foco e a lista fechar
      onMouseDown={(e) => e.preventDefault()}
    >
      {box.loading && (
        // aviso discreto no fim da lista: as sugestões que já chegaram continuam clicáveis
        <li className="order-last flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Buscando mais no acervo…
        </li>
      )}
      {box.items.map((s, i) => (
        <li
          key={s.type === "book" ? `b-${s.book.id}` : `a-${s.author.key}`}
          role="option"
          aria-selected={i === box.active}
          onMouseEnter={() => box.setActive(i)}
          onClick={() => box.onSelect(s)}
          className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5", i === box.active && "bg-surface-2")}
        >
          {s.type === "book" ? (
            <>
              {s.book.coverId ? (
                <img src={coverUrl(s.book.coverId, "S")} alt="" className="h-11 w-8 shrink-0 rounded-sm object-cover" loading="lazy" />
              ) : (
                <span className="grid h-11 w-8 shrink-0 place-items-center rounded-sm bg-surface-2 text-muted-foreground">
                  <BookOpen className="size-4" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-muted-foreground">
                  <Highlight text={s.book.title} q={box.q} />
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[s.book.authors[0], s.book.year].filter(Boolean).join(" · ")}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <PenLine className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-muted-foreground">
                  <Highlight text={s.author.name} q={box.q} />
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Autor{s.author.topWork ? ` · ${s.author.topWork}` : ""}
                </span>
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
