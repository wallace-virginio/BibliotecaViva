import { describe, expect, it } from "vitest";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { CATEGORIES, hasLatinTitle, holdingsFor, isAvailable, type NearbyLibrary } from "./catalog";
import { formatRanges, openStatus, parseOpeningHours } from "./hours";
import { actions, emptyState, getState } from "./store";
import { formatDistance, haversineKm, seeded, slugify } from "./utils";

describe("utils", () => {
  it("calcula distância entre São Paulo e Rio (~360 km)", () => {
    const km = haversineKm({ lat: -23.5505, lon: -46.6333 }, { lat: -22.9068, lon: -43.1729 });
    expect(km).toBeGreaterThan(350);
    expect(km).toBeLessThan(370);
  });

  it("formata distância em metros, km com vírgula e km inteiros", () => {
    expect(formatDistance(0.42)).toBe("420 m");
    expect(formatDistance(2.5)).toBe("2,5 km");
    expect(formatDistance(1234)).toMatch(/^1\.234 km$/);
  });

  it("gera slug sem acentos", () => {
    expect(slugify("Biblioteca Mário de Andrade")).toBe("biblioteca-mario-de-andrade");
  });

  it("gerador aleatório é determinístico pela semente", () => {
    const a = seeded("dom-casmurro");
    const b = seeded("dom-casmurro");
    expect([a.next(), a.next(), a.int(1, 10)]).toEqual([b.next(), b.next(), b.int(1, 10)]);
  });
});

describe("horário de funcionamento (opening_hours do OSM)", () => {
  it("interpreta dias, intervalos e dia fechado", () => {
    const w = parseOpeningHours("Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off")!;
    expect(w[1].ranges).toEqual([["09:00", "18:00"]]); // segunda
    expect(w[6].ranges).toEqual([["10:00", "14:00"]]); // sábado
    expect(w[0].ranges).toEqual([]); // domingo
    expect(formatRanges(w[0].ranges)).toBe("Fechada");
  });

  it("aceita 24/7 e intervalos que dão a volta na semana", () => {
    expect(parseOpeningHours("24/7")![3].ranges).toEqual([["00:00", "24:00"]]);
    const w = parseOpeningHours("Fr-Mo 08:00-12:00")!;
    expect([5, 6, 0, 1].every((d) => w[d].ranges.length === 1)).toBe(true);
    expect(w[3].ranges).toEqual([]);
  });

  it("devolve undefined para formatos que não entende (não inventa horário)", () => {
    expect(parseOpeningHours("Mo-Fr sunrise-sunset")).toBeUndefined();
    expect(parseOpeningHours(undefined)).toBeUndefined();
  });

  it("diz se está aberta agora e quando fecha/abre", () => {
    const w = parseOpeningHours("Mo-Fr 09:00-18:00")!;
    const mondayNoon = new Date(2026, 10, 16, 12, 0); // 16/11/2026 é segunda
    const mondayEarly = new Date(2026, 10, 16, 7, 30);
    expect(openStatus(w, mondayNoon)).toEqual({ known: true, open: true, until: "18:00" });
    expect(openStatus(w, mondayEarly)).toEqual({ known: true, open: false, opensAt: "09:00" });
    expect(openStatus(undefined)).toEqual({ known: false });
  });
});

describe("exemplares e disponibilidade", () => {
  const near: NearbyLibrary[] = FEATURED_LIBRARIES.filter((l) => l.kind !== "Digital")
    .slice(0, 10)
    .map((lib, i) => ({ lib, km: (i + 1) * 1.5 }));

  it("é determinístico para o mesmo livro", () => {
    expect(holdingsFor("OL1003040W")).toEqual(holdingsFor("OL1003040W"));
  });

  it("com localização, usa só bibliotecas próximas e ordena pela distância", () => {
    const h = holdingsFor("OL1003040W", near);
    expect(h.length).toBeGreaterThan(0);
    const slugs = new Set(near.map((n) => n.lib.slug));
    expect(h.every((x) => slugs.has(x.library.slug))).toBe(true);
    const kms = h.map((x) => x.km!);
    expect(kms).toEqual([...kms].sort((a, b) => a - b));
  });

  it("nunca coloca biblioteca digital como lugar de retirada", () => {
    for (const id of ["OL1", "OL2", "OL3", "OL4", "OL5"]) {
      expect(holdingsFor(id).some((h) => h.library.kind === "Digital")).toBe(false);
    }
  });

  it("'disponível perto' respeita o raio máximo", () => {
    const far = near.map((n) => ({ ...n, km: n.km + 100 }));
    expect(isAvailable("OL1003040W", far, 15)).toBe(false);
  });
});

describe("store local", () => {
  it("adiciona e tira livro da estante", () => {
    const book = { id: "OL1", title: "Teste" };
    actions.setShelf(book, "quero-ler");
    expect(getState().shelf.OL1.status).toBe("quero-ler");
    actions.setShelf(book, "lido");
    expect(getState().shelf.OL1.status).toBe("lido");
    actions.setShelf(book, null);
    expect(getState().shelf.OL1).toBeUndefined();
  });

  it("configurações ficam salvas: gravadas no armazenamento e de volta ao reabrir", () => {
    actions.setNotification("clubes", false);
    actions.setPreciseLocation(true);
    actions.toggleLike("ana|avaliou|Dom Casmurro");
    actions.toggleConnector("Pergamum");
    const saved = JSON.parse(localStorage.getItem("bv-state-v1")!);
    expect(saved.settings).toEqual({ notificacoes: { eventos: true, reservas: true, clubes: false }, localizacaoPrecisa: true });
    expect(saved.community.liked).toEqual(["ana|avaliou|Dom Casmurro"]);
    expect(saved.devConnectors).toEqual(["Pergamum"]);
    expect(getState().settings.notificacoes.clubes).toBe(false);
  });

  it("ao sair da conta, limpa os dados mas mantém as preferências de leitura", () => {
    actions.setReaderPrefs({ fontSize: 24 });
    actions.toggleFavorite({ id: "OL9", title: "Fav" });
    actions.reset();
    expect(getState().favorites).toEqual([]);
    expect(getState().readerPrefs.fontSize).toBe(24);
    expect(getState().shelf).toEqual(emptyState.shelf);
  });
});

describe("acervo: quadrinhos", () => {
  it("tem os filtros de Quadrinhos, Super-heróis e Mangá", () => {
    const labels = CATEGORIES.map((c) => c.label);
    for (const l of ["Quadrinhos", "Super-heróis", "Mangá"]) expect(labels).toContain(l);
  });

  it("esconde só os títulos sem nenhuma letra do nosso alfabeto", () => {
    expect(hasLatinTitle("鬼滅の刃 1")).toBe(false);
    expect(hasLatinTitle("呪術廻戦 0")).toBe(false);
    expect(hasLatinTitle("BLEACH―ブリーチ― 1")).toBe(true);
    expect(hasLatinTitle("Jujutsu Kaisen, Vol. 2 (呪術廻戦)")).toBe(true);
    expect(hasLatinTitle("Mônica e Cebolinha")).toBe(true);
  });
});
