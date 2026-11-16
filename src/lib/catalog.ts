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
};

export function holdingsFor(bookId: string): Holding[] {
  const r = seeded(bookId);
  const pool = [...FEATURED_LIBRARIES].filter((l) => l.kind !== "Digital");
  const n = r.int(2, 5);
  const out: Holding[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = i === 0 ? r.int(0, 6) % pool.length : r.int(0, pool.length - 1);
    const library = pool.splice(idx, 1)[0];
    const copies = r.int(1, 5);
    out.push({
      library,
      copies,
      available: r.int(0, copies),
      floor: `${r.int(1, 4)}º andar`,
      shelf: `Estante ${String.fromCharCode(65 + r.int(0, 11))}-${r.int(1, 30)}`,
      callNumber: `${r.int(100, 999)}.${r.int(1, 99)} ${String.fromCharCode(65 + r.int(0, 25))}${r.int(10, 99)}`,
    });
  }
  return out;
}

export function isAvailable(bookId: string) {
  return holdingsFor(bookId).some((h) => h.available > 0);
}

export const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "fiction", label: "Ficção" },
  { value: "science_fiction", label: "Ficção científica" },
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

export const MATERIAL_TYPES = [
  { value: "livros", label: "Livros", subject: "" },
  { value: "revistas", label: "Revistas", subject: "periodicals" },
  { value: "jornais", label: "Jornais", subject: "newspapers" },
  { value: "historicos", label: "Documentos históricos", subject: "sources" },
] as const;
