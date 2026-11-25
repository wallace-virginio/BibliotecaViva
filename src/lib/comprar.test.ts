import { describe, expect, it } from "vitest";
import { pickBrazilianEdition } from "./api/openlibrary";
import { buyText, mainTitle, slugQuery, storeLinks } from "./comprar";

describe("onde comprar: links das lojas", () => {
  it("busca pelo título principal + autor, sem subtítulo", () => {
    expect(mainTitle("Dom Casmurro: edição comentada")).toBe("Dom Casmurro");
    expect(mainTitle("1984")).toBe("1984");
    expect(buyText({ title: "Dom Casmurro", author: "Machado de Assis" })).toBe("Dom Casmurro Machado de Assis");
  });

  it("monta o formato de busca do Mercado Livre sem acentos", () => {
    expect(slugQuery("Memórias Póstumas de Brás Cubas Machado de Assis")).toBe("memorias-postumas-de-bras-cubas-machado-de-assis");
  });

  it("gera um link para cada loja, todos https e com o livro na busca", () => {
    const links = storeLinks({ title: "Dom Casmurro", author: "Machado de Assis" }, {});
    expect(links.map((l) => l.key)).toEqual(["estante-virtual", "amazon", "magalu", "travessa", "leitura", "mercado-livre"]);
    for (const l of links) {
      expect(l.url.startsWith("https://")).toBe(true);
      expect(decodeURIComponent(l.url).toLowerCase().replace(/[+-]/g, " ")).toContain("dom casmurro");
    }
  });

  it("sem código de afiliado, nenhum link é patrocinado; com o tag, só a Amazon leva", () => {
    expect(storeLinks({ title: "X" }, {}).some((l) => l.affiliate)).toBe(false);
    const withTag = storeLinks({ title: "X" }, { amazonTag: "bibliotecaviva-20" });
    const amazon = withTag.find((l) => l.key === "amazon")!;
    expect(amazon.affiliate).toBe(true);
    expect(new URL(amazon.url).searchParams.get("tag")).toBe("bibliotecaviva-20");
    expect(withTag.filter((l) => l.affiliate)).toHaveLength(1);
  });
});

describe("onde comprar: edição brasileira", () => {
  it("escolhe o ISBN do Brasil e ignora edições em português impressas fora", () => {
    const ed = pickBrazilianEdition([
      { title: "Dom Casmurro", isbn_13: ["9781490517063"], languages: [{ key: "/languages/por" }], publish_date: "2013" },
      { title: "Dom Casmurro", isbn_13: ["9798513409199"], publish_date: "2021" },
      { title: "Dom Casmurro", isbn_13: ["9788508145607"], publishers: ["Ática"], languages: [{ key: "/languages/por" }], publish_date: "2011" },
    ]);
    expect(ed).toEqual({ title: "Dom Casmurro", isbn: "9788508145607", publisher: "Ática", year: 2011 });
  });

  it("traz o título em português de um livro estrangeiro", () => {
    const ed = pickBrazilianEdition([
      { title: "The 48 Laws of Power", isbn_13: ["9780140280197"], publish_date: "2000" },
      { title: "48 Leis do Poder", isbn_13: ["9788532528643"], publishers: ["Rocco"], publish_date: "2012" },
    ]);
    expect(ed?.title).toBe("48 Leis do Poder");
  });

  it("aceita ISBN-10 brasileiro e devolve undefined quando não há edição do Brasil", () => {
    expect(pickBrazilianEdition([{ title: "Iracema", isbn_10: ["8508040113"] }])?.isbn).toBe("8508040113");
    expect(pickBrazilianEdition([{ title: "Hamlet", isbn_13: ["9780743477123"] }])).toBeUndefined();
    expect(pickBrazilianEdition([])).toBeUndefined();
  });
});
