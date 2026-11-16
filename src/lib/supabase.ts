import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (somente no navegador / app nativo).
 * Usa apenas a chave PUBLICÁVEL — a segurança dos dados vem das políticas RLS (supabase/schema.sql).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(url!, key!, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "bv-auth",
      },
    });
  }
  return client;
}

/** Deep link usado pelo app nativo para voltar do login com Google/Apple. */
export const NATIVE_REDIRECT = "org.bibliotecaviva.app://login-callback";
