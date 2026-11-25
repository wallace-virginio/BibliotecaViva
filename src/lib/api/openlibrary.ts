/**
 * Open Library — API pública e gratuita, sem chave.
 * https://openlibrary.org/developers/api
 */
import { olFetch } from "./http";

const OL = "https://openlibrary.org";

export type Book = {
  id: string; // work id, ex: OL45883W
  title: string;
  authors: string[];
  coverId?: number;
  year?: number;
  subjects: string[];
  editions?: number;
  pages?: number;
  ebook?: boolean;
  languages?: string[];
};

export type BookDetail = Book & {
  description?: string;
  rating?: { average?: number; count?: number };
  links?: { title: string; url: string }[];
  firstSentence?: string;
};

export const coverUrl = (id?: number, size: "S" | "M" | "L" = "M") =>
  id ? `https://covers.openlibrary.org/b/id/${id}-${size}.jpg` : undefined;

const FIELDS =
  "key,title,author_name,cover_i,first_publish_year,subject,edition_count,number_of_pages_median,ebook_access,language";

type SearchDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  edition_count?: number;
  number_of_pages_median?: number;
  ebook_access?: string;
  language?: string[];
};

const toBook = (d: SearchDoc): Book => ({
  id: d.key.replace("/works/", ""),
  title: d.title,
  authors: d.author_name ?? [],
  coverId: d.cover_i,
  year: d.first_publish_year,
  subjects: (d.subject ?? []).slice(0, 8),
  editions: d.edition_count,
  pages: d.number_of_pages_median,
  // só domínio público: é o que o leitor do app abre (e o mesmo critério do filtro "Grátis para ler no app").
  // "borrowable" exige empréstimo com conta no Internet Archive — não é "ler grátis" aqui.
  ebook: d.ebook_access === "public",
  languages: d.language,
});

export async function searchBooks(
  q: string,
  opts: { limit?: number; page?: number; subject?: string; author?: string; lang?: string; ebook?: boolean; signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({ fields: FIELDS, limit: String(opts.limit ?? 20), page: String(opts.page ?? 1) });
  // autor: campo da busca da Open Library (aceita nome parcial, ex.: "machado" acha "Machado de Assis")
  const author = opts.author?.replace(/["\\]/g, " ").trim();
  const query = [
    q.trim(),
    author ? `author:"${author}"` : "",
    opts.subject ? `subject:"${opts.subject}"` : "",
    opts.lang ? `language:${opts.lang}` : "",
    opts.ebook ? "ebook_access:public" : "",
  ]
    .filter(Boolean)
    .join(" ");
  params.set("q", query || "subject:fiction");
  const res = await olFetch(`search.json?${params}`, opts.signal);
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const json = (await res.json()) as { numFound: number; docs: SearchDoc[] };
  return { total: json.numFound, books: json.docs.map(toBook) };
}

export async function booksBySubject(subject: string, limit = 12, signal?: AbortSignal): Promise<Book[]> {
  const res = await olFetch(`subjects/${encodeURIComponent(subject)}.json?limit=${limit}`, signal);
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const json = (await res.json()) as {
    works: {
      key: string;
      title: string;
      authors: { name: string }[];
      cover_id?: number;
      first_publish_year?: number;
      subject?: string[];
      edition_count?: number;
      availability?: { is_readable?: boolean };
    }[];
  };
  return json.works.map((w) => ({
    id: w.key.replace("/works/", ""),
    title: w.title,
    authors: w.authors.map((a) => a.name),
    coverId: w.cover_id,
    year: w.first_publish_year,
    subjects: (w.subject ?? []).slice(0, 6),
    editions: w.edition_count,
    ebook: w.availability?.is_readable,
  }));
}

/** O livro não existe (404). Qualquer outro erro é falha temporária da Open Library ou da rede. */
export class BookNotFoundError extends Error {
  constructor() {
    super("Livro não encontrado");
    this.name = "BookNotFoundError";
  }
}

/** Busca com uma nova tentativa automática quando a Open Library está lenta/instável (não repete 404). */
async function olFetchRetry(path: string, signal?: AbortSignal) {
  try {
    const res = await olFetch(path, signal);
    if (res.ok || res.status === 404) return res;
  } catch (e) {
    if (signal?.aborted) throw e;
  }
  await new Promise((r) => setTimeout(r, 1200));
  return olFetch(path, signal);
}

/**
 * Resumos da Open Library vêm em Markdown: tira links, negrito/itálico, títulos e a seção
 * de "veja também" depois de "----".
 */
export function cleanDescription(text: string | undefined) {
  if (!text) return undefined;
  const out = text
    .split(/-{4,}/)[0]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  return out || undefined;
}

async function fetchWork(id: string, signal?: AbortSignal) {
  // Obras mescladas no Open Library viram registros "/type/redirect": seguimos até a obra final.
  let current = id;
  for (let i = 0; i < 4; i++) {
    const res = await olFetchRetry(`works/${current}.json`, signal);
    if (res.status === 404) throw new BookNotFoundError();
    if (!res.ok) throw new Error(`Open Library ${res.status}`);
    const w = await res.json();
    if (w.type?.key === "/type/redirect" && typeof w.location === "string") {
      current = w.location.replace("/works/", "");
      continue;
    }
    if (!w.title) throw new BookNotFoundError();
    return { w, id: current };
  }
  throw new BookNotFoundError();
}

export async function getBook(requestedId: string, signal?: AbortSignal): Promise<BookDetail> {
  const { w, id } = await fetchWork(requestedId, signal);
  const ratingRes = await olFetch(`works/${id}/ratings.json`, signal).catch(() => undefined);
  const rating = ratingRes?.ok ? await ratingRes.json() : undefined;

  const authorKeys: string[] = (w.authors ?? [])
    .map((a: { author?: { key: string } }) => a.author?.key)
    .filter(Boolean);
  const authors = await Promise.all(
    authorKeys.slice(0, 3).map((k) =>
      olFetch(`${k.replace(/^\//, "")}.json`, signal)
        .then((r) => r.json())
        .then((a) => a.name as string)
        .catch(() => ""),
    ),
  );
  const desc: string | undefined = typeof w.description === "string" ? w.description : w.description?.value;
  const yearMatch = w.first_publish_date ? String(w.first_publish_date).match(/\d{4}/) : null;
  return {
    id,
    title: w.title,
    authors: authors.filter(Boolean),
    coverId: w.covers?.find((c: number) => c > 0),
    year: yearMatch ? parseInt(yearMatch[0], 10) : undefined,
    subjects: (w.subjects ?? []).slice(0, 10),
    description: cleanDescription(desc),
    rating: rating?.summary ? { average: rating.summary.average, count: rating.summary.count } : undefined,
    links: w.links,
    firstSentence: typeof w.first_sentence === "string" ? w.first_sentence : w.first_sentence?.value,
  };
}

/* ---------------- Edição brasileira (para "Onde comprar") ---------------- */

export type Edition = { title: string; isbn?: string; publisher?: string; year?: number };

type EditionDoc = {
  title?: string;
  isbn_13?: string[];
  isbn_10?: string[];
  publishers?: string[];
  languages?: { key: string }[];
  publish_date?: string;
};

/** ISBN registrado no Brasil: 978-85… / 978-65… (ISBN-13) ou 85… / 65… (ISBN-10). */
const BR_ISBN13 = /^978(85|65)\d{8}$/;
const BR_ISBN10 = /^(85|65)\d{7}[\dX]$/;

/**
 * Escolhe a edição brasileira mais útil para buscar nas lojas: ISBN do Brasil, de preferência em
 * português e a mais recente. Edições "em português" com ISBN de fora (gráficas sob demanda dos EUA)
 * não contam — nas lojas brasileiras elas raramente aparecem.
 */
export function pickBrazilianEdition(entries: EditionDoc[]): Edition | undefined {
  const year = (e: EditionDoc) => Number(e.publish_date?.match(/\d{4}/)?.[0] ?? 0);
  const candidates = entries
    .map((e) => {
      const isbn = e.isbn_13?.find((i) => BR_ISBN13.test(i)) ?? e.isbn_10?.find((i) => BR_ISBN10.test(i));
      return isbn && e.title ? { e, isbn } : undefined;
    })
    .filter((x): x is { e: EditionDoc; isbn: string } => !!x)
    .sort((a, b) => {
      const pt = (x: EditionDoc) => ((x.languages ?? []).some((l) => l.key === "/languages/por") ? 1 : 0);
      return pt(b.e) - pt(a.e) || year(b.e) - year(a.e);
    });
  const best = candidates[0];
  if (!best) return undefined;
  return { title: best.e.title!, isbn: best.isbn, publisher: best.e.publishers?.[0], year: year(best.e) || undefined };
}

/** Edição brasileira de uma obra (ou undefined se a Open Library não conhecer nenhuma). Pode demorar alguns segundos. */
export async function getBrazilianEdition(workId: string, signal?: AbortSignal): Promise<Edition | undefined> {
  const res = await olFetch(`works/${workId}/editions.json?limit=200`, signal);
  if (!res.ok) return undefined;
  const data = (await res.json()) as { entries?: EditionDoc[] };
  return pickBrazilianEdition(data.entries ?? []);
}

/** Busca rápida para autocompletar. */
export type AuthorSuggestion = { key: string; name: string; topWork?: string };

const foldAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (q: string) =>
  foldAccents(q)
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

/**
 * Busca "enquanto digita": a última palavra vira prefixo (macha → macha*), porque a Open Library
 * só casa palavras inteiras — sem isso "macha" não acharia Machado de Assis.
 */
export function prefixQuery(q: string, field?: string) {
  const t = tokens(q);
  return t.map((w, i) => `${field ? `${field}:` : ""}${w}${i === t.length - 1 && w.length >= 2 ? "*" : ""}`).join(" ");
}

/** O nome do autor combina com o que foi digitado: contém as palavras completas e começa com a última (sem acento). */
export function authorMatches(name: string, q: string) {
  const t = tokens(q);
  if (!t.length) return false;
  const words = foldAccents(name).split(/[\s.,-]+/);
  const last = t[t.length - 1];
  return t.slice(0, -1).every((w) => words.some((x) => x.startsWith(w))) && words.some((w) => w.startsWith(last));
}

export type Suggestions = { books: Book[]; authors: AuthorSuggestion[] };
// memória das sugestões desta sessão: apagar uma letra ou repetir a busca responde na hora
const suggestCache = new Map<string, Suggestions>();

/**
 * Sugestões enquanto digita, num pedido só: livros (os 5 primeiros) e autores (agrupados a partir dos
 * mesmos resultados). A busca de autores da Open Library é lenta (5–20s) e cai com erro 500; a de livros
 * com prefixo responde em ~3s, e pelo nosso proxy com cache em ~0,4s quando o termo já foi buscado.
 */
export async function suggestAll(q: string, signal?: AbortSignal): Promise<Suggestions> {
  const pq = prefixQuery(q);
  if (!pq) return { books: [], authors: [] };
  const hit = suggestCache.get(pq);
  if (hit) return hit;
  const params = new URLSearchParams({ q: pq, limit: "20", fields: "key,title,author_name,author_key,cover_i,first_publish_year" });
  const res = await olFetch(`search.json?${params}`, signal);
  if (!res.ok) return { books: [], authors: [] }; // falha não vai para a memória
  const json = (await res.json()) as { docs: (SearchDoc & { author_key?: string[] })[] };
  const count = new Map<string, AuthorSuggestion & { n: number }>();
  for (const d of json.docs) {
    (d.author_name ?? []).forEach((name, i) => {
      if (!authorMatches(name, q)) return;
      const key = d.author_key?.[i] ?? name;
      const cur = count.get(key);
      if (cur) cur.n++;
      else count.set(key, { key, name, topWork: d.title, n: 1 });
    });
  }
  // só livros cujo TÍTULO ou AUTOR começa com o digitado: a busca também casa campos que a pessoa não vê
  // (ex.: "clar" → editora "Clarendon Press" trazia a Bíblia e a Odisseia)
  const t = tokens(q);
  const titleHit = (title = "") => {
    const words = foldAccents(title).split(/[\s:,.;!?()'"-]+/);
    return t.every((w) => words.some((x) => x.startsWith(w)));
  };
  const relevant = json.docs.filter((d) => titleHit(d.title) || (d.author_name ?? []).some((a) => authorMatches(a, q)));
  const out: Suggestions = {
    books: relevant.slice(0, 5).map(toBook),
    authors: [...count.values()].sort((a, b) => b.n - a.n).slice(0, 4).map(({ n: _n, ...a }) => a),
  };
  suggestCache.set(pq, out);
  if (suggestCache.size > 300) suggestCache.delete(suggestCache.keys().next().value!);
  return out;
}
