import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookmarkCheck, BookmarkPlus, BookOpenText, ExternalLink, Heart, Loader2, MapPin, Navigation, Share2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard, BookCover, BookGridSkeleton } from "@/components/common";
import { Badge, Button, buttonClass, Card, Container, EmptyState } from "@/components/ui";
import { findReadableSource } from "@/lib/api/reader";
import { booksBySubject, getBook } from "@/lib/api/openlibrary";
import { holdingsFor } from "@/lib/catalog";
import { ShelfMenuButton } from "@/components/ShelfButton";
import { confetti } from "@/lib/motion";
import { useAskLocationOnce, useLocation, useNearbyLibraries } from "@/lib/location";
import { formatDistance } from "@/lib/utils";
import { useAsync } from "@/lib/hooks";
import { actions, useStore } from "@/lib/store";
import { cn, slugify } from "@/lib/utils";

export const Route = createFileRoute("/livro/$id")({
  head: () => ({
    meta: [
      { title: "Livro — Biblioteca Viva" },
      { name: "description", content: "Resumo, disponibilidade e localização física do livro nas bibliotecas da rede." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { id } = Route.useParams();
  const { data: book, loading, error } = useAsync((s) => getBook(id, s), [id]);
  const fav = useStore((s) => s.favorites.some((b) => b.id === id));
  const reserved = useStore((s) => s.reservations.some((r) => r.id === `livro-${id}`));
  const [toast, setToast] = useState<string>();
  useAskLocationOnce();
  const nearby = useNearbyLibraries();
  const { ask } = useLocation();
  const holdings = holdingsFor(id, nearby.data);
  const subject = book?.subjects.find((s) => s.length < 30);
  const readable = useAsync((s) => (book ? findReadableSource(book, s) : Promise.resolve(null)), [book?.id]);
  const progress = useStore((s) => s.reading[book?.id ?? id]);
  const related = useAsync((s) => (subject ? booksBySubject(slugify(subject).replace(/-/g, "_"), 12, s) : Promise.resolve([])), [subject]);

  useEffect(() => {
    if (book) {
      document.title = `${book.title} — Biblioteca Viva`;
      actions.pushHistory({ id, title: book.title, author: book.authors[0], coverId: book.coverId });
    }
  }, [book, id]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading)
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  if (error || !book)
    return (
      <Container className="pt-32 pb-24">
        <EmptyState icon={<BookmarkPlus className="size-6" />} title="Livro não encontrado" description="Não encontramos este título na Open Library." />
      </Container>
    );

  const best = holdings.find((h) => h.available > 0);
  const saved = { id, title: book.title, author: book.authors[0], coverId: book.coverId };

  return (
    <div className="relative pt-24 pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-hero" />
      <Container className="relative">
        <Link to="/acervo" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Acervo
        </Link>
        <div className="grid gap-10 md:grid-cols-[300px_1fr] lg:gap-16">
          <div className="mx-auto w-56 animate-fade-up md:w-full">
            <BookCover coverId={book.coverId} title={book.title} author={book.authors[0]} size="L" className="rounded-2xl shadow-elevated" />
          </div>
          <div className="animate-fade-up [animation-delay:100ms]">
            <div className="flex flex-wrap gap-2">
              {book.subjects.slice(0, 3).map((s) => <Badge key={s} tone="primary">{s}</Badge>)}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">{book.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {book.authors.join(", ") || "Autor desconhecido"}
              {book.year ? ` · ${book.year}` : ""}
            </p>
            {book.rating?.average && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <div className="flex text-star">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={cn("size-4", i <= Math.round(book.rating!.average!) && "fill-current")} />)}
                </div>
                <span className="font-medium">{book.rating.average.toFixed(1)}</span>
                <span className="text-muted-foreground">({book.rating.count} avaliações na Open Library)</span>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-2">
              {readable.data && (
                <Link to="/ler/$id" params={{ id: book.id }} className={buttonClass("primary", "md")}>
                  <BookOpenText className="size-4" /> {progress ? `Continuar lendo · ${progress.percent}%` : "Ler agora · grátis"}
                </Link>
              )}
              {readable.loading && <span className="inline-flex h-11 items-center gap-2 px-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Procurando edição digital…</span>}
              <Button
                disabled={!best && !reserved}
                variant={reserved ? "soft" : readable.data ? "outline" : "primary"}
                onClick={() => {
                  if (reserved) {
                    actions.cancelReservation(`livro-${id}`);
                    setToast("Reserva cancelada.");
                    return;
                  }
                  actions.reserve({ id: `livro-${id}`, kind: "livro", title: book.title, subtitle: best?.library.name, when: "Retirar em até 3 dias", bookId: book.id, author: book.authors[0], coverId: book.coverId });
                  setToast(`Reservado em ${best?.library.name}. Veja em Minhas reservas.`);
                  confetti();
                }}
              >
                {reserved ? <BookmarkCheck className="size-4" /> : <BookmarkPlus className="size-4" />}
                {reserved ? "Reservado" : best ? "Reservar" : "Indisponível"}
              </Button>
              <ShelfMenuButton book={{ id: book.id, title: book.title, author: book.authors[0], coverId: book.coverId }} />
              <Button variant="outline" onClick={() => actions.toggleFavorite(saved)}>
                <Heart className={cn("size-4", fav && "fill-danger text-danger")} /> {fav ? "Favoritado" : "Favoritar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.share) navigator.share({ title: book.title, url: location.href }).catch(() => {});
                  else {
                    navigator.clipboard?.writeText(location.href);
                    setToast("Link copiado!");
                  }
                }}
              >
                <Share2 className="size-4" /> Compartilhar
              </Button>
              <a href={`https://openlibrary.org/works/${id}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-1.5 px-3 text-sm text-muted-foreground hover:text-primary">
                Open Library <ExternalLink className="size-3.5" />
              </a>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
              <div>
                <h2 className="text-lg font-semibold">Resumo</h2>
                <p className="mt-3 leading-relaxed whitespace-pre-line text-muted-foreground">
                  {book.description || book.firstSentence || "Este título ainda não tem resumo. Que tal contribuir com um na Open Library?"}
                </p>
                {book.subjects.length > 3 && (
                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {book.subjects.slice(3).map((s) => <Badge key={s}>{s}</Badge>)}
                  </div>
                )}
              </div>

              <Card className="h-fit p-5">
                <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><MapPin className="size-4 text-primary" /> Onde retirar</h2>
                {nearby.location ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mais perto de <strong className="text-foreground">{nearby.location.label}</strong> ·{" "}
                    <button onClick={ask} className="text-primary underline-offset-2 hover:underline">trocar</button>
                  </p>
                ) : (
                  <button onClick={ask} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary-soft-foreground">
                    <Navigation className="size-4" /> Ver a biblioteca mais perto de mim
                  </button>
                )}
                {nearby.loading && nearby.location && <div className="skeleton mt-4 h-24 rounded-2xl" />}
                <ul className="mt-4 space-y-3">
                  {holdings.map((h, i) => (
                    <li key={h.library.slug} className={cn("rounded-2xl border p-3.5", i === 0 && h.km !== undefined && "border-primary/40 bg-primary-soft/40")}>
                      <div className="flex items-start justify-between gap-2">
                        <Link to="/biblioteca/$slug" params={{ slug: h.library.slug }} className="text-sm font-medium hover:text-primary">{h.library.name}</Link>
                        <Badge tone={h.available ? "success" : "warning"}>{h.available ? `${h.available}/${h.copies} livres` : "Emprestado"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {h.km !== undefined ? <strong className="text-foreground">{formatDistance(h.km)}</strong> : h.library.city}
                        {i === 0 && h.km !== undefined && <span className="ml-1.5 font-medium text-primary">· Mais perto</span>}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-md bg-surface-2 px-2 py-1 font-medium">{h.floor}</span>
                        <span className="rounded-md bg-surface-2 px-2 py-1 font-medium">{h.shelf}</span>
                        <span className="rounded-md bg-surface-2 px-2 py-1 font-mono">{h.callNumber}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Navigation className="size-3" /> Localização física via Providers das bibliotecas.</p>
              </Card>
            </div>
          </div>
        </div>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Livros relacionados</h2>
          <div className="mt-6">
            {related.loading ? (
              <BookGridSkeleton count={6} />
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                {(related.data ?? []).filter((b) => b.id !== id).slice(0, 12).map((b) => <BookCard key={b.id} book={b} />)}
              </div>
            )}
            {!related.loading && !related.data?.length && <p className="text-sm text-muted-foreground">Sem recomendações para este título ainda.</p>}
          </div>
        </section>
      </Container>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[1100] -translate-x-1/2 animate-fade-up rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-elevated">
          {toast}
        </div>
      )}
    </div>
  );
}
