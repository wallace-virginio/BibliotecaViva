import { describe, expect, it } from "vitest";
import { isAllowedOverpassQuery, resolveOpenLibrary } from "./proxy";

describe("proxy da Open Library: só caminhos que o app usa", () => {
  it("aceita busca, trending, assuntos, obras e autores", () => {
    expect(resolveOpenLibrary("search.json", "?q=dom")?.url).toBe("https://openlibrary.org/search.json?q=dom");
    expect(resolveOpenLibrary("trending/weekly.json", "?limit=10")).not.toBeNull();
    expect(resolveOpenLibrary("subjects/science_fiction.json", "?limit=12")).not.toBeNull();
    expect(resolveOpenLibrary("works/OL1003040W.json", "")).not.toBeNull();
    expect(resolveOpenLibrary("works/OL1003040W/ratings.json", "")).not.toBeNull();
    expect(resolveOpenLibrary("authors/OL7422948A.json", "")).not.toBeNull();
  });

  it("recusa qualquer outra coisa (não é um proxy aberto)", () => {
    for (const p of ["account/login", "../etc/passwd", "works/OL1W/edit", "search.json/../account", "https://evil.example", "trending/forever.json"]) {
      expect(resolveOpenLibrary(p, "")).toBeNull();
    }
    expect(resolveOpenLibrary("search.json", `?q=${"a".repeat(700)}`)).toBeNull();
  });

  it("tempo de cache: trending curto, obras longo", () => {
    expect(resolveOpenLibrary("trending/daily.json", "")!.ttl).toBeLessThan(resolveOpenLibrary("works/OL1W.json", "")!.ttl);
  });
});

describe("proxy do Overpass: só as duas consultas do app", () => {
  it("aceita bibliotecas num raio e elemento por id", () => {
    expect(isAllowedOverpassQuery('[out:json][timeout:25];nwr["amenity"="library"]["name"](around:7000,-23.55,-46.63);out center tags 80;')).toBe(true);
    expect(isAllowedOverpassQuery("[out:json][timeout:25];way(48661210);out center tags;")).toBe(true);
  });

  it("recusa consultas arbitrárias (evita abuso do servidor)", () => {
    expect(isAllowedOverpassQuery('[out:json];node["amenity"](area);out;')).toBe(false);
    expect(isAllowedOverpassQuery('[out:json][timeout:25];nwr["amenity"="pub"]["name"](around:7000,-23.55,-46.63);out center tags 80;')).toBe(false);
    expect(isAllowedOverpassQuery(null)).toBe(false);
  });
});
