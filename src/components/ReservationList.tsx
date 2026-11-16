import { BookOpen, CalendarDays, DoorOpen, Monitor, Ticket, X } from "lucide-react";
import type { ReactNode } from "react";
import { actions, useStore, type Reservation } from "@/lib/store";
import { Badge, Card, EmptyState } from "./ui";

const ICON = { livro: BookOpen, sala: DoorOpen, computador: Monitor, evento: CalendarDays } as const;

export function ReservationList({ kinds, empty }: { kinds?: Reservation["kind"][]; empty?: ReactNode }) {
  const all = useStore((s) => s.reservations);
  const list = kinds ? all.filter((r) => kinds.includes(r.kind)) : all;
  if (!list.length)
    return <>{empty ?? <EmptyState icon={<Ticket className="size-6" />} title="Nada por aqui ainda" description="Suas reservas e inscrições aparecem aqui." />}</>;
  return (
    <div className="space-y-3">
      {list.map((r) => {
        const Icon = ICON[r.kind];
        return (
          <Card key={r.id} className="flex items-center gap-4 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground"><Icon className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.title}</p>
              <p className="truncate text-sm text-muted-foreground">{[r.subtitle, r.when].filter(Boolean).join(" · ")}</p>
            </div>
            <Badge tone="success" className="hidden sm:inline-flex">Confirmada</Badge>
            <button onClick={() => actions.cancelReservation(r.id)} className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-danger" aria-label="Cancelar">
              <X className="size-4" />
            </button>
          </Card>
        );
      })}
    </div>
  );
}
