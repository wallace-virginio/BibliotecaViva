import { afterEach, describe, expect, it, vi } from "vitest";
import { trending } from "./rankings";
import { sanitize } from "./reader";

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
