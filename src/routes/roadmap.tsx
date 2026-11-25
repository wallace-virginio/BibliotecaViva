import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, Loader } from "lucide-react";
import { PageHero } from "@/components/common";
import { DrawTimeline } from "@/components/motion";
import { Badge, Card, Container } from "@/components/ui";
import { ROADMAP, STATUS_TONE } from "@/data/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — Biblioteca Viva" },
      { name: "description", content: "O que já está no ar na Biblioteca Viva, o que estamos desenvolvendo e o que vem depois." },
    ],
  }),
  component: Roadmap,
});

function Roadmap() {
  return (
    <>
      <PageHero eyebrow="Roadmap público" title="Construindo em público" description="O que já está no ar, o que estamos desenvolvendo e o que vem por aí." />
      <Container className="max-w-3xl pb-16">
        <DrawTimeline
          items={ROADMAP.map((r) => {
            const Icon = r.status === "lançado" ? CheckCircle2 : r.status === "em desenvolvimento" ? Loader : Circle;
            return {
              key: r.version,
              marker: <Icon className={cn("size-4", r.status === "em desenvolvimento" && "animate-spin [animation-duration:3s]")} />,
              content: (
                <Card className="p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {r.version}
                      {r.period ? ` · ${r.period}` : ""}
                    </span>
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
              ),
            };
          })}
        />
      </Container>
    </>
  );
}
