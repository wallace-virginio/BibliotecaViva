import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, BookOpenText, ChevronLeft, ChevronRight, ExternalLink, List, Loader2, Type, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookCover } from "@/components/common";
import { buttonClass } from "@/components/ui";
import { getBook, type BookDetail } from "@/lib/api/openlibrary";
import { findReadableSource, loadChapter, loadWorkIndex, type Chapter, type ReadableSource } from "@/lib/api/reader";
import { useAsync } from "@/lib/hooks";
import { actions, useStore, type ReaderPrefs } from "@/lib/store";
import { confetti } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ler/$id")({
  head: () => ({
    meta: [
      { title: "Leitura — Biblioteca Viva" },
      { name: "description", content: "Leia livros de domínio público gratuitamente no app." },
    ],
  }),
  component: ReaderPage,
});

function ReaderPage() {
  const { id } = Route.useParams();
  const prefs = useStore((s) => s.readerPrefs);
  const data = useAsync(async (signal) => {
    const book = await getBook(id, signal);
    const source = await findReadableSource(book, signal);
    return { book, source };
  }, [id]);

  return (
    <div className={cn("reader-root", `reader-${prefs.theme}`)}>
      {data.loading ? (
        <div className="grid min-h-[100dvh] place-items-center">
          <div className="flex flex-col items-center gap-3 reader-muted">
            <Loader2 className="size-7 animate-spin" />
            <p className="text-sm">Procurando a edição digital gratuita…</p>
          </div>
        </div>
      ) : !data.data ? (
        <Unavailable id={id} />
      ) : !data.data.source ? (
        <Unavailable id={id} book={data.data.book} />
      ) : data.data.source.kind === "archive" ? (
        <ArchiveReader book={data.data.book} source={data.data.source} />
      ) : (
        <TextReader book={data.data.book} source={data.data.source} prefs={prefs} />
      )}
    </div>
  );
}

/* ---------------- Barra superior ---------------- */
function TopBar({ title, subtitle, children, visible = true }: { title: string; subtitle?: string; children?: React.ReactNode; visible?: boolean }) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "reader-bar fixed inset-x-0 top-0 z-30 border-b pt-[env(safe-area-inset-top)] transition-transform duration-300",
        !visible && "-translate-y-full",
      )}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
        <button onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/app/livros" }))} className="grid size-11 place-items-center rounded-full" aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="reader-muted truncate text-xs">{subtitle}</p>}
        </div>
        <div className="flex">{children}</div>
      </div>
    </header>
  );
}

/* ---------------- Leitor de texto (Wikisource) ---------------- */
function TextReader({ book, source, prefs }: { book: BookDetail; source: Extract<ReadableSource, { kind: "wikisource" }>; prefs: ReaderPrefs }) {
  const saved = useStore((s) => s.reading[book.id]);
  const index = useAsync((signal) => loadWorkIndex(source, signal), [source.page]);
  const chapters: Chapter[] = index.data?.chapters ?? [];
  const [chapter, setChapter] = useState<number>(saved?.chapter ?? 0);
  const [chrome, setChrome] = useState(true);
  const [panel, setPanel] = useState<"none" | "capitulos" | "texto">("none");
  const restoreOffset = useRef<number | undefined>(saved?.offset);
  const [offset, setOffset] = useState(saved?.offset ?? 0);

  const html = useAsync(async (signal) => {
    if (!index.data) return undefined;
    if (!chapters.length) return index.data.html ?? "";
    const c = chapters[Math.min(chapter, chapters.length - 1)];
    return loadChapter(source.lang, c.page, signal);
  }, [index.data, chapter]);

  const total = Math.max(chapters.length, 1);
  const percent = Math.min(100, Math.round(((Math.min(chapter, total - 1) + offset) / total) * 100));

  // terminou o livro: comemora uma vez (j29 · confete)
  const celebrated = useRef((saved?.percent ?? 0) >= 99);
  useEffect(() => {
    if (percent >= 99 && !celebrated.current && html.data) {
      celebrated.current = true;
      confetti();
      actions.setShelf({ id: book.id, title: book.title, author: book.authors[0], coverId: book.coverId }, "lido");
    }
  }, [percent, html.data, book]);

  const persist = useCallback(
    (off: number) =>
      actions.saveProgress({
        id: book.id,
        title: book.title,
        author: book.authors[0],
        coverId: book.coverId,
        chapter,
        offset: off,
        percent: Math.min(100, Math.round(((Math.min(chapter, total - 1) + off) / total) * 100)),
      }),
    [book, chapter, total],
  );

  // Restaura a posição salva quando o capítulo carrega; senão começa do topo.
  useEffect(() => {
    if (html.data === undefined) return;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const target = restoreOffset.current ?? 0;
      window.scrollTo({ top: max > 0 ? target * max : 0 });
      restoreOffset.current = undefined;
    });
  }, [html.data]);

  // Acompanha a rolagem: progresso + esconde as barras ao descer.
  useEffect(() => {
    let last = window.scrollY;
    let t: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const off = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
      setOffset(off);
      if (window.scrollY > last + 12) setChrome(false);
      else if (window.scrollY < last - 12) setChrome(true);
      last = window.scrollY;
      clearTimeout(t);
      t = setTimeout(() => persist(off), 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, [persist]);

  useEffect(() => {
    persist(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter]);

  const go = (i: number) => {
    setPanel("none");
    setOffset(0);
    restoreOffset.current = 0;
    setChapter(Math.max(0, Math.min(chapters.length - 1, i)));
  };

  const chapterTitle = chapters[chapter]?.title;

  return (
    <>
      <TopBar title={book.title} subtitle={chapterTitle ?? book.authors[0]} visible={chrome}>
        {chapters.length > 0 && (
          <button onClick={() => setPanel("capitulos")} className="grid size-11 place-items-center rounded-full" aria-label="Capítulos">
            <List className="size-5" />
          </button>
        )}
        <button onClick={() => setPanel("texto")} className="grid size-11 place-items-center rounded-full" aria-label="Ajustes de texto">
          <Type className="size-5" />
        </button>
      </TopBar>

      <main
        onClick={() => setChrome((c) => !c)}
        className="mx-auto max-w-[68ch] px-6 pt-[calc(env(safe-area-inset-top)+5.5rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)]"
      >
        {index.loading || html.loading ? (
          <div className="space-y-3 pt-6">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-current opacity-10" style={{ width: `${70 + ((i * 37) % 30)}%` }} />)}
          </div>
        ) : index.error || html.error ? (
          <p className="reader-muted pt-10 text-center">Não foi possível carregar este trecho agora. Verifique sua conexão.</p>
        ) : (
          <>
            {chapter === 0 && (
              <div className="mb-10 text-center">
                <p className="reader-muted text-sm">{book.authors.join(", ")}</p>
                <h1 className="mt-2 font-serif text-3xl font-semibold">{book.title}</h1>
              </div>
            )}
            <article
              className={cn("reader-content", prefs.font === "serif" ? "font-serif" : "font-sans")}
              style={{ fontSize: prefs.fontSize }}
              dangerouslySetInnerHTML={{ __html: html.data ?? "" }}
            />
            {chapters.length > 0 && (
              <div className="mt-14 flex items-center justify-between gap-3 font-sans" onClick={(e) => e.stopPropagation()}>
                <button disabled={chapter === 0} onClick={() => go(chapter - 1)} className="flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium disabled:opacity-30">
                  <ChevronLeft className="size-4" /> Anterior
                </button>
                <span className="reader-muted text-xs">{chapter + 1} / {chapters.length}</span>
                <button disabled={chapter >= chapters.length - 1} onClick={() => go(chapter + 1)} className="flex h-11 items-center gap-1 rounded-full px-4 text-sm font-medium disabled:opacity-30">
                  Próximo <ChevronRight className="size-4" />
                </button>
              </div>
            )}
            <p className="reader-muted mt-12 text-center font-sans text-xs">
              Texto em domínio público via{" "}
              <a href={`https://${source.lang}.wikisource.org/wiki/${encodeURIComponent(source.page)}`} target="_blank" rel="noreferrer" className="underline">Wikisource</a>.
            </p>
          </>
        )}
      </main>

      {/* Barra inferior de progresso */}
      <footer className={cn("reader-bar fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] transition-transform duration-300", !chrome && "translate-y-full")}>
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 text-xs">
          <span className="reader-muted w-10 tabular-nums">{percent}%</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-current/15">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          {chapters.length > 0 && <span className="reader-muted tabular-nums">Cap. {chapter + 1}/{chapters.length}</span>}
        </div>
      </footer>

      {panel !== "none" && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-overlay" onClick={() => setPanel("none")}>
          <div className="reader-bar max-h-[75dvh] animate-fade-up overflow-y-auto rounded-t-3xl border-t pb-[calc(env(safe-area-inset-bottom)+1rem)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-current opacity-20" />
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <p className="font-semibold">{panel === "capitulos" ? "Capítulos" : "Aparência"}</p>
              <button onClick={() => setPanel("none")} className="grid size-9 place-items-center rounded-full" aria-label="Fechar"><X className="size-4" /></button>
            </div>
            {panel === "capitulos" ? (
              <ul className="px-2">
                {chapters.map((c, i) => (
                  <li key={c.page}>
                    <button onClick={() => go(i)} className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm", i === chapter && "font-semibold text-primary")}>
                      <span className="reader-muted w-7 text-xs tabular-nums">{i + 1}</span>
                      <span className="flex-1">{c.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <TextSettings prefs={prefs} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TextSettings({ prefs }: { prefs: ReaderPrefs }) {
  const themes: { v: ReaderPrefs["theme"]; label: string }[] = [
    { v: "claro", label: "Claro" },
    { v: "sepia", label: "Sépia" },
    { v: "escuro", label: "Escuro" },
  ];
  return (
    <div className="space-y-6 px-5 pb-2">
      <div>
        <p className="reader-muted mb-2 text-xs font-medium uppercase">Tamanho do texto</p>
        <div className="flex items-center gap-3">
          <button onClick={() => actions.setReaderPrefs({ fontSize: Math.max(14, prefs.fontSize - 1) })} className="grid h-11 w-14 place-items-center rounded-xl border text-sm" style={{ borderColor: "var(--reader-border)" }}>A−</button>
          <input type="range" min={14} max={28} value={prefs.fontSize} onChange={(e) => actions.setReaderPrefs({ fontSize: +e.target.value })} className="flex-1 accent-primary" aria-label="Tamanho do texto" />
          <button onClick={() => actions.setReaderPrefs({ fontSize: Math.min(28, prefs.fontSize + 1) })} className="grid h-11 w-14 place-items-center rounded-xl border text-lg" style={{ borderColor: "var(--reader-border)" }}>A+</button>
        </div>
      </div>
      <div>
        <p className="reader-muted mb-2 text-xs font-medium uppercase">Tema</p>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => (
            <button key={t.v} onClick={() => actions.setReaderPrefs({ theme: t.v })} className={cn(`reader-${t.v}`, "h-14 rounded-2xl border-2 text-sm font-medium", prefs.theme === t.v ? "border-primary" : "border-transparent")} style={{ background: "var(--reader-bg)", color: "var(--reader-fg)" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="reader-muted mb-2 text-xs font-medium uppercase">Fonte</p>
        <div className="grid grid-cols-2 gap-2">
          {(["serif", "sans"] as const).map((f) => (
            <button key={f} onClick={() => actions.setReaderPrefs({ font: f })} className={cn("h-12 rounded-2xl border-2 text-base", f === "serif" ? "font-serif" : "font-sans", prefs.font === f ? "border-primary" : "border-transparent")} style={{ background: "color-mix(in oklch, var(--reader-fg) 6%, transparent)" }}>
              {f === "serif" ? "Literata" : "Inter"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Leitor de páginas digitalizadas (Internet Archive) ---------------- */
function ArchiveReader({ book, source }: { book: BookDetail; source: Extract<ReadableSource, { kind: "archive" }> }) {
  useEffect(() => {
    actions.saveProgress({ id: book.id, title: book.title, author: book.authors[0], coverId: book.coverId, percent: 1 });
  }, [book]);
  const src = useMemo(() => `https://archive.org/embed/${encodeURIComponent(source.identifier)}`, [source.identifier]);
  return (
    <>
      <TopBar title={book.title} subtitle="Edição digitalizada · Internet Archive">
        <a href={`https://archive.org/details/${source.identifier}`} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full" aria-label="Abrir no Internet Archive">
          <ExternalLink className="size-5" />
        </a>
      </TopBar>
      <iframe
        title={`Ler ${book.title}`}
        src={src}
        allowFullScreen
        className="fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+3.5rem)] h-[calc(100dvh-env(safe-area-inset-top)-3.5rem)] w-full border-0 bg-white"
      />
    </>
  );
}

/* ---------------- Sem edição gratuita ---------------- */
function Unavailable({ id, book }: { id: string; book?: BookDetail }) {
  return (
    <>
      <TopBar title={book?.title ?? "Livro"} />
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
        {book ? (
          <BookCover coverId={book.coverId} title={book.title} author={book.authors[0]} className="w-36" />
        ) : (
          <BookOpenText className="size-12 opacity-50" />
        )}
        <div>
          <h1 className="text-xl font-semibold">Sem edição digital gratuita</h1>
          <p className="reader-muted mt-2 text-sm">
            Este título ainda está protegido por direitos autorais ou não tem uma versão aberta. Você pode retirar o exemplar físico numa das bibliotecas da rede.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Link to="/livro/$id" params={{ id }} className={buttonClass("primary", "md", "w-full")}>Ver onde retirar</Link>
          <Link to="/acervo" search={{ ebook: true }} className={buttonClass("outline", "md", "w-full")}>Livros grátis para ler agora</Link>
        </div>
      </div>
    </>
  );
}
