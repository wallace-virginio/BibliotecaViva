/**
 * Rotas do histórico (/api/conversas): confere quem está logado e abre a chave dessa pessoa.
 *
 * - O app manda o token da sessão do Supabase (Authorization: Bearer …). O servidor confirma com o Supabase
 *   quem é o usuário (getUser) — não confia em id vindo do navegador.
 * - As consultas ao banco usam ESSE token, então as regras de linha (RLS) do Supabase continuam valendo:
 *   mesmo com um bug aqui, ninguém lê a conversa de outra pessoa. Não usamos chave de serviço.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { APP_ORIGINS } from "./assistant";
import { userKey } from "./conversations";

export type ConvContext = { sb: SupabaseClient; userId: string; key: CryptoKey };

export function convCors(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  return origin && APP_ORIGINS.includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        Vary: "Origin",
      }
    : {};
}

export const convJson = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...convCors(request) },
  });

export async function authorize(request: Request): Promise<ConvContext | Response> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return convJson(request, { error: "entre na sua conta" }, 401);

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  // import só aqui dentro (servidor): o build do app nativo, que não tem servidor, nem chega a ver este módulo
  const { env } = await import("cloudflare:workers");
  const master = (env as { CONVERSAS_KEY?: string }).CONVERSAS_KEY;
  if (!url || !publishable || !master) return convJson(request, { error: "historico-desligado" }, 503);

  const sb = createClient(url, publishable, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return convJson(request, { error: "sessão expirada" }, 401);
  return { sb, userId: data.user.id, key: await userKey(master, data.user.id) };
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
