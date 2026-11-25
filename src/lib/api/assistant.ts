/**
 * Cliente do assistente com IA (rota /api/assistente, ver src/lib/server/assistant.ts).
 * No app nativo não há servidor próprio: chama o site público. Devolve um erro quando a IA não está
 * disponível (sem internet, cota do dia esgotada, limite por pessoa) — a tela usa o assistente local.
 */
import type { AssistantPlan, ChatTurn } from "@/lib/server/assistant";
import { PUBLIC_SITE_URL } from "@/lib/platform";
import { canUseProxy } from "./http";

export type { AssistantPlan, ChatTurn };

export async function askAssistant(messages: ChatTurn[], city?: string, lang: "pt" | "en" | "es" = "pt"): Promise<{ plan: AssistantPlan } | { error: "limite" | "indisponivel" }> {
  const url = canUseProxy() ? "/api/assistente" : `${PUBLIC_SITE_URL}/api/assistente`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, city, lang }),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 429) return { error: "limite" };
    if (!res.ok) return { error: "indisponivel" };
    const data = (await res.json()) as { plan?: AssistantPlan };
    return data.plan ? { plan: data.plan } : { error: "indisponivel" };
  } catch {
    return { error: "indisponivel" };
  }
}
