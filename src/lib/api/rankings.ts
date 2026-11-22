/**
 * Rankings reais da Open Library (gratuitos, sem chave):
 *  - /trending/{período}.json  → livros mais procurados no período
 *  - search.json?sort=…         → mais lidos, mais desejados, mais bem avaliados
 */
import type { Book } from "./openlibrary";

export type RankedBook = Book & { alreadyRead?: number; wantToRead?: number; rating?: number; ratingCount?: number };
export type TrendPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type RankSort = "already_read" | "want_to_read" | "rating" | "currently_reading";

type Doc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  already_read_count?: number;
  want_to_read_count?: number;
  ratings_average?: number;
  ratings_count?: number;
  ebook_access?: string;
};

const toRanked = (d: Doc): RankedBook => ({
  id: d.key.replace("/works/", ""),
  title: d.title,
  authors: d.author_name ?? [],
  coverId: d.cover_i,
  year: d.first_publish_year,
  subjects: (d.subject ?? []).slice(0, 5),
  ebook: d.ebook_access === "public",
  alreadyRead: d.already_read_count,
  wantToRead: d.want_to_read_count,
  rating: d.ratings_average,
  ratingCount: d.ratings_count,
});

const cache = new Map<string, RankedBook[]>();

async function cached(key: string, load: () => Promise<RankedBook[]>) {
  const hit = cache.get(key);
  if (hit) return hit;
  const v = await load();
  cache.set(key, v);
  return v;
}

export function trending(period: TrendPeriod = "weekly", limit = 10, signal?: AbortSignal) {
  return cached(`t:${period}:${limit}`, async () => {
    try {
      // O /trending às vezes fica muito lento: 9 s de limite e, se falhar, "sendo lidos agora".
      const t = AbortSignal.timeout(9_000);
      const res = await fetch(`https://openlibrary.org/trending/${period}.json?limit=${limit + 4}`, { signal: signal ? AbortSignal.any([signal, t]) : t });
      if (!res.ok) throw new Error(`Open Library ${res.status}`);
      const json = (await res.json()) as { works: Doc[] };
      return json.works.filter((w) => w.cover_i).slice(0, limit).map(toRanked);
    } catch (e) {
      if (signal?.aborted) throw e;
      return ranked("currently_reading", { limit, signal });
    }
  });
}

const FIELDS = "key,title,author_name,cover_i,first_publish_year,already_read_count,want_to_read_count,ratings_average,ratings_count,ebook_access";

export function ranked(sort: RankSort, opts: { subject?: string; lang?: string; limit?: number; signal?: AbortSignal } = {}) {
  const q = [opts.subject ? `subject:"${opts.subject}"` : "", opts.lang ? `language:${opts.lang}` : ""].filter(Boolean).join(" ") || "*";
  const limit = opts.limit ?? 10;
  return cached(`r:${sort}:${q}:${limit}`, async () => {
    const params = new URLSearchParams({ q, sort, limit: String(limit + 6), fields: FIELDS });
    // avaliação: exige um mínimo de votos para não premiar livros com 1 nota 5
    if (sort === "rating") params.set("q", `${q === "*" ? "" : q} ratings_count:[50 TO *]`.trim());
    const t = AbortSignal.timeout(12_000);
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, { signal: opts.signal ? AbortSignal.any([opts.signal, t]) : t });
    if (!res.ok) throw new Error(`Open Library ${res.status}`);
    const json = (await res.json()) as { docs: Doc[] };
    return json.docs.filter((d) => d.cover_i).slice(0, limit).map(toRanked);
  });
}

/** Temas populares, com o número de obras de cada um no acervo aberto. */
export const POPULAR_SUBJECTS = [
  { slug: "fantasy", label: "Fantasia" },
  { slug: "romance", label: "Romance" },
  { slug: "history", label: "História" },
  { slug: "science_fiction", label: "Ficção científica" },
  { slug: "mystery_and_detective_stories", label: "Mistério" },
  { slug: "biography", label: "Biografias" },
  { slug: "poetry", label: "Poesia" },
  { slug: "philosophy", label: "Filosofia" },
  { slug: "children", label: "Infantil" },
  { slug: "brazilian_literature", label: "Literatura brasileira" },
] as const;

const countCache = new Map<string, number>();
export async function subjectCount(slug: string, signal?: AbortSignal) {
  const hit = countCache.get(slug);
  if (hit !== undefined) return hit;
  const res = await fetch(`https://openlibrary.org/subjects/${slug}.json?limit=0`, { signal });
  const n = res.ok ? ((await res.json()).work_count as number) : 0;
  countCache.set(slug, n);
  return n;
}
