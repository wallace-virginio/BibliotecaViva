/**
 * Assistente "Peça uma indicação" com IA (Cloudflare Workers AI, plano grátis).
 *
 * Princípio: a IA INTERPRETA e CONVERSA; os dados vêm das nossas fontes. Ela devolve um "plano" em JSON
 * (texto da resposta + o que buscar: assunto de livros, tipo de biblioteca, categorias de evento) e o app
 * preenche os cards com Open Library, bibliotecas e agenda reais — assim ela não inventa títulos nem horários.
 */

/** Modelo: Gemma 4 (bom em português e barato em "neurons": ~14 por pergunta → centenas de perguntas/dia grátis). */
export const ASSISTANT_MODEL = "@cf/google/gemma-4-26b-a4b-it";

export const EVENT_CATEGORIES = ["Clube de leitura", "Crianças", "Cultura", "Curso", "Exposição", "Oficina"] as const;
export const LIBRARY_KINDS = ["estudar", "criancas", "maker", "historicas", "digitais", "universitarias"] as const;

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type AssistantPlan = {
  /** resposta em português, curta e acolhedora (sem citar títulos/horários inventados) */
  reply: string;
  /** busca de livros: assunto em inglês no formato da Open Library (ex.: "artificial_intelligence") e/ou termos */
  books?: { subject?: string; query?: string };
  libraries?: (typeof LIBRARY_KINDS)[number];
  events?: (typeof EVENT_CATEGORIES)[number][];
};

export const MAX_TURNS = 8;
export const MAX_CHARS = 600;

export function systemPrompt(city?: string) {
  return `Você é o Ori, o mascote e assistente da Biblioteca Viva (um livro aberto de onde nasce um broto).
Se perguntarem seu nome, diga que é o Ori. A Biblioteca Viva é um app brasileiro que conecta pessoas às bibliotecas públicas
(livros para emprestar, livros gratuitos para ler no app, salas de estudo, eventos e oficinas gratuitas).
${city ? `A pessoa está em: ${city}.` : "A cidade da pessoa não foi informada."}

Responda SEMPRE e SOMENTE com um objeto JSON, sem texto fora dele, neste formato:
{"reply": string, "books": {"subject": string, "query": string} | null, "libraries": string | null, "events": string[] | null}

Regras:
- "reply": português do Brasil, tom humano e caloroso, no máximo 3 frases. Não invente nomes de livros,
  autores, bibliotecas, endereços, horários ou preços — os cards com dados reais aparecem logo abaixo da sua resposta.
- "books": quando fizer sentido indicar livros. "subject" em inglês, minúsculas e com "_" (formato Open Library,
  ex.: "mathematics", "science_fiction", "juvenile_fiction", "brazilian_literature", "artificial_intelligence", "history").
  "query" são termos de busca curtos (podem ser em português, ex.: "Machado de Assis"). Use um dos dois ou ambos.
- "libraries": um destes ou null: ${LIBRARY_KINDS.join(", ")} (estudar = salas silenciosas/wi-fi; criancas = espaço infantil;
  maker = laboratório/tecnologia; historicas = acervos raros e prédios históricos).
- "events": lista com categorias destas (ou null): ${EVENT_CATEGORIES.join(", ")}.
- Se a pergunta não tiver relação com leitura, estudo, bibliotecas ou cultura, responda com gentileza que você só
  ajuda com isso, e deixe os outros campos null.
- Nunca peça dados pessoais (CPF, endereço, telefone).`;
}

/** Limpa o histórico vindo do navegador: só papéis válidos, textos curtos, últimas mensagens. */
export function sanitizeHistory(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m): m is ChatTurn => !!m && typeof m === "object" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS).trim() }))
    .filter((m) => m.content)
    .slice(-MAX_TURNS);
}

/** Extrai e valida o plano do texto do modelo (tolera ```json``` e texto em volta). Devolve null se não der. */
export function parsePlan(text: string): AssistantPlan | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const reply = typeof raw.reply === "string" ? raw.reply.trim().slice(0, 700) : "";
  if (!reply) return null;
  const plan: AssistantPlan = { reply };

  const b = raw.books as { subject?: unknown; query?: unknown } | null | undefined;
  if (b && typeof b === "object") {
    const subject = typeof b.subject === "string" ? b.subject.toLowerCase().trim().replace(/[^a-z_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 60) : "";
    const query = typeof b.query === "string" ? b.query.trim().slice(0, 80) : "";
    if (subject || query) plan.books = { ...(subject && { subject }), ...(query && { query }) };
  }
  if (typeof raw.libraries === "string" && (LIBRARY_KINDS as readonly string[]).includes(raw.libraries)) {
    plan.libraries = raw.libraries as AssistantPlan["libraries"];
  }
  if (Array.isArray(raw.events)) {
    const ev = raw.events.filter((e): e is (typeof EVENT_CATEGORIES)[number] => typeof e === "string" && (EVENT_CATEGORIES as readonly string[]).includes(e));
    if (ev.length) plan.events = ev;
  }
  return plan;
}

/** Texto da resposta do Workers AI (os modelos devolvem em formatos diferentes). */
export function aiText(out: unknown): string {
  if (typeof out === "string") return out;
  const o = out as { response?: unknown; choices?: { message?: { content?: unknown } }[] } | null;
  if (o && typeof o.response === "string") return o.response;
  if (o && typeof o.response === "object" && o.response) return JSON.stringify(o.response);
  const c = o?.choices?.[0]?.message?.content;
  return typeof c === "string" ? c : "";
}

/** Origens que podem chamar a API de fora do site: o app nativo (Capacitor Android/iOS). */
export const APP_ORIGINS = ["https://localhost", "capacitor://localhost", "http://localhost"];
