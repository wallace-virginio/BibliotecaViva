import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { newlyEarned, type BadgeView } from "@/lib/badges";
import { confetti } from "@/lib/motion";
import { haptic } from "@/lib/native";
import { actions, useStore } from "@/lib/store";

/**
 * Observa a atividade da pessoa e, quando uma conquista é alcançada, grava a data (store → aparelho + conta)
 * e mostra um aviso com o selo, confete e vibração.
 * Silencioso na primeira leitura e quando várias chegam de uma vez (ex.: ao entrar na conta e a nuvem trazer
 * conquistas antigas) — o aviso é só para o que a pessoa acabou de fazer.
 */
export function BadgeToaster() {
  const state = useStore((s) => s);
  const first = useRef(true);
  const [shown, setShown] = useState<BadgeView>();

  useEffect(() => {
    const fresh = newlyEarned(state);
    if (!fresh.length) {
      first.current = false;
      return;
    }
    actions.markBadges(fresh.map((b) => b.key));
    if (!first.current && fresh.length <= 2) {
      setShown(fresh[0]);
      haptic("success");
      confetti();
    }
    first.current = false;
  }, [state]);

  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(undefined), 4500);
    return () => clearTimeout(t);
  }, [shown]);

  if (!shown) return null;
  return (
    <div role="status" className="fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-[1200] mx-auto flex max-w-sm animate-fade-up items-center gap-3 rounded-2xl border bg-surface p-3 shadow-elevated">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-2xl">{shown.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">Conquista desbloqueada</p>
        <p className="truncate font-serif text-base font-semibold">{shown.title}</p>
      </div>
      <Link to="/app/perfil" onClick={() => setShown(undefined)} className="h-9 shrink-0 rounded-full px-3 text-sm leading-9 font-medium text-primary hover:bg-surface-2">
        Ver
      </Link>
    </div>
  );
}
