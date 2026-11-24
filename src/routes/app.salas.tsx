import { createFileRoute, Link } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { DashHeader } from "@/components/dashboard";
import { ReservationList } from "@/components/ReservationList";
import { buttonClass } from "@/components/ui";

export const Route = createFileRoute("/app/salas")({
  head: () => ({ meta: [{ title: "Minhas salas — Biblioteca Viva" }, { name: "description", content: "Salas e computadores reservados." }] }),
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)
  component: !FEATURES.salas ? () => <EmDesenvolvimento feature="salas" inShell /> : () => (
    <>
      <DashHeader title="Salas e computadores" description="Suas reservas de espaços de estudo." action={<Link to="/salas" className={buttonClass("primary", "sm")}>Nova reserva</Link>} />
      <ReservationList kinds={["sala", "computador"]} />
    </>
  ),
});
