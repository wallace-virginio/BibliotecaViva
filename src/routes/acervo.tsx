import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookX, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard, BookGridSkeleton, PageHero } from "@/components/common";
import { Button, Container, EmptyState, Tabs } from "@/components/ui";
import { CATEGORIES, isAvailable, MATERIAL_TYPES } from "@/lib/catalog";
import { searchBooks } from "@/lib/api/openlibrary";
import { useAsync } from "@/lib/hooks";
import { cn, formatNumber } from "@/lib/utils";

type Search = { q?: string; categoria?: string; tipo?: string; disponivel?: boolean; ebook?: boolean; pagina?: number };

export const Route = createFileRoute("/acervo")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    categoria: typeof s.categoria === "string" && s.categoria ? s.categoria : undefined,
    tipo: typeof s.tipo === "string" && s.tipo ? s.tipo : undefined,
    disponivel: s.disponivel === true || s.disponivel === "true" ? true : undefined,
    ebook: s.ebook === true || s.ebook === "true" ? true : undefined,
    pagina: Number(s.pagina) > 1 ? Number(s.pagina) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acervo — Biblioteca Viva" },
      { name: "description", content: "Busque livros, revistas, jornais e documentos históricos em milhões de registros da rede aberta." },
    ],
  }),
  component: Acervo,
});

const PAGE = 24;

function Acervo() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/acervo" });
  const [input, setInput] = useState(search.q ?? "");
  useEffect(() => setInput(search.q ?? ""), [search.q]);

  const tipo = MATERIAL_TYPES.find((t) => t.value === (search.tipo ?? "livros")) ?? MATERIAL_TYPES[0];
  const subject = search.categoria || tipo.subject || undefined;
  const page = search.pagina ?? 1;

  const { data, loading, error } = useAsync(
    (signal) => searchBooks(search.q ?? "", { subject, page, limit: PAGE, ebook: search.ebook, signal }),
    [search.q, subject, page, search.ebook],
  );
  const books = (data?.books ?? []).filter((b) => !search.disponivel || isAvailable(b.id));
  const set = (patch: Partial<Search>) => navigate({ search: (s: Search) => ({ ...s, pagina: undefined, ...patch }) });

  return (
    <>
      <PageHero eyebrow="Acervo" title="Milhões de livros. Um único lugar." description="Metadados abertos da Open Library, com disponibilidade nas bibliotecas conectadas da rede.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: input || undefined });
          }}
          className="flex max-w-2xl items-center rounded-full border bg-surface shadow-card focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
        >
          <Search className="ml-5 size-5 text-muted-foreground" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Título, autor, assunto ou ISBN…" className="h-14 min-w-0 flex-1 bg-transparent px-4 outline-none" />
          <Button type="submit" className="mr-1.5">Buscar</Button>
        </form>
      </PageHero>

      <Container className="pb-24">
        <div className="flex flex-col gap-4 border-b pb-6">
          <Tabs
            value={tipo.value}
            onChange={(v) => set({ tipo: v === "livros" ? undefined : v, categoria: undefined })}
            options={MATERIAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="mr-1 size-4 text-muted-foreground" />
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => set({ categoria: c.value || undefined })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition",
                  (search.categoria ?? "") === c.value ? "border-primary bg-primary-soft text-primary-soft-foreground" : "hover:border-border-strong",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <Toggle checked={!!search.disponivel} onChange={(v) => set({ disponivel: v || undefined })} label="Disponível para retirada" />
            <Toggle checked={!!search.ebook} onChange={(v) => set({ ebook: v || undefined })} label="Leitura digital gratuita" />
            {data && <span className="ml-auto text-muted-foreground">{formatNumber(data.total)} resultados</span>}
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <BookGridSkeleton count={12} />
          ) : error ? (
            <EmptyState icon={<BookX className="size-6" />} title="Não foi possível consultar o acervo" description="A Open Library pode estar instável. Tente novamente em instantes." />
          ) : books.length === 0 ? (
            <EmptyState icon={<BookX className="size-6" />} title="Nada encontrado" description="Tente outros termos ou remova alguns filtros." />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {books.map((b) => (
                <div key={b.id} className="relative">
                  <BookCard book={b} />
                  <span className={cn("absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold", isAvailable(b.id) ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                    {isAvailable(b.id) ? "Disponível" : "Emprestado"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {data && data.total > PAGE && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => navigate({ search: (s: Search) => ({ ...s, pagina: page - 1 > 1 ? page - 1 : undefined }) })}>
              <ChevronLeft className="size-4" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page} de {formatNumber(Math.ceil(data.total / PAGE))}</span>
            <Button variant="outline" size="sm" disabled={page * PAGE >= data.total} onClick={() => navigate({ search: (s: Search) => ({ ...s, pagina: page + 1 }) })}>
              Próxima <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </Container>
    </>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-10 rounded-full transition", checked ? "bg-primary" : "bg-surface-3")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-soft transition", checked && "translate-x-4")} />
      </button>
      {label}
    </label>
  );
}
