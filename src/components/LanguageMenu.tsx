import { Check, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LOCALES, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Os três idiomas como botões lado a lado — para painéis e menus (acessibilidade, menu do celular, Perfil),
 * onde não cabe mais um botão no cabeçalho.
 */
export function LanguageChoices({ className }: { className?: string }) {
  const { locale, t, setLocale } = useI18n();
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)} role="radiogroup" aria-label={t.lang.choose}>
      {LOCALES.map((l) => (
        <button
          key={l.value}
          type="button"
          role="radio"
          aria-checked={l.value === locale}
          lang={l.tag}
          onClick={() => setLocale(l.value)}
          className={cn(
            "h-11 rounded-xl border text-sm font-medium",
            l.value === locale ? "border-primary bg-primary-soft text-primary-soft-foreground" : "bg-surface",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Seletor de idioma no topo (telas a partir de tablet; no celular ele fica no painel de acessibilidade e no menu). Mostra a sigla do idioma atual ("PT") — quem não lê português
 * reconhece o ícone e a sigla. Cada opção aparece no próprio idioma ("English", "Español").
 */
export function LanguageMenu({ className }: { className?: string }) {
  const { locale, t, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.value === locale)!;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.lang.current(current.label)}
        className="flex h-11 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-2 hover:text-foreground lg:h-10"
      >
        <Languages className="size-[18px]" aria-hidden />
        <span>{current.short}</span>
      </button>
      {open && (
        <div role="menu" aria-label={t.lang.choose} className="absolute top-12 right-0 z-[1100] w-56 animate-fade-in rounded-2xl border bg-surface p-1.5 shadow-elevated">
          {LOCALES.map((l) => (
            <button
              key={l.value}
              role="menuitemradio"
              aria-checked={l.value === locale}
              lang={l.tag}
              onClick={() => {
                setLocale(l.value);
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm hover:bg-surface-2"
            >
              <span className="w-6 text-xs font-semibold text-muted-foreground">{l.short}</span>
              <span className="flex-1">{l.label}</span>
              {l.value === locale && <Check className="size-4 text-primary" />}
            </button>
          ))}
          {locale !== "pt" && <p className="border-t px-3 pt-2 pb-1.5 text-[11px] leading-snug text-muted-foreground">{t.lang.legalNote}</p>}
        </div>
      )}
    </div>
  );
}
