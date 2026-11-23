/**
 * Histórico do assistente (cliente). Só funciona com a pessoa logada: o token da sessão vai no cabeçalho
 * e o servidor confere quem é. No app nativo chama o site público (não há servidor próprio no aparelho).
 */
import type { StoredMessage } from "@/lib/server/conversations";
import { PUBLIC_SITE_URL } from "@/lib/platform";
import { getSupabase } from "@/lib/supabase";
import { canUseProxy } from "./http";

export type { StoredMessage };
export type ConversationSummary = { id: string; titulo: string; mensagens: number; atualizada: string };

const base = () => (canUseProxy() ? "/api/conversas" : `${PUBLIC_SITE_URL}/api/conversas`);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = (await getSupabase()?.auth.getSession())?.data.session;
  if (!session) throw new Error("sem-login");
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(15_000),
  });
  if (res.status === 503) throw new Error("historico-desligado");
  if (!res.ok) throw new Error(`erro-${res.status}`);
  return (await res.json()) as T;
}

export const listConversations = (signal?: AbortSignal) => call<{ conversas: ConversationSummary[] }>("", { signal }).then((r) => r.conversas);

export const getConversation = (id: string) => call<{ id: string; messages: StoredMessage[] }>(`/${id}`);

/** Cria (sem id) ou atualiza a conversa; devolve o id. */
export const saveConversation = (id: string | undefined, messages: StoredMessage[]) =>
  call<{ id: string }>("", { method: "POST", body: JSON.stringify({ id, messages }) }).then((r) => r.id);

export const deleteConversation = (id: string) => call<{ ok: boolean }>(`/${id}`, { method: "DELETE" });
