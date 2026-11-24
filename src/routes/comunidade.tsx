import { createFileRoute, Link } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { BookHeart, CalendarDays, MessagesSquare, Plus, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { BookCard, BookGridSkeleton, PageHero } from "@/components/common";
import { Badge, Button, Card, Container } from "@/components/ui";
import { EVENTS, RANKING, STUDY_GROUPS } from "@/data/content";
import { booksBySubject } from "@/lib/api/openlibrary";
import { useAsync } from "@/lib/hooks";
import { cn, formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Biblioteca Viva" },
      { name: "description", content: "Clubes de leitura, grupos de estudo, listas de livros e eventos culturais criados pela comunidade." },
    ],
  }),
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)
  component: FEATURES.comunidade ? Comunidade : () => <EmDesenvolvimento feature="comunidade" />,
});

const LISTS = [
  { title: "Clássicos brasileiros para começar", author: "Marina A.", subject: "brazilian_literature", followers: 1204 },
  { title: "IA sem medo", author: "Kenji W.", subject: "artificial_intelligence", followers: 873 },
  { title: "Ficção científica essencial", author: "Clube Sci-Fi", subject: "science_fiction", followers: 2410 },
];

function Comunidade() {
  const [joined, setJoined] = useState<string[]>([]);
  const [list, setList] = useState(0);
  const books = useAsync((s) => booksBySubject(LISTS[list].subject, 6, s), [list]);
  const clubs = EVENTS.filter((e) => e.category === "Clube de leitura" || e.category === "Cultura");

  return (
    <>
      <PageHero eyebrow="Comunidade" title="Ler é melhor junto" description="Clubes de leitura, grupos de estudo e listas criadas por pessoas como você." />
      <Container className="space-y-14 pb-16">
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold md:text-2xl"><Users className="size-6 text-primary" /> Grupos de estudo</h2>
            <Button size="sm" variant="outline"><Plus className="size-4" /> Criar grupo</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STUDY_GROUPS.map((g, i) => (
              <Card key={g.name} className="flex flex-col p-5">
                <span className={cn("grid size-11 place-items-center rounded-2xl text-on-image", `bg-cover-${(i % 8) + 1}`)}><MessagesSquare className="size-5" /></span>
                <p className="mt-4 font-semibold">{g.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{g.library}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatNumber(g.members)} membros</span>
                  <span>Próximo: {g.next}</span>
                </div>
                <Button
                  size="sm"
                  variant={joined.includes(g.name) ? "soft" : "primary"}
                  className="mt-5"
                  onClick={() => setJoined((j) => (j.includes(g.name) ? j.filter((x) => x !== g.name) : [...j, g.name]))}
                >
                  {joined.includes(g.name) ? "Participando ✓" : "Participar"}
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold md:text-2xl"><BookHeart className="size-6 text-primary" /> Listas da comunidade</h2>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
            {LISTS.map((l, i) => (
              <button key={l.title} onClick={() => setList(i)} className={cn("shrink-0 rounded-2xl border px-4 py-3 text-left transition", list === i ? "border-primary bg-primary-soft" : "bg-surface")}>
                <p className="text-sm font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">por {l.author} · {formatNumber(l.followers)} seguidores</p>
              </button>
            ))}
          </div>
          <div className="mt-6">
            {books.loading ? <BookGridSkeleton count={6} /> : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {(books.data ?? []).map((b) => <BookCard key={b.id} book={b} />)}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold md:text-2xl"><CalendarDays className="size-6 text-primary" /> Clubes e eventos culturais</h2>
            <div className="space-y-3">
              {clubs.map((e) => (
                <Link key={e.id} to="/eventos" className="flex items-center gap-4 rounded-2xl border bg-surface p-4 transition hover:border-primary">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-center leading-none text-primary-soft-foreground">
                    <div>
                      <div className="text-[10px] font-semibold uppercase">{e.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
                      <div className="mt-0.5 text-lg font-bold">{e.date.getDate()}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{e.time} · {e.online ? "Online" : "Presencial"}</p>
                  </div>
                  <Badge tone="primary" className="hidden sm:inline-flex">{e.category}</Badge>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold md:text-2xl"><Trophy className="size-6 text-primary" /> Ranking de leitores</h2>
            <Card className="divide-y">
              {RANKING.map((r, i) => (
                <div key={r.name} className={cn("flex items-center gap-3 p-4", r.me && "bg-primary-soft/50")}>
                  <span className={cn("grid size-8 place-items-center rounded-full text-sm font-semibold", i < 3 ? "bg-gradient-primary text-primary-foreground" : "bg-surface-2")}>{i + 1}</span>
                  <span className="flex-1 text-sm font-medium">{r.name}{r.me && " (você)"}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">{formatNumber(r.points)} pts</span>
                </div>
              ))}
            </Card>
          </section>
        </div>
      </Container>
    </>
  );
}
