import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Loader } from "lucide-react";
import { PageHero, Reveal } from "@/components/common";
import { Badge, Card, Container } from "@/components/ui";
import { ROADMAP, STATUS_TONE } from "@/data/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — Biblioteca Viva" },
      { name: "description", content: "Timeline pública: MVP, v1, v2, v3, IA, app mobile, marketplace e digitalização de acervos." },
    ],
  }),
  component: Roadmap,
});

function Roadmap() {
  return (
    <>
      <PageHero eyebrow="Roadmap público" title="Construindo em público" description="O que já lançamos, o que estamos construindo e o que vem por aí. Sugestões são bem-vindas no GitHub." />
      <Container className="max-w-3xl pb-16">
        <ol className="relative border-l-2 border-border pl-8">
          {ROADMAP.map((r, i) => {
            const Icon = r.status === "lançado" ? CheckCircle2 : r.status === "em construção" ? Loader : Circle;
            return (
              <li key={r.version} className="relative pb-8 last:pb-0">
                <span
                  className={cn(
                    "absolute top-5 -left-[45px] grid size-8 place-items-center rounded-full bg-background",
                    r.status === "lançado" ? "text-success" : r.status === "em construção" ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-6", r.status === "em construção" && "animate-spin [animation-duration:3s]")} />
                </span>
                <Reveal delay={i * 40}>
                  <Card className="p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-primary">{r.version} · {r.period}</span>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold">{r.title}</h2>
                    <ul className="mt-3 space-y-1.5">
                      {r.items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {it}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </Container>
    </>
  );
}
