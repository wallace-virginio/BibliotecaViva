import { createFileRoute } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { useState } from "react";
import { DashHeader } from "@/components/dashboard";
import { ReservationList } from "@/components/ReservationList";
import { Tabs } from "@/components/ui";
import type { Reservation } from "@/lib/store";

export const Route = createFileRoute("/app/reservas")({
  head: () => ({ meta: [{ title: "Reservas — Biblioteca Viva" }, { name: "description", content: "Livros, salas, computadores e eventos reservados." }] }),
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)
  component: FEATURES.reservas ? Reservas : () => <EmDesenvolvimento feature="reservas" inShell />,
});

function Reservas() {
  const [tab, setTab] = useState<"todas" | Reservation["kind"]>("todas");
  return (
    <>
      <DashHeader title="Reservas" description="Tudo o que você reservou, em um só lugar." />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        options={[
          { value: "todas", label: "Todas" },
          { value: "livro", label: "Livros" },
          { value: "sala", label: "Salas" },
          { value: "computador", label: "Computadores" },
          { value: "evento", label: "Eventos" },
        ]}
      />
      <ReservationList kinds={tab === "todas" ? undefined : [tab]} />
    </>
  );
}
