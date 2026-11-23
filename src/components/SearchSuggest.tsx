import { BookOpen, Loader2, PenLine } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { coverUrl, suggestAuthors, suggestBooks, type AuthorSuggestion, type Book } from "@/lib/api/openlibrary";
import { useDebounce } from "@/lib/hooks";
import { cn } from "@/lib/utils";

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
  const debounced = useDebounce(q, 250);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const kindsKey = kinds.join(",");

  useEffect(() => {
    const t = debounced.trim();
    setActive(-1);
    if (t.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    const c = new AbortController();
    setLoading(true);
    Promise.all([
      kindsKey.includes("authors") ? suggestAuthors(t, c.signal).catch(() => []) : Promise.resolve([]),
      kindsKey.includes("books") ? suggestBooks(t, c.signal).catch(() => []) : Promise.resolve([]),
    ]).then(([authors, books]) => {
      if (c.signal.aborted) return;
      // com livros também na lista, mostra só os autores mais relevantes
      const a = kindsKey.includes("books") ? authors.slice(0, 2) : authors;
      setItems([...a.map((author): Suggestion => ({ type: "author", author })), ...books.map((book): Suggestion => ({ type: "book", book }))]);
      setLoading(false);
    });
    return () => c.abort();
  }, [debounced, kindsKey]);

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

  return { q: debounced.trim(), items, loading, active, setActive, onKeyDown, onSelect, visible: debounced.trim().length >= 2 && (loading || items.length > 0) };
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
      className={cn("absolute inset-x-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border bg-surface p-1.5 text-left shadow-elevated", className)}
      // mousedown (e não click): escolhe antes de o campo perder o foco e a lista fechar
      onMouseDown={(e) => e.preventDefault()}
    >
      {box.loading && !box.items.length && (
        <li className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Procurando…
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
