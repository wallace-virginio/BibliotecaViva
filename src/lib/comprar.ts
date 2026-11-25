/**
 * "Onde comprar o livro físico": links de busca nas lojas brasileiras.
 *
 * Nível 1 — sem API nem cadastro: cada link abre a busca da loja já com o livro. Preço e estoque a pessoa
 * vê na própria loja. A Biblioteca Viva não vende livros.
 *
 * Afiliados (nível 2): com a variável de build VITE_AFILIADO_AMAZON (o "tag" do Amazon Associados),
 * os links da Amazon passam a levar o código e a tela avisa que pode haver comissão.
 */

export type StoreLink = {
  key: string;
  name: string;
  /** o que a pessoa encontra lá, em poucas palavras */
  note: string;
  url: string;
  /** o link leva código de afiliado (precisa de aviso na tela e rel="sponsored") */
  affiliate?: boolean;
};

export type BuyQuery = {
  /** título a buscar: o da edição brasileira, se houver; senão o da obra */
  title: string;
  author?: string;
};

const AMAZON_TAG = (import.meta.env.VITE_AFILIADO_AMAZON as string | undefined)?.trim() || undefined;

/** Título sem subtítulo ("Dom Casmurro: edição comentada" → "Dom Casmurro"), que as lojas casam melhor. */
export function mainTitle(title: string) {
  const t = title.split(/\s[:–—-]\s|:\s/)[0]?.trim();
  return t && t.length >= 2 ? t : title.trim();
}

/** Título principal + primeiro autor: o que as buscas das lojas casam melhor. */
export function buyText({ title, author }: BuyQuery) {
  return [mainTitle(title), author?.trim()].filter(Boolean).join(" ");
}

/** "Dom Casmurro Machado de Assis" → "dom-casmurro-machado-de-assis" (formato de busca do Mercado Livre). */
export function slugQuery(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function storeLinks(q: BuyQuery, opts: { amazonTag?: string } = { amazonTag: AMAZON_TAG }): StoreLink[] {
  const text = buyText(q);
  const enc = encodeURIComponent(text);
  const amazon = new URL("https://www.amazon.com.br/s");
  amazon.searchParams.set("k", text);
  amazon.searchParams.set("i", "stripbooks");
  if (opts.amazonTag) amazon.searchParams.set("tag", opts.amazonTag);

  return [
    { key: "estante-virtual", name: "Estante Virtual", note: "Sebos do Brasil inteiro · usados, mais baratos", url: `https://www.estantevirtual.com.br/busca?q=${enc}` },
    { key: "amazon", name: "Amazon", note: "Novos e usados · entrega rápida", url: amazon.toString(), affiliate: !!opts.amazonTag },
    { key: "magalu", name: "Magalu", note: "Novos", url: `https://www.magazineluiza.com.br/busca/${enc}/` },
    { key: "travessa", name: "Livraria da Travessa", note: "Livraria · novos", url: `https://www.travessa.com.br/Busca.aspx?d=1&bt=${enc}&cta=00` },
    { key: "leitura", name: "Livraria Leitura", note: "Livraria · novos", url: `https://leitura.com.br/busca?q=${enc}` },
    // por último: o Mercado Livre às vezes pede login a quem nunca entrou no site
    { key: "mercado-livre", name: "Mercado Livre", note: "Novos e usados de vários vendedores", url: `https://lista.mercadolivre.com.br/${slugQuery(text)}` },
  ];
}

/**
 * Lojas para quem está fora do Brasil (tela em inglês ou espanhol): buscam pelo título original da obra.
 * Em espanhol, a Casa del Libro vem primeiro. A tela traduz o `note` pela chave (i18n → buy.stores).
 */
export function intlStoreLinks(q: BuyQuery, lang: "en" | "es" = "en"): StoreLink[] {
  const text = buyText(q);
  const enc = encodeURIComponent(text);
  const amazon = new URL("https://www.amazon.com/s");
  amazon.searchParams.set("k", text);
  amazon.searchParams.set("i", "stripbooks");
  const links: StoreLink[] = [
    { key: "amazon-com", name: "Amazon", note: "Novos e usados · entrega em vários países", url: amazon.toString() },
    { key: "abebooks", name: "AbeBooks", note: "Livrarias independentes e sebos · usados e raros", url: `https://www.abebooks.com/servlet/SearchResults?kn=${enc}` },
    { key: "bookshop", name: "Bookshop.org", note: "Apoia livrarias independentes (EUA e Reino Unido)", url: `https://bookshop.org/search?keywords=${enc}` },
    { key: "better-world-books", name: "Better World Books", note: "Usados · frete grátis para muitos países", url: `https://www.betterworldbooks.com/search/results?q=${enc}` },
  ];
  const casa: StoreLink = { key: "casa-del-libro", name: "Casa del Libro", note: "Maior rede de livrarias da Espanha", url: `https://www.casadellibro.com/?query=${enc}` };
  return lang === "es" ? [casa, ...links] : [...links, casa];
}
