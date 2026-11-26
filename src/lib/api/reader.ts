/**
 * Fontes de leitura gratuita (domínio público), todas com CORS liberado:
 *  - Wikisource (pt/en/es): texto limpo, capítulo a capítulo → leitor nativo do app. As traduções de domínio público
 *    da mesma obra são ligadas entre os idiomas (ex.: "Alice's Adventures in Wonderland" ↔ "Alice no País das Maravilhas"),
 *    então o leitor abre no idioma da pessoa quando existe e deixa trocar.
 *  - Internet Archive: livro digitalizado página a página (BookReader embutido).
 * O Project Gutenberg não libera CORS, por isso não é usado direto do navegador.
 */
import { olFetch } from "./http";

export type BookLang = "pt" | "en" | "es";

/** Mesma obra em outro idioma do Wikisource. */
export type Edition = { lang: BookLang; page: string };

export type ReadableSource =
  | { kind: "wikisource"; lang: BookLang; page: string; title: string; editions?: Edition[] }
  | { kind: "archive"; identifier: string; title: string };

const BOOK_LANGS: BookLang[] = ["pt", "en", "es"];

export type Chapter = { title: string; page: string };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sourceCache = new Map<string, ReadableSource | null>();

/**
 * Edição gratuita do livro. Com `prefer`, procura primeiro no Wikisource desse idioma e, se a obra estiver em
 * outro, abre a tradução ligada a ela no idioma preferido (quando existe). `editions` lista os idiomas disponíveis.
 */
export async function findReadableSource(
  book: { id: string; title: string; authors: string[] },
  signal?: AbortSignal,
  prefer: BookLang = "pt",
): Promise<ReadableSource | null> {
  const key = `${book.id}:${prefer}`;
  if (sourceCache.has(key)) return sourceCache.get(key)!;
  const order = [prefer, ...BOOK_LANGS.filter((l) => l !== prefer)];
  let result: ReadableSource | null = await fromWikisource(book, order, signal);
  if (result?.kind === "wikisource") {
    const editions = await translationsOf(result.lang, result.page, signal);
    const mine = editions.find((e) => e.lang === prefer);
    result = mine && mine.lang !== result.lang ? { ...result, lang: mine.lang, page: mine.page, title: mine.page, editions } : { ...result, editions };
  }
  result ??= await fromArchive(book, signal);
  sourceCache.set(key, result);
  return result;
}

/** Traduções da página no Wikisource (links entre idiomas), incluindo a própria página. */
async function translationsOf(lang: BookLang, page: string, signal?: AbortSignal): Promise<Edition[]> {
  try {
    const params = new URLSearchParams({ action: "query", titles: page, prop: "langlinks", lllimit: "500", redirects: "1", format: "json", origin: "*" });
    const json = await fetch(`https://${lang}.wikisource.org/w/api.php?${params}`, { signal }).then((r) => r.json());
    const p = Object.values(json?.query?.pages ?? {})[0] as { title?: string; langlinks?: { lang: string; "*": string }[] } | undefined;
    return pickEditions({ lang, page: p?.title ?? page }, p?.langlinks ?? []);
  } catch (e) {
    if (signal?.aborted) throw e;
    return [{ lang, page }];
  }
}

/**
 * Só pt/en/es e só páginas de obra: fora "Em Tradução:..." e outros espaços com dois-pontos, que no Wikisource
 * são traduções ainda incompletas. Ordem fixa: português, inglês, espanhol.
 */
export function pickEditions(self: Edition, links: { lang: string; "*": string }[]): Edition[] {
  const out: Edition[] = [self];
  for (const l of links) {
    const lang = l.lang as BookLang;
    if (!BOOK_LANGS.includes(lang) || out.some((e) => e.lang === lang) || l["*"].includes(":")) continue;
    out.push({ lang, page: l["*"] });
  }
  return out.sort((a, b) => BOOK_LANGS.indexOf(a.lang) - BOOK_LANGS.indexOf(b.lang));
}

async function fromWikisource(book: { title: string; authors: string[] }, langs: BookLang[], signal?: AbortSignal): Promise<ReadableSource | null> {
  const title = norm(book.title);
  const author = norm(book.authors[0] ?? "").split(" ").pop() ?? "";
  for (const lang of langs) {
    try {
      // 1) Página com o título exato da obra (seguindo redirecionamentos).
      const direct = new URLSearchParams({ action: "query", titles: book.title, redirects: "1", format: "json", origin: "*" });
      const dj = await fetch(`https://${lang}.wikisource.org/w/api.php?${direct}`, { signal }).then((r) => r.json());
      const page = Object.values(dj?.query?.pages ?? {})[0] as { title?: string; missing?: string } | undefined;
      if (page?.title && page.missing === undefined) return { kind: "wikisource", lang, page: page.title, title: page.title };
      // 2) Busca textual.
      const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: `${book.title} ${author}`.trim(),
        srnamespace: "0",
        srlimit: "8",
        format: "json",
        origin: "*",
      });
      const res = await fetch(`https://${lang}.wikisource.org/w/api.php?${params}`, { signal });
      const json = await res.json();
      const hits = (json?.query?.search ?? []) as { title: string; snippet: string }[];
      // Página principal da obra: título igual ao do livro (ignorando acentos), sem subpágina.
      const hit = hits.find((h) => {
        const t = norm(h.title.replace(/\s*\(.*\)$/, ""));
        return !h.title.includes("/") && (t === title || t === `${title} ${author}`);
      });
      if (hit) return { kind: "wikisource", lang, page: hit.title, title: hit.title };
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }
  return null;
}

async function fromArchive(book: { id: string }, signal?: AbortSignal): Promise<ReadableSource | null> {
  try {
    const params = new URLSearchParams({ q: `key:/works/${book.id}`, fields: "title,ia,ebook_access", limit: "1" });
    const res = await olFetch(`search.json?${params}`, signal);
    const doc = (await res.json())?.docs?.[0] as { title: string; ia?: string[]; ebook_access?: string } | undefined;
    if (!doc || doc.ebook_access !== "public" || !doc.ia?.length) return null;
    // Escolhe o primeiro item realmente aberto (itens de empréstimo têm access-restricted-item).
    for (const id of doc.ia.slice(0, 8)) {
      const m = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}/metadata`, { signal })
        .then((r) => r.json())
        .catch(() => null);
      const meta = m?.result;
      if (meta && meta.mediatype === "texts" && String(meta["access-restricted-item"]) !== "true") {
        return { kind: "archive", identifier: id, title: doc.title };
      }
    }
  } catch (e) {
    if (signal?.aborted) throw e;
  }
  return null;
}

/* ---------------- Wikisource: capítulos e texto ---------------- */

async function parsePage(lang: string, page: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    action: "parse",
    page,
    prop: "text",
    redirects: "1",
    formatversion: "2",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`https://${lang}.wikisource.org/w/api.php?${params}`, { signal });
  const json = await res.json();
  if (json.error) throw new Error(json.error.info ?? "Página não encontrada");
  return { title: json.parse.title as string, html: json.parse.text as string };
}

/** Lista de capítulos (subpáginas linkadas na página da obra). Vazia = obra numa página só. */
export async function loadWorkIndex(
  src: Extract<ReadableSource, { kind: "wikisource" }>,
  signal?: AbortSignal,
  depth = 0,
): Promise<{ title: string; chapters: Chapter[]; html?: string }> {
  const { title, html } = await parsePage(src.lang, src.page, signal);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const targets = Array.from(doc.querySelectorAll("a[href^='/wiki/']")).map((a) => ({
    page: decodeURIComponent(a.getAttribute("href")!.slice(6)).replace(/_/g, " ").split("#")[0],
    label: (a.textContent ?? "").trim(),
  }));
  const seen = new Set<string>();
  const chapters: Chapter[] = [];
  for (const t of targets) {
    if (!t.page.startsWith(`${title}/`) || seen.has(t.page)) continue;
    seen.add(t.page);
    chapters.push({ page: t.page, title: t.label || t.page.split("/").pop()! });
  }
  // Página de "versões" (ex.: "Pride and Prejudice" → "Pride and Prejudice (1813)"): segue a primeira versão
  // que tem texto de verdade — algumas são traduções colaborativas que só têm o sumário
  // (em "Alice no País das Maravilhas", a que funciona é a tradução de Monteiro Lobato).
  const text = doc.body.textContent ?? "";
  if (!chapters.length && depth < 1 && text.length < 4000) {
    const versions = [...new Set(targets.filter((t) => t.page.startsWith(`${title} (`) && !t.page.includes("/")).map((t) => t.page))].slice(0, 3);
    let first: Awaited<ReturnType<typeof loadWorkIndex>> | undefined;
    for (const page of versions) {
      const r = await loadWorkIndex({ ...src, page }, signal, depth + 1).catch((e) => {
        if (signal?.aborted) throw e;
        return undefined;
      });
      if (!r) continue;
      if (r.chapters.length || (r.html?.length ?? 0) > 4000) return r;
      first ??= r;
    }
    if (first) return first;
  }
  return { title, chapters, html: chapters.length ? undefined : sanitize(html) };
}

export async function loadChapter(lang: string, page: string, signal?: AbortSignal) {
  const { html } = await parsePage(lang, page, signal);
  return sanitize(html);
}

/* ---------------- Sanitização: só tags de texto, nada de scripts/links/estilos ---------------- */

const ALLOWED = new Set(["P", "H1", "H2", "H3", "H4", "H5", "EM", "I", "STRONG", "B", "BR", "BLOCKQUOTE", "UL", "OL", "LI", "SMALL", "SUP", "SUB", "HR", "CENTER"]);
const DROP = ".ws-noexport, .noprint, .ws-header, #headertemplate, .header_template, table, .mw-editsection, .reference, .references, style, script, sup.reference, .navbox, .wst-header, .licenseContainer, figure, img";

/** Exportada para testes: deixa só tags de texto, sem scripts, links ou atributos. */
export function sanitize(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(DROP).forEach((n) => n.remove());
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return esc(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    const inner = Array.from(el.childNodes).map(walk).join("");
    let tag = el.tagName;
    if (tag === "CENTER") tag = "P";
    if (tag === "DIV" && /poem/.test(el.className)) return `<blockquote>${inner}</blockquote>`;
    if (!ALLOWED.has(tag)) return inner;
    if (tag === "BR" || tag === "HR") return `<${tag.toLowerCase()}>`;
    const t = tag.toLowerCase();
    return inner.trim() ? `<${t}>${inner}</${t}>` : "";
  };
  return walk(doc.body).replace(/(<br>\s*){3,}/g, "<br><br>");
}
