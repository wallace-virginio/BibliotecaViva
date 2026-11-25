import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, BookOpen, BookOpenText, Plus, Ticket } from "lucide-react";
import { useState } from "react";
import { useFlip } from "@/lib/motion";
import { ProgressRing } from "@/components/motion";
import { BookCard, BookCover } from "@/components/common";
import { DashHeader, FreeClassics, SavedBookRow } from "@/components/dashboard";
import { buttonClass, Card, EmptyState, Tabs } from "@/components/ui";
import { useStore, type ShelfStatus } from "@/lib/store";
import { usePageTitle, useT } from "@/lib/i18n";

type Aba = "estante" | "lendo" | "reservados" | "historico" | "listas";

export const Route = createFileRoute("/app/livros")({
  validateSearch: (s: Record<string, unknown>): { aba?: Aba } => ({
    aba: s.aba === "estante" || s.aba === "reservados" || s.aba === "historico" || s.aba === "listas" ? s.aba : undefined,
  }),
  head: () => ({ meta: [{ title: "Minha biblioteca — Biblioteca Viva" }, { name: "description", content: "Livros que você está lendo, reservados, histórico e listas." }] }),
  component: MeusLivros,
});

function MeusLivros() {
  const { aba = "estante" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const reading = useStore((s) => Object.values(s.reading).sort((a, b) => b.updatedAt - a.updatedAt));
  const reserved = useStore((s) => s.reservations.filter((r) => r.kind === "livro"));
  const history = useStore((s) => s.history);
  const shelf = useStore((s) => Object.values(s.shelf).sort((a, b) => b.addedAt - a.addedAt));
  const [shelfFilter, setShelfFilter] = useState<ShelfStatus | "todos">("todos");
  const flip = useFlip<HTMLDivElement>([shelfFilter, shelf.length]);
  const favorites = useStore((s) => s.favorites);
  const t = useT();
  const e = t.estante;
  usePageTitle(e.metaTitle);

  return (
    <>
      <DashHeader title={e.title} description={e.summary(reading.length, reserved.length)} />
      <Tabs
        value={aba}
        onChange={(v) => navigate({ search: { aba: v === "estante" ? undefined : v }, replace: true })}
        options={[
          { value: "estante", label: e.tabShelf(shelf.length) },
          { value: "lendo", label: e.tabReading },
          { value: "reservados", label: e.tabReserved(reserved.length) },
          { value: "historico", label: e.tabHistory },
          { value: "listas", label: e.tabLists },
        ]}
      />
      <div className="mt-6">
        {aba === "estante" &&
          (shelf.length ? (
            <>
              <div className="mb-5 flex flex-wrap gap-2">
                {(["todos", "quero-ler", "lendo", "lido"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setShelfFilter(f)}
                    aria-pressed={shelfFilter === f}
                    className={`h-9 rounded-full border px-3.5 text-sm ${shelfFilter === f ? "border-primary bg-primary text-primary-foreground" : "bg-surface"}`}
                  >
                    {f === "todos" ? e.all : t.shelf.labels[f]} ({f === "todos" ? shelf.length : shelf.filter((x) => x.status === f).length})
                  </button>
                ))}
              </div>
              <div ref={flip} className="grid grid-cols-3 gap-x-3.5 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
                {shelf
                  .filter((x) => shelfFilter === "todos" || x.status === shelfFilter)
                  .map((x) => (
                    <div key={x.id} data-flip={x.id}>
                    <BookCard
                                            book={{ id: x.id, title: x.title, authors: x.author ? [x.author] : [], coverId: x.coverId, subjects: [] }}
                      badge={<span className="rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-semibold shadow-soft">{t.shelf.labels[x.status]}</span>}
                    />
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Bookmark className="size-6" />}
              title={e.emptyTitle}
              description={e.emptyText}
              action={<Link to="/ranking" className={buttonClass("primary", "sm")}>{e.seeRanking}</Link>}
            />
          ))}

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
                      <p className="mt-1.5 text-xs text-muted-foreground">{e.continue}</p>
                    </div>
                    <ProgressRing value={b.percent} size={52} />
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
                        <Link to="/ler/$id" params={{ id: bookId }} className={buttonClass("primary", "sm")}><BookOpenText className="size-4" /> {e.read}</Link>
                        <Link to="/livro/$id" params={{ id: bookId }} className={buttonClass("outline", "sm")}>{e.details}</Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Ticket className="size-6" />} title={e.noReservedTitle} description={e.noReservedText} action={<Link to="/acervo" className={buttonClass("primary", "sm")}>{e.explore}</Link>} />
          ))}

        {aba === "historico" && (
          <SavedBookRow books={history} empty={<EmptyState icon={<BookOpen className="size-6" />} title={e.noHistory} action={<Link to="/acervo" className={buttonClass("primary", "sm")}>{e.explore}</Link>} />} />
        )}

        {aba === "listas" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-5">
              <p className="font-semibold">{e.favorites}</p>
              <p className="text-sm text-muted-foreground">{e.books(favorites.length)}</p>
              <Link to="/app/favoritos" className="mt-4 inline-block text-sm font-medium text-primary">{e.openList}</Link>
            </Card>
            <Card className="p-5">
              <p className="font-semibold">{e.wantToRead}</p>
              <p className="text-sm text-muted-foreground">{e.privateList(0)}</p>
            </Card>
            <button className="flex min-h-28 items-center justify-center gap-2 rounded-3xl border border-dashed text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary">
              <Plus className="size-4" /> {e.newList}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
