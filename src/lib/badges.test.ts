import { describe, expect, it } from "vitest";
import { computeBadges, newlyEarned, readingStreak } from "./badges";
import { emptyState, normalizeState, type State } from "./store";

const base = (): State => normalizeState({});
const byKey = (s: State) => Object.fromEntries(computeBadges(s).map((b) => [b.key, b]));

describe("conquistas reais", () => {
  it("conta nova: nenhuma conquistada, todas com o progresso zerado", () => {
    const all = computeBadges(base());
    expect(all.every((b) => !b.earned && b.progress === 0)).toBe(true);
  });

  it("cada ação do app destrava a conquista certa", () => {
    const s = base();
    s.reading = { OL1W: { id: "OL1W", title: "Dom Casmurro", percent: 12, updatedAt: Date.now() } };
    s.oriChats = 1;
    s.favorites = [{ id: "OL1W", title: "Dom Casmurro", savedAt: 1 }];
    s.followedLibraries = ["biblioteca-mario-de-andrade"];
    s.reservations = [
      { id: "livro-OL1W", kind: "livro", title: "Dom Casmurro", when: "", createdAt: 1 },
      { id: "evento-1", kind: "evento", title: "Clube", when: "", createdAt: 1 },
    ];
    const b = byKey(s);
    for (const k of ["primeira-pagina", "conversa-ori", "primeiro-favorito", "biblioteca-do-coracao", "primeira-reserva", "na-agenda"]) {
      expect(b[k].earned, k).toBe(true);
    }
    expect(b["primeiro-livro"].earned).toBe(false); // só 12% lido
  });

  it("mostra o progresso das que têm meta (estante 2 de 5)", () => {
    const s = base();
    s.shelf = {
      a: { id: "a", title: "A", status: "quero-ler", addedAt: 1 },
      b: { id: "b", title: "B", status: "lido", addedAt: 1 },
    };
    expect(byKey(s)["estante-montada"]).toMatchObject({ earned: false, progress: 2, goal: 5 });
  });

  it("uma vez conquistada, continua conquistada (com a data) mesmo desfazendo a ação", () => {
    const s = base();
    s.favorites = [{ id: "x", title: "X", savedAt: 1 }];
    expect(newlyEarned(s).map((b) => b.key)).toEqual(["primeiro-favorito"]);
    s.badges = { "primeiro-favorito": 1_700_000_000_000 };
    s.favorites = [];
    expect(byKey(s)["primeiro-favorito"]).toMatchObject({ earned: true, earnedAt: 1_700_000_000_000 });
    expect(newlyEarned(s)).toEqual([]);
  });

  it("sequência de leitura: dias seguidos até hoje", () => {
    const s = base();
    const day = (n: number) => new Date(2026, 10, 23 - n, 12).getTime();
    s.reading = {
      a: { id: "a", title: "A", percent: 10, updatedAt: day(0) },
      b: { id: "b", title: "B", percent: 10, updatedAt: day(1) },
      c: { id: "c", title: "C", percent: 10, updatedAt: day(2) },
    };
    expect(readingStreak(s, new Date(2026, 10, 23, 18))).toBe(3);
  });
});

describe("dados guardados antes desta versão", () => {
  it("ganham os campos novos com valores padrão, sem perder o que já tinham", () => {
    const old = { favorites: [{ id: "x", title: "X", savedAt: 1 }] } as Partial<State>;
    const s = normalizeState(old);
    expect(s.favorites).toHaveLength(1);
    expect(s.settings.notificacoes).toEqual({ eventos: true, reservas: true, clubes: true });
    expect(s.badges).toEqual({});
    expect(s.community).toEqual({ liked: [], following: [] });
    expect(emptyState.oriChats).toBe(0);
  });
});
