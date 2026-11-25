import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const KEY = "bv-ori-min";

/**
 * Ori, o mascote, como botão flutuante do assistente "Peça uma indicação".
 * Aparece com o balão "Olá, eu sou o Ori!…"; depois de alguns segundos, ao rolar a tela ou ao tocar no ✕,
 * o balão recolhe e fica só o Ori (para não tapar o conteúdo). Recolhido, continua recolhido na visita.
 * Fica acima da barra de abas no celular e some com o teclado aberto.
 */
export function OriFab() {
  const [min, setMin] = useState(true); // começa recolhido no servidor; decide no navegador
  const [ready, setReady] = useState(false);
  const t = useT();

  useEffect(() => {
    let stored = false;
    try {
      stored = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* sem armazenamento: mostra o balão */
    }
    setMin(stored);
    setReady(true);
    if (stored) return;
    const collapse = () => {
      setMin(true);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
    };
    const t = setTimeout(collapse, 8000);
    const onScroll = () => window.scrollY > 160 && collapse();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const dismiss = () => {
    setMin(true);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={cn(
        "ori-fab fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[900] flex items-end gap-2 lg:right-6 lg:bottom-6",
        ready ? "animate-fade-up" : "opacity-0",
      )}
    >
      {!min && (
        <div className="relative mb-2 max-w-[14.5rem] rounded-2xl rounded-br-md border bg-surface px-4 py-3 shadow-elevated">
          <Link to="/assistente" className="block pr-4 text-sm leading-snug">
            <strong className="font-serif text-[15px]">{t.ori.fabHello}</strong>
            <span className="mt-0.5 block text-muted-foreground">{t.ori.fabSub}</span>
          </Link>
          <button onClick={dismiss} className="absolute top-1 right-1 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-2" aria-label={t.ori.fabCollapse}>
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <Link
        to="/assistente"
        aria-label={t.ori.fabLabel}
        className="ori-float group block size-16 shrink-0 overflow-hidden rounded-full border-2 border-surface bg-[#6B3D20] shadow-elevated ring-1 ring-black/5 transition active:scale-95"
      >
        <img src="/ori/ori-128.webp" srcSet="/ori/ori-128.webp 1x, /ori/ori-256.webp 2x" alt="" width={64} height={64} className="size-full scale-[1.18] object-cover" />
      </Link>
    </div>
  );
}
