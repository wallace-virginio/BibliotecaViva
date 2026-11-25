import { ExternalLink, Loader2, ShoppingBag } from "lucide-react";
import { getBrazilianEdition } from "@/lib/api/openlibrary";
import { storeLinks } from "@/lib/comprar";
import { useAsync } from "@/lib/hooks";
import { isNative, openExternal } from "@/lib/native";
import { cn } from "@/lib/utils";

/**
 * Painel "Onde comprar o livro físico" da página do livro. Os links aparecem na hora com o título da obra;
 * quando a Open Library devolve a edição brasileira (pode levar alguns segundos), a busca passa a usar o
 * título em português — "The 48 Laws of Power" vira "48 Leis do Poder".
 */
export function OndeComprar({ workId, title, author, className }: { workId: string; title: string; author?: string; className?: string }) {
  const edition = useAsync((s) => getBrazilianEdition(workId, s), [workId]);
  const ed = edition.data;
  const links = storeLinks({ title: ed?.title ?? title, author });
  const affiliate = links.some((l) => l.affiliate);

  return (
    <section aria-labelledby="onde-comprar" className={cn("rounded-xl border bg-surface p-4 md:p-5", className)}>
      <h2 id="onde-comprar" className="flex items-center gap-2 font-serif text-lg font-semibold">
        <ShoppingBag className="size-5 text-primary" /> Onde comprar o livro físico
      </h2>
      <p className="mt-1 min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {edition.loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" /> Procurando a edição brasileira…
          </span>
        ) : ed ? (
          <>
            Edição brasileira: <span className="font-medium text-foreground">{ed.title}</span>
            {ed.publisher ? ` · ${ed.publisher}` : ""}
            {ed.year ? ` · ${ed.year}` : ""}
            {ed.isbn ? <span className="whitespace-nowrap"> · ISBN {ed.isbn}</span> : null}
          </>
        ) : (
          "Buscamos pelo título e pelo autor em livrarias e sebos."
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
                <span className="block text-[13px] leading-snug text-muted-foreground">{l.note}</span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="sr-only">(abre a loja em outra janela)</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Preço e estoque você confere na loja. A Biblioteca Viva não vende livros.
        {affiliate
          ? " Alguns links têm código de parceiro: se você comprar por eles, podemos receber uma pequena comissão, sem custo extra para você."
          : ""}
      </p>
    </section>
  );
}
