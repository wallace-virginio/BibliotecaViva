import { createFileRoute } from "@tanstack/react-router";
import { MapExplorer } from "@/components/map/MapExplorer";

type Search = { foco?: string };

export const Route = createFileRoute("/mapa")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    foco: typeof s.foco === "string" ? s.foco : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mapa — Biblioteca Viva" },
      { name: "description", content: "Mapa interativo de bibliotecas perto de você, com horários, salas, computadores e eventos de hoje." },
    ],
  }),
  component: MapaPage,
});

/** Tela principal do app: mapa em tela cheia, como um app de mapas nativo. */
function MapaPage() {
  const { foco } = Route.useSearch();
  return (
    <div className="h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] lg:h-[100dvh] lg:pt-20">
      <MapExplorer fullscreen initialFocus={foco} className="lg:border-t" />
    </div>
  );
}
