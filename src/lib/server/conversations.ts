/**
 * Histórico do assistente: criptografia por usuário (servidor) + validação do que é guardado.
 *
 * - Chave mestra: segredo CONVERSAS_KEY na Cloudflare (32 bytes em base64). Nunca vai ao Supabase nem ao app.
 * - Chave de cada pessoa: HKDF-SHA256(chave mestra, id do usuário) → AES-256-GCM. Cada usuário tem a sua.
 * - O id do usuário também entra como "dado autenticado" (AAD): um texto cifrado copiado para a linha de outra
 *   pessoa não abre, mesmo com a chave certa.
 * - Formato guardado: "v1.<iv base64>.<cifrado base64>".
 */
import { parsePlan, type AssistantPlan } from "./assistant";

export type StoredMessage = { role: "user" | "assistant"; content: string; plan?: AssistantPlan };

const MAX_MESSAGES = 100;
const MAX_CHARS = 2000;
const te = new TextEncoder();
const td = new TextDecoder();

function toB64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64: string) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Chave AES-256-GCM só desta pessoa. */
export async function userKey(masterB64: string, userId: string): Promise<CryptoKey> {
  const master = fromB64(masterB64);
  if (master.length < 32) throw new Error("CONVERSAS_KEY precisa ter 32 bytes (base64)");
  const base = await crypto.subtle.importKey("raw", master, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: te.encode("biblioteca-viva/conversas/v1"), info: te.encode(userId) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function seal(key: CryptoKey, value: unknown, userId: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: te.encode(userId) }, key, te.encode(JSON.stringify(value)));
  return `v1.${toB64(iv)}.${toB64(new Uint8Array(data))}`;
}

export async function unseal<T>(key: CryptoKey, sealed: string, userId: string): Promise<T> {
  const [v, iv, data] = sealed.split(".");
  if (v !== "v1" || !iv || !data) throw new Error("formato desconhecido");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv), additionalData: te.encode(userId) }, key, fromB64(data));
  return JSON.parse(td.decode(plain)) as T;
}

/** Só guarda o que o app produz: papéis válidos, textos limitados, plano da IA revalidado. */
export function sanitizeStored(input: unknown): StoredMessage[] {
  if (!Array.isArray(input)) return [];
  const out: StoredMessage[] = [];
  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const { role, content, plan } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) continue;
    const msg: StoredMessage = { role, content: content.trim().slice(0, MAX_CHARS) };
    if (role === "assistant" && plan && typeof plan === "object") {
      const p = parsePlan(JSON.stringify(plan));
      if (p) msg.plan = p;
    }
    out.push(msg);
  }
  return out;
}

/** Título da conversa = começo da primeira pergunta. */
export function titleFor(messages: StoredMessage[]) {
  const first = messages.find((m) => m.role === "user")?.content ?? "Conversa";
  return first.length > 70 ? `${first.slice(0, 67).trimEnd()}…` : first;
}
