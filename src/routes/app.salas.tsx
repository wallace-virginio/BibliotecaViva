import { createFileRoute, Link } from "@tanstack/react-router";
import { DashHeader } from "@/components/dashboard";
import { ReservationList } from "@/components/ReservationList";
import { buttonClass } from "@/components/ui";

export const Route = createFileRoute("/app/salas")({
  head: () => ({ meta: [{ title: "Minhas salas — Biblioteca Viva" }, { name: "description", content: "Salas e computadores reservados." }] }),
  component: () => (
    <>
      <DashHeader title="Salas e computadores" description="Suas reservas de espaços de estudo." action={<Link to="/salas" className={buttonClass("primary", "sm")}>Nova reserva</Link>} />
      <ReservationList kinds={["sala", "computador"]} />
    </>
  ),
});
