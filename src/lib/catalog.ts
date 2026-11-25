import { FEATURED_LIBRARIES, type Library } from "@/data/libraries";
import { seeded } from "./utils";

/**
 * Disponibilidade física simulada de um livro nas bibliotecas conectadas.
 * Quando uma biblioteca publica um Provider, estes dados passam a vir do sistema dela.
 */
export type Holding = {
  library: Library;
  copies: number;
  available: number;
  floor: string;
  shelf: string;
  callNumber: string;
  /** distância da localização da sessão, quando conhecida */
  km?: number;
};

export type NearbyLibrary = { lib: Library; km: number };

function makeHolding(r: ReturnType<typeof seeded>, library: Library, km?: number): Holding {
  const copies = r.int(1, 5);
  return {
    library,
    km,
    copies,
    available: r.int(0, copies),
    floor: `${r.int(1, 4)}º andar`,
    shelf: `Estante ${String.fromCharCode(65 + r.int(0, 11))}-${r.int(1, 30)}`,
    callNumber: `${r.int(100, 999)}.${r.int(1, 99)} ${String.fromCharCode(65 + r.int(0, 25))}${r.int(10, 99)}`,
  };
}

/**
 * Exemplares do livro. Com a localização da sessão, usa as bibliotecas mais próximas da pessoa
 * (ordenadas pela distância); sem ela, bibliotecas conectadas da rede.
 */
export function holdingsFor(bookId: string, nearby?: NearbyLibrary[]): Holding[] {
  const r = seeded(bookId);
  if (nearby && nearby.length) {
    const pool = nearby.filter((n) => n.lib.kind !== "Digital").slice(0, 14);
    const n = Math.min(pool.length, r.int(2, 4));
    const out: Holding[] = [];
    for (let i = 0; i < n; i++) {
      const idx = r.int(0, pool.length - 1);
      const { lib, km } = pool.splice(idx, 1)[0];
      out.push(makeHolding(r, lib, km));
    }
    return out.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  }
  const pool = [...FEATURED_LIBRARIES].filter((l) => l.kind !== "Digital");
  const n = r.int(2, 5);
  const out: Holding[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = i === 0 ? r.int(0, 6) % pool.length : r.int(0, pool.length - 1);
    out.push(makeHolding(r, pool.splice(idx, 1)[0]));
  }
  return out;
}

/** Disponível para retirada — perto da pessoa (até `maxKm`) quando a localização é conhecida. */
export function isAvailable(bookId: string, nearby?: NearbyLibrary[], maxKm = 15) {
  return holdingsFor(bookId, nearby).some((h) => h.available > 0 && (h.km === undefined || h.km <= maxKm));
}

export const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "fiction", label: "Ficção" },
  { value: "science_fiction", label: "Ficção científica" },
  // quadrinhos: os assuntos da Open Library que trazem mais obras com capa (graphic_novels ~63 mil,
  // superheroes ~8,6 mil com Marvel e DC, manga ~15 mil)
  { value: "graphic_novels", label: "Quadrinhos" },
  { value: "superheroes", label: "Super-heróis" },
  { value: "manga", label: "Mangá" },
  { value: "history", label: "História" },
  { value: "computers", label: "Tecnologia" },
  { value: "artificial_intelligence", label: "Inteligência Artificial" },
  { value: "mathematics", label: "Matemática" },
  { value: "philosophy", label: "Filosofia" },
  { value: "children", label: "Infantil" },
  { value: "poetry", label: "Poesia" },
  { value: "biography", label: "Biografias" },
  { value: "art", label: "Arte" },
] as const;

/** Categorias de quadrinhos, onde muitos títulos vêm só em japonês ou chinês na Open Library. */
export const COMIC_CATEGORIES: ReadonlySet<string> = new Set(["graphic_novels", "superheroes", "manga"]);

/**
 * O título tem letras do nosso alfabeto? "鬼滅の刃 1" não (some da lista de quadrinhos); "BLEACH―ブリーチ― 1"
 * e "Jujutsu Kaisen (呪術廻戦)" sim — dá para a pessoa ler e buscar na loja.
 */
export function hasLatinTitle(title: string) {
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(title);
}

export const MATERIAL_TYPES = [
  { value: "livros", label: "Livros", subject: "" },
  { value: "revistas", label: "Revistas", subject: "periodicals" },
  { value: "jornais", label: "Jornais", subject: "newspapers" },
  { value: "historicos", label: "Documentos históricos", subject: "sources" },
] as const;
