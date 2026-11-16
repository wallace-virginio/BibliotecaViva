import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CurationGrid } from "@/components/CurationGrid";
import { LibraryCard, PageHero } from "@/components/common";
import { Container } from "@/components/ui";
import { CURATIONS, FEATURED_LIBRARIES } from "@/data/libraries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/descobrir")({
  head: () => ({
    meta: [
      { title: "Descobrir — Biblioteca Viva" },
      { name: "description", content: "Curadorias de bibliotecas históricas, espaços para estudar, laboratórios maker, bibliotecas infantis, universitárias e digitais." },
    ],
  }),
  component: Descobrir,
});

function Descobrir() {
  return (
    <>
      <PageHero eyebrow="Descobrir" title="Curadorias para explorar o mundo dos livros" description="Coleções organizadas pela comunidade. Cada lugar leva ao seu perfil completo." />
      <Container className="pb-8">
        <CurationGrid />
      </Container>
      <div className="space-y-14 pt-8 pb-16 md:space-y-20">
        {CURATIONS.map((c) => {
          const libs = FEATURED_LIBRARIES.filter((l) => l.curations.includes(c.key));
          return (
            <section key={c.key} id={c.key} className="scroll-mt-24">
              <Container>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl text-2xl shadow-soft", c.cover)}>{c.emoji}</span>
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{c.title}</h2>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    </div>
                  </div>
                  <Link to="/acervo" className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary sm:flex">
                    Ver acervo <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Container>
              {/* Carrossel horizontal no celular, grade no desktop */}
              <div className="mx-auto max-w-7xl lg:px-8">
                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:px-6 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
                  {libs.map((l) => (
                    <div key={l.slug} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
                      <LibraryCard lib={l} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
