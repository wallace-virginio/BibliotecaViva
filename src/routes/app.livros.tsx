import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, BookOpenText, Plus, Ticket } from "lucide-react";
import { BookCover } from "@/components/common";
import { DashHeader, FreeClassics, SavedBookRow } from "@/components/dashboard";
import { buttonClass, Card, EmptyState, Tabs } from "@/components/ui";
import { useStore } from "@/lib/store";

type Aba = "lendo" | "reservados" | "historico" | "listas";

export const Route = createFileRoute("/app/livros")({
  validateSearch: (s: Record<string, unknown>): { aba?: Aba } => ({
    aba: s.aba === "reservados" || s.aba === "historico" || s.aba === "listas" ? s.aba : undefined,
  }),
  head: () => ({ meta: [{ title: "Minha biblioteca — Biblioteca Viva" }, { name: "description", content: "Livros que você está lendo, reservados, histórico e listas." }] }),
  component: MeusLivros,
});

function MeusLivros() {
  const { aba = "lendo" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const reading = useStore((s) => Object.values(s.reading).sort((a, b) => b.updatedAt - a.updatedAt));
  const reserved = useStore((s) => s.reservations.filter((r) => r.kind === "livro"));
  const history = useStore((s) => s.history);
  const favorites = useStore((s) => s.favorites);

  return (
    <>
      <DashHeader title="Minha biblioteca" description={`${reading.length} em leitura · ${reserved.length} reservados`} />
      <Tabs
        value={aba}
        onChange={(v) => navigate({ search: { aba: v === "lendo" ? undefined : v }, replace: true })}
        options={[
          { value: "lendo", label: "Lendo" },
          { value: "reservados", label: `Reservados${reserved.length ? ` · ${reserved.length}` : ""}` },
          { value: "historico", label: "Histórico" },
          { value: "listas", label: "Listas" },
        ]}
      />
      <div className="mt-6">
        {aba === "lendo" &&
          (reading.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {reading.map((b) => (
                <Link key={b.id} to="/ler/$id" params={{ id: b.id }}>
                  <Card className="card-hover flex items-center gap-4 p-4">
                    <BookCover coverId={b.coverId} title={b.title} author={b.author} className="w-16 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{b.title}</p>
                      <p className="truncate text-sm text-muted-foreground">{b.author}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.max(2, b.percent)}%` }} /></div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{b.percent}% · continuar leitura</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <FreeClassics />
          ))}

        {aba === "reservados" &&
          (reserved.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {reserved.map((r) => {
                const bookId = r.bookId ?? r.id.replace(/^livro-/, "");
                return (
                  <Card key={r.id} className="flex items-center gap-4 p-4">
                    <Link to="/ler/$id" params={{ id: bookId }} className="shrink-0">
                      <BookCover coverId={r.coverId} title={r.title} author={r.author} className="w-16 rounded-lg" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to="/ler/$id" params={{ id: bookId }} className="block truncate font-semibold hover:text-primary">{r.title}</Link>
                      <p className="truncate text-sm text-muted-foreground">{r.subtitle} · {r.when}</p>
                      <div className="mt-3 flex gap-2">
                        <Link to="/ler/$id" params={{ id: bookId }} className={buttonClass("primary", "sm")}><BookOpenText className="size-4" /> Ler</Link>
                        <Link to="/livro/$id" params={{ id: bookId }} className={buttonClass("outline", "sm")}>Detalhes</Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Ticket className="size-6" />} title="Nenhum livro reservado" description="Reserve pela página do livro. Os que tiverem edição gratuita você já pode ler aqui." action={<Link to="/acervo" className={buttonClass("primary", "sm")}>Explorar acervo</Link>} />
          ))}

        {aba === "historico" && (
          <SavedBookRow books={history} empty={<EmptyState icon={<BookOpen className="size-6" />} title="Nenhum livro visto ainda" action={<Link to="/acervo" className={buttonClass("primary", "sm")}>Explorar acervo</Link>} />} />
        )}

        {aba === "listas" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-5">
              <p className="font-semibold">❤️ Favoritos</p>
              <p className="text-sm text-muted-foreground">{favorites.length} livros</p>
              <Link to="/app/favoritos" className="mt-4 inline-block text-sm font-medium text-primary">Abrir lista →</Link>
            </Card>
            <Card className="p-5">
              <p className="font-semibold">📌 Quero ler</p>
              <p className="text-sm text-muted-foreground">0 livros · privada</p>
            </Card>
            <button className="flex min-h-28 items-center justify-center gap-2 rounded-3xl border border-dashed text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary">
              <Plus className="size-4" /> Nova lista
            </button>
          </div>
        )}
      </div>
    </>
  );
}
