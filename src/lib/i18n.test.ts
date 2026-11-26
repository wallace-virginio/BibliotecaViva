import { describe, expect, it } from "vitest";
import en from "@/i18n/en";
import es from "@/i18n/es";
import pt from "@/i18n/pt";
import { intlStoreLinks } from "./comprar";
import { localeFromTag, pickLocale, setActiveLocale } from "./locale";
import { replyLang, systemPrompt } from "./server/assistant";
import { formatDistance } from "./utils";

/** Todas as chaves (caminho completo) e o tipo de cada valor, para comparar os três idiomas. */
function shape(obj: unknown, path = ""): string[] {
  if (Array.isArray(obj)) return [`${path}:array(${obj.length})`];
  if (typeof obj === "function") return [`${path}:fn(${obj.length})`];
  if (obj && typeof obj === "object") return Object.entries(obj).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k));
  return [`${path}:${typeof obj}`];
}

describe("idiomas: escolha", () => {
  it("segue a ordem de preferência do navegador", () => {
    expect(pickLocale("en-US,en;q=0.9,pt-BR;q=0.8")).toBe("en");
    expect(pickLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
    expect(pickLocale("es-AR,es;q=0.9")).toBe("es");
    expect(pickLocale("fr-FR,fr;q=0.9,es;q=0.5")).toBe("es");
    expect(pickLocale("en;q=0.3, es;q=0.8")).toBe("es");
  });

  it("quem não fala nenhum dos três recebe inglês; sem informação, português", () => {
    expect(pickLocale("fr-FR,de;q=0.8")).toBe("en");
    expect(pickLocale("")).toBe("pt");
    expect(pickLocale(undefined)).toBe("pt");
    expect(localeFromTag("pt-BR")).toBe("pt");
    expect(localeFromTag("es-419")).toBe("es");
    expect(localeFromTag("ja")).toBe("en");
  });

  it("formata distâncias no idioma da tela", () => {
    setActiveLocale("en");
    expect(formatDistance(2.5)).toBe("2.5 km");
    setActiveLocale("pt");
    expect(formatDistance(2.5)).toBe("2,5 km");
  });
});

describe("idiomas: textos", () => {
  it("inglês e espanhol têm exatamente os mesmos textos que o português", () => {
    expect(shape(en)).toEqual(shape(pt));
    expect(shape(es)).toEqual(shape(pt));
  });

  it("nenhum texto ficou vazio (exceto o aviso jurídico, que não aparece em português)", () => {
    for (const [name, dict] of Object.entries({ pt, en, es })) {
      const empty = shape(dict)
        .filter((k) => k.endsWith(":string"))
        .map((k) => k.split(":")[0])
        .filter((path) => !path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], dict));
      expect(empty, name).toEqual(name === "pt" ? ["auth.legalInPt"] : []);
    }
  });
});

describe("idiomas: Ori e lojas", () => {
  it("o Ori responde no idioma da tela", () => {
    expect(replyLang("en")).toBe("en");
    expect(replyLang("klingon")).toBe("pt");
    expect(systemPrompt(undefined, "es")).toContain("espanhol");
    expect(systemPrompt()).toContain("português do Brasil");
  });

  it("fora do Brasil, lojas internacionais; em espanhol a Casa del Libro vem primeiro", () => {
    const enLinks = intlStoreLinks({ title: "Dom Casmurro", author: "Machado de Assis" }, "en");
    expect(enLinks[0].key).toBe("amazon-com");
    expect(enLinks.every((l) => l.url.startsWith("https://") && !l.url.includes(".com.br"))).toBe(true);
    expect(intlStoreLinks({ title: "X" }, "es")[0].key).toBe("casa-del-libro");
    for (const l of enLinks) expect(pt.buy.stores).toHaveProperty(l.key);
  });
});

describe("idiomas: edição do livro", () => {
  it("junta as traduções do Wikisource em pt/en/es e ignora traduções incompletas", async () => {
    const { pickEditions } = await import("./api/reader");
    const eds = pickEditions({ lang: "en", page: "Pride and Prejudice" }, [
      { lang: "pt", "*": "Em Tradução:Orgulho e Preconceito" },
      { lang: "fr", "*": "Orgueil et Préjugés" },
      { lang: "es", "*": "Orgullo y prejuicio" },
    ]);
    expect(eds).toEqual([
      { lang: "en", page: "Pride and Prejudice" },
      { lang: "es", page: "Orgullo y prejuicio" },
    ]);
    expect(pickEditions({ lang: "en", page: "Alice's Adventures in Wonderland" }, [{ lang: "pt", "*": "Alice no País das Maravilhas" }])[0]).toEqual({
      lang: "pt",
      page: "Alice no País das Maravilhas",
    });
  });
});
