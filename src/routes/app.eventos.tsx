import { createFileRoute, Link } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { DashHeader } from "@/components/dashboard";
import { ReservationList } from "@/components/ReservationList";
import { buttonClass } from "@/components/ui";

export const Route = createFileRoute("/app/eventos")({
  head: () => ({ meta: [{ title: "Meus eventos — Biblioteca Viva" }, { name: "description", content: "Eventos em que você se inscreveu." }] }),
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)
  component: !FEATURES.eventos ? () => <EmDesenvolvimento feature="eventos" inShell /> : () => (
    <>
      <DashHeader title="Eventos" description="Suas inscrições em clubes, oficinas e cursos." action={<Link to="/eventos" className={buttonClass("primary", "sm")}>Explorar agenda</Link>} />
      <ReservationList kinds={["evento"]} />
    </>
  ),
});
