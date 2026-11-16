/**
 * Open Library — API pública e gratuita, sem chave.
 * https://openlibrary.org/developers/api
 */
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
  ebook: d.ebook_access === "public" || d.ebook_access === "borrowable",
  languages: d.language,
});

export async function searchBooks(
  q: string,
  opts: { limit?: number; page?: number; subject?: string; lang?: string; ebook?: boolean; signal?: AbortSignal } = {},
) {
  const params = new URLSearchParams({ fields: FIELDS, limit: String(opts.limit ?? 20), page: String(opts.page ?? 1) });
  const query = [
    q.trim(),
    opts.subject ? `subject:"${opts.subject}"` : "",
    opts.lang ? `language:${opts.lang}` : "",
    opts.ebook ? "ebook_access:public" : "",
  ]
    .filter(Boolean)
    .join(" ");
  params.set("q", query || "subject:fiction");
  const res = await fetch(`${OL}/search.json?${params}`, { signal: opts.signal });
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const json = (await res.json()) as { numFound: number; docs: SearchDoc[] };
  return { total: json.numFound, books: json.docs.map(toBook) };
}

export async function booksBySubject(subject: string, limit = 12, signal?: AbortSignal): Promise<Book[]> {
  const res = await fetch(`${OL}/subjects/${encodeURIComponent(subject)}.json?limit=${limit}`, { signal });
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

async function fetchWork(id: string, signal?: AbortSignal) {
  // Obras mescladas no Open Library viram registros "/type/redirect": seguimos até a obra final.
  let current = id;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(`${OL}/works/${current}.json`, { signal });
    if (!res.ok) throw new Error("Livro não encontrado");
    const w = await res.json();
    if (w.type?.key === "/type/redirect" && typeof w.location === "string") {
      current = w.location.replace("/works/", "");
      continue;
    }
    if (!w.title) throw new Error("Livro não encontrado");
    return { w, id: current };
  }
  throw new Error("Livro não encontrado");
}

export async function getBook(requestedId: string, signal?: AbortSignal): Promise<BookDetail> {
  const { w, id } = await fetchWork(requestedId, signal);
  const ratingRes = await fetch(`${OL}/works/${id}/ratings.json`, { signal }).catch(() => undefined);
  const rating = ratingRes?.ok ? await ratingRes.json() : undefined;

  const authorKeys: string[] = (w.authors ?? [])
    .map((a: { author?: { key: string } }) => a.author?.key)
    .filter(Boolean);
  const authors = await Promise.all(
    authorKeys.slice(0, 3).map((k) =>
      fetch(`${OL}${k}.json`, { signal })
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
    description: desc
      ?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .split(/-{4,}/)[0]
      .trim(),
    rating: rating?.summary ? { average: rating.summary.average, count: rating.summary.count } : undefined,
    links: w.links,
    firstSentence: typeof w.first_sentence === "string" ? w.first_sentence : w.first_sentence?.value,
  };
}

/** Busca rápida para autocompletar. */
export async function suggestBooks(q: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q, limit: "5", fields: "key,title,author_name,cover_i,first_publish_year" });
  const res = await fetch(`${OL}/search.json?${params}`, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { docs: SearchDoc[] };
  return json.docs.map(toBook);
}
