import { afterEach, describe, expect, it, vi } from "vitest";
import { trending } from "./rankings";
import { sanitize } from "./reader";
import { cleanDescription, prefixQuery } from "./openlibrary";

describe("sugestões enquanto digita", () => {
  it("a última palavra vira prefixo, sem acento, sem caracteres de busca", () => {
    expect(prefixQuery("Macha")).toBe("macha*");
    expect(prefixQuery("dom  Casm")).toBe("dom casm*");
    expect(prefixQuery("José de Alenc", "author")).toBe("author:jose author:de author:alenc*");
    expect(prefixQuery('a"b:(c)')).toBe("a b c"); // última palavra com 1 letra não vira prefixo (busca larga demais)
    expect(prefixQuery("x")).toBe("x");
  });
});
import { sizedImage } from "./commons";

describe("resumo da Open Library", () => {
  it("tira negrito, itálico, links e a seção depois de ----", () => {
    const md = "**Dom Casmurro**, de *Machado de Assis*, ver [aqui](https://x.org).\n----\nVeja também: outra coisa";
    expect(cleanDescription(md)).toBe("Dom Casmurro, de Machado de Assis, ver aqui.");
  });
  it("não mexe em asteriscos soltos nem em texto comum", () => {
    expect(cleanDescription("Nota 5 * 3 = 15")).toBe("Nota 5 * 3 = 15");
    expect(cleanDescription(undefined)).toBeUndefined();
  });
});

describe("fotos da Wikipédia", () => {
  it("pede miniatura de 1280px (largura padrão do Wikimedia) em vez da original gigante", () => {
    const u = "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Foto.jpg/3840px-Foto.jpg?utm=1";
    expect(sizedImage(u)).toBe("https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Foto.jpg/1280px-Foto.jpg?utm=1");
    expect(sizedImage("https://upload.wikimedia.org/a/b.jpg")).toBe("https://upload.wikimedia.org/a/b.jpg");
  });
});

describe("leitor: limpeza do HTML do Wikisource", () => {
  it("remove scripts, estilos, links e atributos, mantendo o texto", () => {
    const html = `<div class="mw-parser-output">
      <script>alert(1)</script><style>p{color:red}</style>
      <p onclick="steal()">Era uma <a href="https://evil.example">vez</a> <em>Capitu</em>.</p>
      <img src=x onerror="alert(2)">
    </div>`;
    const out = sanitize(html);
    expect(out).toContain("<p>Era uma vez <em>Capitu</em>.</p>");
    expect(out).not.toMatch(/script|style|onclick|onerror|href|<a|<img/i);
  });

  it("descarta tabelas de navegação e cabeçalhos do Wikisource", () => {
    const out = sanitize(`<table><tr><td>menu</td></tr></table><div class="ws-noexport">não exportar</div><p>Texto</p>`);
    expect(out).toBe("<p>Texto</p>");
  });

  it("escapa texto que parece HTML", () => {
    expect(sanitize("<p>1 &lt; 2 &amp; &lt;b&gt;</p>")).toBe("<p>1 &lt; 2 &amp; &lt;b&gt;</p>");
  });
});

describe("ranking: plano B quando a Open Library falha", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("se o /trending falhar, usa a busca 'sendo lidos agora'", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/trending/")) throw new TypeError("network down");
      return new Response(
        JSON.stringify({
          docs: [
            { key: "/works/OL1W", title: "Com capa", author_name: ["A"], cover_i: 1 },
            { key: "/works/OL2W", title: "Sem capa" },
          ],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const books = await trending("monthly", 5);
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("sort=currently_reading"))).toBe(true);
    expect(books.map((b) => b.id)).toEqual(["OL1W"]); // sem capa fica de fora
  });
});
