import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, MessageCircleQuestion } from "lucide-react";
import { BookCard, BookCover, BookGridSkeleton, EventCard } from "@/components/common";
import { ProgressRing } from "@/components/motion";
import { BadgeGrid, DashHeader, FreeClassics, SavedBookRow } from "@/components/dashboard";
import { Card } from "@/components/ui";
import { EVENTS, USER } from "@/data/content";
import { useUserStats } from "@/lib/userStats";
import { booksBySubject } from "@/lib/api/openlibrary";
import { useAsync, useMounted } from "@/lib/hooks";
import { actions, useStore } from "@/lib/store";
import { greeting } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Início — Biblioteca Viva" }, { name: "description", content: "Seu painel de leitura." }] }),
  component: Home,
});

function Home() {
  const me = useUserStats();
  const mounted = useMounted();
  const history = useStore((s) => s.history);
  const reading = useStore((s) => Object.values(s.reading).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4));
  const continueList = reading.length
    ? reading.map((r) => ({ id: r.id, title: r.title, author: r.author ?? "", coverId: r.coverId, progress: r.percent }))
    : me.demo
      ? USER.readingNow
      : [];
  const joined = useStore((s) => s.reservations.filter((r) => r.kind === "evento").map((r) => r.id));
  const recs = useAsync((s) => booksBySubject("science_fiction", 12, s), []);

  return (
    <>
      <DashHeader
        title={<>{mounted ? greeting() : "Olá"}, {me.name}.</>}
        description="Que bom te ver por aqui. Separamos algumas coisas para hoje."
        action={
          <Link to="/assistente" className="inline-flex h-10 items-center gap-2 self-start rounded-lg border bg-surface px-4 text-sm font-medium hover:border-primary">
            <MessageCircleQuestion className="size-4 text-primary" /> Não sabe o que ler?
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Sequência de leitura", value: `${me.stats.streak} dias`, icon: <Flame className="size-5 text-warning" /> },
          { label: "Livros lidos", value: String(me.stats.read) },
          { label: "Horas de estudo", value: `${me.stats.hours} h` },
        ].map((s) => (
          <Card key={s.label} className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </div>
            {s.icon}
          </Card>
        ))}
      </div>

      <Section title="Continue lendo…">
        {continueList.length === 0 && <FreeClassics />}
        <div className="grid gap-4 md:grid-cols-2">
          {continueList.map((b) => (
            <Link key={b.id} to="/ler/$id" params={{ id: b.id }}>
              <Card className="card-hover flex items-center gap-4 p-4">
                <BookCover coverId={b.coverId} title={b.title} author={b.author} className="w-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.title}</p>
                  <p className="text-sm text-muted-foreground">{b.author}</p>
                </div>
                <ProgressRing value={b.progress} size={56} />
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Recomendados para você" link={{ to: "/acervo", label: "Ver acervo" }}>
        {recs.loading ? (
          <BookGridSkeleton count={6} />
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-6">
            {(recs.data ?? []).slice(0, 6).map((b) => <BookCard key={b.id} book={b} className="w-28 shrink-0 sm:w-auto" />)}
          </div>
        )}
      </Section>

      <Section title="Eventos próximos" link={{ to: "/eventos", label: "Agenda" }}>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
          {EVENTS.slice(0, 3).map((e) => {
            const id = `evento-${e.id}`;
            return (
              <div key={e.id} className="w-72 shrink-0 sm:w-auto">
                <EventCard
                  event={e}
                  joined={joined.includes(id)}
                  onJoin={() => actions.reserve({ id, kind: "evento", title: e.title, when: `${e.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })} · ${e.time}` })}
                />
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Últimos livros vistos">
        <SavedBookRow books={history.slice(0, 6)} empty={<p className="text-sm text-muted-foreground">Os livros que você abrir aparecem aqui.</p>} />
      </Section>

      <Section title="Conquistas" link={{ to: "/app/perfil", label: "Ver perfil" }}>
        <BadgeGrid compact badges={me.badges} />
      </Section>
    </>
  );
}

function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {link && (
          <Link to={link.to} className="flex items-center gap-1 text-sm font-medium text-primary">
            {link.label} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
