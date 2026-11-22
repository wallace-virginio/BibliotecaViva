import { Accessibility, Check, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type A11yPrefs = { text: 0 | 1 | 2; contrast: boolean; links: boolean; motion: boolean; spacing: boolean };
const DEFAULTS: A11yPrefs = { text: 0, contrast: false, links: false, motion: false, spacing: false };
const KEY = "bv-a11y";

/** Aplicado no <head> antes da hidratação, para não "piscar" (mesma ideia do tema escuro). */
export const a11yScript = `(function(){try{var p=JSON.parse(localStorage.getItem('${KEY}')||'{}');var c=document.documentElement.classList;if(p.text===1)c.add('a11y-text-lg');if(p.text===2)c.add('a11y-text-xl');if(p.contrast)c.add('a11y-contrast');if(p.links)c.add('a11y-links');if(p.motion)c.add('a11y-motion');if(p.spacing)c.add('a11y-spacing');}catch(e){}})();`;

function apply(p: A11yPrefs) {
  const c = document.documentElement.classList;
  c.toggle("a11y-text-lg", p.text === 1);
  c.toggle("a11y-text-xl", p.text === 2);
  c.toggle("a11y-contrast", p.contrast);
  c.toggle("a11y-links", p.links);
  c.toggle("a11y-motion", p.motion);
  c.toggle("a11y-spacing", p.spacing);
}

export function AccessibilityMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULTS);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setPrefs({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => !panel.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const latest = useRef(prefs);
  latest.current = prefs;
  const update = (patch: Partial<A11yPrefs>) => {
    // parte sempre do estado mais recente (cliques seguidos não se sobrescrevem)
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setPrefs(next);
    apply(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const toggles: { key: Exclude<keyof A11yPrefs, "text">; label: string; desc: string }[] = [
    { key: "contrast", label: "Alto contraste", desc: "Cores mais fortes e bordas visíveis" },
    { key: "links", label: "Sublinhar links", desc: "Facilita encontrar o que é clicável" },
    { key: "spacing", label: "Espaçamento ampliado", desc: "Mais espaço entre letras e linhas (ajuda na dislexia)" },
    { key: "motion", label: "Reduzir animações", desc: "Desliga movimentos e transições" },
  ];

  return (
    <div className={cn("relative", className)}>
      <button
        ref={trigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="menu-acessibilidade"
        aria-label="Acessibilidade"
        className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
      >
        <Accessibility className="size-[19px]" />
      </button>
      {open && (
        <div
          ref={panel}
          id="menu-acessibilidade"
          role="dialog"
          aria-label="Opções de acessibilidade"
          className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4rem)] z-[1100] animate-fade-in rounded-3xl border bg-surface p-5 shadow-elevated sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-80"
        >
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg font-semibold">Acessibilidade</p>
            <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Fechar">
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tamanho do texto</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tamanho do texto">
            {(["A", "A+", "A++"] as const).map((l, i) => (
              <button
                key={l}
                role="radio"
                aria-checked={prefs.text === i}
                onClick={() => update({ text: i as 0 | 1 | 2 })}
                className={cn("h-11 rounded-xl border font-semibold", prefs.text === i ? "border-primary bg-primary-soft text-primary-soft-foreground" : "bg-surface")}
                style={{ fontSize: 14 + i * 3 }}
              >
                {l}
              </button>
            ))}
          </div>

          <ul className="mt-4 space-y-1">
            {toggles.map((t) => (
              <li key={t.key}>
                <button
                  role="switch"
                  aria-checked={prefs[t.key]}
                  onClick={() => update({ [t.key]: !prefs[t.key] } as Partial<A11yPrefs>)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-surface-2"
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-md border-2", prefs[t.key] ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
                    {prefs[t.key] && <Check className="size-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.desc}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
            <span>Idioma: Português (em breve: English e Español)</span>
            <button onClick={() => update(DEFAULTS)} className="flex items-center gap-1 font-medium text-primary">
              <RotateCcw className="size-3.5" /> Restaurar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
