import { createFileRoute } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { BookOpen, CalendarDays, DoorOpen, GraduationCap, Plus, TrendingUp, Users, UsersRound } from "lucide-react";
import { useState } from "react";
import { DashHeader } from "@/components/dashboard";
import { BarChart } from "@/components/motion";
import { Badge, Button, Card, Tabs } from "@/components/ui";
import { EVENTS } from "@/data/content";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { cn, compactNumber, formatNumber } from "@/lib/utils";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Painel da biblioteca — Biblioteca Viva" }, { name: "description", content: "Gerencie eventos, cursos, acervo, salas, reservas, equipe, indicadores e comunidade." }] }),
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)

  component: FEATURES.painelBiblioteca ? Admin : () => <EmDesenvolvimento feature="painelBiblioteca" inShell />,
});

const TABS = ["indicadores", "eventos", "cursos", "acervo", "salas", "reservas", "equipe", "comunidade"] as const;
type Tab = (typeof TABS)[number];

function Admin() {
  const lib = FEATURED_LIBRARIES[1];
  const [tab, setTab] = useState<Tab>("indicadores");
  const visits = [62, 71, 58, 80, 94, 88, 102, 97, 110, 121, 116, 134];

  return (
    <>
      <DashHeader title={lib.name} description="Painel administrativo da biblioteca" action={<Button size="sm"><Plus className="size-4" /> Novo evento</Button>} />
      <Tabs className="mb-6" value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))} />

      {tab === "indicadores" && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { icon: Users, label: "Visitas no mês", value: compactNumber(lib.visitorsMonth), delta: "+12%" },
              { icon: BookOpen, label: "Empréstimos", value: "3.482", delta: "+4%" },
              { icon: DoorOpen, label: "Ocupação de salas", value: "78%", delta: "+9%" },
              { icon: CalendarDays, label: "Inscrições em eventos", value: "641", delta: "+21%" },
            ].map((k) => (
              <Card key={k.label} className="p-5">
                <div className="flex items-center justify-between">
                  <k.icon className="size-5 text-primary" />
                  <span className="flex items-center gap-1 text-xs font-medium text-success"><TrendingUp className="size-3" /> {k.delta}</span>
                </div>
                <p className="mt-3 text-2xl font-semibold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </Card>
            ))}
          </div>
          <Card className="mt-6 p-5">
            <p className="font-semibold">Visitas por mês (mil)</p>
            <BarChart className="mt-6" values={visits} labels={["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]} unit=" mil" />
          </Card>
        </>
      )}

      {(tab === "eventos" || tab === "cursos") && (
        <Card className="divide-y">
          {EVENTS.filter((e) => (tab === "cursos" ? ["Curso", "Oficina"].includes(e.category) : true)).map((e) => (
            <div key={e.id} className="flex items-center gap-4 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground">{tab === "cursos" ? <GraduationCap className="size-5" /> : <CalendarDays className="size-5" />}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">{e.date.toLocaleDateString("pt-BR")} · {e.time} · {e.spots - e.spotsLeft}/{e.spots} inscritos</p>
              </div>
              <Badge tone={e.spotsLeft === 0 ? "danger" : "success"}>{e.spotsLeft === 0 ? "Lotado" : "Aberto"}</Badge>
            </div>
          ))}
        </Card>
      )}

      {tab === "acervo" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[["Itens no acervo", formatNumber(lib.books)], ["Emprestados agora", "12.430"], ["Novas aquisições (mês)", "318"]].map(([k, v]) => (
            <Card key={k} className="p-5"><p className="text-2xl font-semibold">{v}</p><p className="text-sm text-muted-foreground">{k}</p></Card>
          ))}
          <Card className="p-5 sm:col-span-3">
            <p className="font-semibold">Sincronização via Provider</p>
            <p className="mt-1 text-sm text-muted-foreground">provider-pergamum · última sincronização há 14 minutos · 0 erros</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-3"><div className="h-full w-full bg-success" /></div>
          </Card>
        </div>
      )}

      {(tab === "salas" || tab === "reservas") && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: lib.rooms.total }).map((_, i) => {
            const busy = i >= lib.rooms.available;
            return (
              <Card key={i} className="p-4">
                <DoorOpen className={cn("size-5", busy ? "text-muted-foreground" : "text-success")} />
                <p className="mt-3 font-medium">Sala {String.fromCharCode(65 + i)}</p>
                <p className="text-xs text-muted-foreground">{busy ? (tab === "reservas" ? "Reservada por Ana R." : "Ocupada") : "Livre"}</p>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "equipe" && (
        <Card className="divide-y">
          {[["Helena Martins", "Diretora", "Admin"], ["João Pereira", "Bibliotecário-chefe", "Editor"], ["Carla Dias", "Mediação de leitura", "Editor"], ["André Costa", "Makerspace", "Colaborador"]].map(([n, r, p]) => (
            <div key={n} className="flex items-center gap-3 p-4">
              <UsersRound className="size-5 text-primary" />
              <div className="flex-1"><p className="text-sm font-medium">{n}</p><p className="text-xs text-muted-foreground">{r}</p></div>
              <Badge>{p}</Badge>
            </div>
          ))}
        </Card>
      )}

      {tab === "comunidade" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[["Seguidores", formatNumber(lib.reviews * 7)], ["Avaliação média", lib.rating.toFixed(1)], ["Voluntários ativos", "42"]].map(([k, v]) => (
            <Card key={k} className="p-5"><p className="text-2xl font-semibold">{v}</p><p className="text-sm text-muted-foreground">{k}</p></Card>
          ))}
        </div>
      )}
    </>
  );
}
