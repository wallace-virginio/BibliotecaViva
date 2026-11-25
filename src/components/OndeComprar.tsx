import { ExternalLink, Globe2, Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { getBrazilianEdition } from "@/lib/api/openlibrary";
import { intlStoreLinks, storeLinks } from "@/lib/comprar";
import { useAsync } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { isNative, openExternal } from "@/lib/native";
import { cn } from "@/lib/utils";

/**
 * Painel "Onde comprar o livro físico" da página do livro.
 *
 * - No Brasil (tela em português): livrarias e sebos brasileiros. Os links aparecem na hora com o título da obra;
 *   quando a Open Library devolve a edição brasileira (pode levar alguns segundos), a busca passa a usar o
 *   título em português — "The 48 Laws of Power" vira "48 Leis do Poder".
 * - Fora do Brasil (tela em inglês ou espanhol): lojas que entregam em vários países, pelo título original.
 * Um botão troca entre os dois — há brasileiros lendo em inglês e estrangeiros morando aqui.
 */
export function OndeComprar({ workId, title, author, className }: { workId: string; title: string; author?: string; className?: string }) {
  const { t, locale } = useI18n();
  const [brazil, setBrazil] = useState(locale === "pt");
  const edition = useAsync((s) => (brazil ? getBrazilianEdition(workId, s) : Promise.resolve(undefined)), [workId, brazil]);
  const ed = brazil ? edition.data : undefined;
  const links = brazil ? storeLinks({ title: ed?.title ?? title, author }) : intlStoreLinks({ title, author }, locale === "es" ? "es" : "en");
  const affiliate = links.some((l) => l.affiliate);

  return (
    <section aria-labelledby="onde-comprar" className={cn("rounded-xl border bg-surface p-4 md:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="onde-comprar" className="flex items-center gap-2 font-serif text-lg font-semibold">
          <ShoppingBag className="size-5 text-primary" /> {t.buy.title}
        </h2>
        <button
          type="button"
          onClick={() => setBrazil((b) => !b)}
          className="flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground"
        >
          <Globe2 className="size-3.5" aria-hidden /> {brazil ? t.buy.showIntl : t.buy.showBr}
        </button>
      </div>
      <p className="mt-1 min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {!brazil ? (
          t.buy.fallbackIntl
        ) : edition.loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" /> {t.buy.lookingBr}
          </span>
        ) : ed ? (
          <>
            {t.buy.brEdition} <span className="font-medium text-foreground">{ed.title}</span>
            {ed.publisher ? ` · ${ed.publisher}` : ""}
            {ed.year ? ` · ${ed.year}` : ""}
            {ed.isbn ? <span className="whitespace-nowrap"> · ISBN {ed.isbn}</span> : null}
          </>
        ) : (
          t.buy.fallback
        )}
      </p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.key}>
            <a
              href={l.url}
              target="_blank"
              rel={l.affiliate ? "noopener noreferrer sponsored" : "noopener noreferrer"}
              onClick={(e) => {
                // no app, abre no navegador interno em vez de sair do aplicativo
                if (isNative()) {
                  e.preventDefault();
                  void openExternal(l.url);
                }
              }}
              className="flex min-h-14 items-center gap-3 rounded-lg border bg-background px-3 py-2 hover:border-primary/40 active:bg-surface-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{l.name}</span>
                <span className="block text-[13px] leading-snug text-muted-foreground">{t.buy.stores[l.key as keyof typeof t.buy.stores] ?? l.note}</span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="sr-only">{t.common.opensInNewWindow}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t.buy.note}
        {affiliate ? t.buy.affiliate : ""}
      </p>
    </section>
  );
}
