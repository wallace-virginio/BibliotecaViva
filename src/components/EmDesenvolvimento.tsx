import { Link } from "@tanstack/react-router";
import { BookOpenText, LibraryBig, Map, Sparkles } from "lucide-react";
import type { FeatureKey } from "@/lib/features";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/* O que cada função vai fazer quando ficar pronta (textos em i18n/*.ts → dev.features) — dito com honestidade, sem prometer data. */

/** Versão pequena, para o meio de uma página (ex.: bloco de agenda na página da biblioteca). */
export function EmDesenvolvimentoNota({ feature, className }: { feature: FeatureKey; className?: string }) {
  const t = useT();
  const info = t.dev.features[feature];
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-dashed bg-surface p-3", className)}>
      <img src="/ori/ori-128.webp" alt="" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 text-left">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">{t.dev.badge}</p>
        <p className="text-sm text-muted-foreground">{t.dev.soon(info.title, info.items.slice(0, 2).join(" · ").toLowerCase())}</p>
      </div>
    </div>
  );
}

/**
 * Tela "Em desenvolvimento" com o Ori — no lugar de funções que ainda não têm dados reais.
 * `inShell`: dentro da área logada (/app), que já tem o próprio espaçamento.
 */
export function EmDesenvolvimento({ feature, inShell = false }: { feature: FeatureKey; inShell?: boolean }) {
  const t = useT();
  const info = t.dev.features[feature];
  return (
    <div className={cn("mx-auto flex max-w-lg flex-col items-center px-4 text-center", inShell ? "py-6" : "pt-28 pb-24 lg:pt-32")}>
      <img
        src="/ori/ori-256.webp"
        srcSet="/ori/ori-256.webp 1x, /ori/ori-512.webp 2x"
        alt={t.dev.oriAlt}
        width={144}
        height={144}
        className="ori-float size-36 rounded-full object-cover shadow-elevated"
      />
      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
        <Sparkles className="size-3.5" /> {t.dev.badge}
      </p>
      <h1 className="mt-3 text-3xl md:text-4xl">{info.title}</h1>
      <p className="mt-3 text-muted-foreground">{info.text}</p>
      <ul className="mt-4 w-full space-y-2 text-left">
        {info.items.map((it) => (
          <li key={it} className="flex items-center gap-2.5 rounded-xl border bg-surface px-4 py-3 text-sm">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" /> {it}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm font-medium">{t.dev.meanwhile}</p>
      <div className="mt-3 grid w-full grid-cols-2 gap-2">
        {[
          { to: "/mapa", label: t.dev.actions.map, icon: Map },
          { to: "/acervo", label: t.dev.actions.free, icon: BookOpenText, search: { ebook: true } },
          { to: "/assistente", label: t.dev.actions.ori, icon: Sparkles },
          { to: "/app/livros", label: t.dev.actions.shelf, icon: LibraryBig },
        ].map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            search={"search" in rest ? rest.search : undefined}
            className="flex min-h-12 items-center gap-2 rounded-xl border bg-surface px-3 py-2.5 text-left text-sm font-medium hover:border-primary active:bg-surface-2"
          >
            <Icon className="size-4 shrink-0 text-primary" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
