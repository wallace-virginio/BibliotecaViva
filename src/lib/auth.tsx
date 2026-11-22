import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { USER } from "@/data/content";
import { isNative } from "./native";
import { PUBLIC_SITE_URL } from "./platform";
import { getSupabase, NATIVE_REDIRECT, supabaseConfigured } from "./supabase";
import { MIN_PASSWORD, PRIVACY_VERSION, TERMS_VERSION } from "./legal";
import { getState } from "./store";
import { startSync, stopSync } from "./sync";

export type AccountType = "leitor" | "biblioteca";
export type Profile = { id: string; full_name: string | null; account_type: AccountType; developer_mode: boolean; avatar_url: string | null };
export type OAuthProvider = "google" | "apple";

type AuthContextValue = {
  /** false = sem chaves do Supabase: o app roda em modo demonstração. */
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  displayName: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (p: { email: string; password: string; fullName: string; accountType: AccountType }) => Promise<{ needsConfirmation: boolean }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** true quando a conta ainda não aceitou a versão atual dos Termos/Política (ex.: entrou com Google/Apple). */
  needsConsent: boolean;
  acceptConsent: () => Promise<void>;
  /** LGPD art. 18: acesso/portabilidade — todos os dados da conta em JSON. */
  exportMyData: () => Promise<Blob>;
  /** LGPD art. 18, VI: exclui a conta e todos os dados associados. */
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Mensagens do Supabase traduzidas para o usuário. */
export function authErrorMessage(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar — enviamos um link para a sua caixa de entrada.";
  if (/already registered|already been registered/i.test(msg)) return "Não foi possível criar a conta com este e-mail. Se você já tem cadastro, entre ou recupere a senha.";
  if (/password should be at least|weak password|password is too short/i.test(msg)) return `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`;
  if (/pwned|leaked|compromised/i.test(msg)) return "Esta senha apareceu em vazamentos de dados. Escolha outra.";
  if (/for security purposes|rate limit/i.test(msg)) return "Muitas tentativas seguidas. Aguarde alguns segundos e tente de novo.";
  if (/provider is not enabled|unsupported provider/i.test(msg)) return "Este método de login ainda não foi ativado no painel do Supabase.";
  if (/not authorized/i.test(msg) && /email/i.test(msg))
    return "Não foi possível enviar o e-mail de confirmação para este endereço. (Admin: configure um SMTP próprio no Supabase.)";
  if (/unable to validate email|invalid email|email address .* is invalid|invalid format/i.test(msg)) return "Informe um e-mail válido.";
  if (/error sending (confirmation|recovery|magic link)? ?email/i.test(msg)) return "Não conseguimos enviar o e-mail agora. Tente novamente em alguns minutos.";
  if (/same.*password|different from the old/i.test(msg)) return "A nova senha precisa ser diferente da anterior.";
  if (/failed to fetch|network/i.test(msg)) return "Sem conexão com o servidor. Verifique sua internet.";
  return msg;
}

/**
 * Endereço para onde os links dos e-mails (confirmar cadastro, redefinir senha) levam.
 * No app aponta para o site público: o e-mail pode ser aberto em outro aparelho ou num leitor de e-mail que
 * não abre links "org.bibliotecaviva.app://", e o endereço interno do app (https://localhost) não existe fora dele.
 * Depois de confirmar no site, a pessoa entra normalmente no app com e-mail e senha.
 */
function redirectUrl(path: string) {
  return `${isNative() ? PUBLIC_SITE_URL : window.location.origin}${path}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [needsConsent, setNeedsConsent] = useState(false);

  const checkConsent = useCallback(async (user: User | null) => {
    const sb = getSupabase();
    if (!sb || !user) return setNeedsConsent(false);
    const { data, error } = await sb.from("consents").select("document, version").eq("user_id", user.id);
    if (error) return setNeedsConsent(false); // tabela ainda não criada: não bloqueia o app
    const has = (doc: string, v: string) => (data ?? []).some((c) => c.document === doc && c.version === v);
    setNeedsConsent(!(has("termos", TERMS_VERSION) && has("privacidade", PRIVACY_VERSION)));
  }, []);

  const loadProfile = useCallback(async (user: User | null) => {
    const sb = getSupabase();
    if (!sb || !user) return setProfile(null);
    const { data } = await sb.from("profiles").select("id, full_name, account_type, developer_mode, avatar_url").eq("id", user.id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setLoading(false);
      if (event === "SIGNED_OUT") {
        stopSync({ clearLocal: true });
        setProfile(null);
      }
    });

    // App nativo: o login social volta por deep link (org.bibliotecaviva.app://login-callback?code=…)
    let removeListener: (() => void) | undefined;
    if (isNative()) {
      const handleDeepLink = async (url: string | undefined) => {
        if (!url?.startsWith(NATIVE_REDIRECT)) return;
        const params = new URL(url).searchParams;
        const code = params.get("code");
        const { Browser } = await import("@capacitor/browser");
        Browser.close().catch(() => {});
        if (!code) {
          console.warn("[auth] login social sem código:", params.get("error_description") ?? params.get("error") ?? url);
          return;
        }
        const { error } = await sb.auth.exchangeCodeForSession(code);
        if (error) console.warn("[auth] não foi possível concluir o login social:", error.message);
      };
      import("@capacitor/app").then(async ({ App }) => {
        const h = await App.addListener("appUrlOpen", ({ url }) => void handleDeepLink(url));
        removeListener = () => h.remove();
        // app aberto "do zero" pelo link de volta do login (o evento appUrlOpen já passou)
        const launch = await App.getLaunchUrl().catch(() => undefined);
        await handleDeepLink(launch?.url);
      });
    }

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      removeListener?.();
    };
  }, []);

  // Perfil + sincronização dos dados do usuário sempre que a conta muda.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId || !session) return;
    loadProfile(session.user);
    checkConsent(session.user);
    startSync(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const value = useMemo<AuthContextValue>(() => {
    const sb = getSupabase();
    const need = () => {
      if (!sb) throw new Error("Login indisponível: configure o Supabase no arquivo .env.local.");
      return sb;
    };
    const user = session?.user ?? null;
    const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
    const displayName = (profile?.full_name || meta.full_name || meta.name || user?.email?.split("@")[0] || (supabaseConfigured ? "" : USER.name)).split(" ")[0];

    return {
      configured: supabaseConfigured,
      loading,
      session,
      user,
      profile,
      displayName,
      async signIn(email, password) {
        const { error } = await need().auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp({ email, password, fullName, accountType }) {
        const { data, error } = await need().auth.signUp({
          email,
          password,
          options: {
            // o aceite (marcado no formulário) vai nos metadados; o gatilho do banco grava a prova em `consents`
            data: {
              full_name: fullName,
              account_type: accountType,
              terms_version: TERMS_VERSION,
              privacy_version: PRIVACY_VERSION,
              consent_ua: navigator.userAgent.slice(0, 250),
            },
            emailRedirectTo: redirectUrl("/auth/callback"),
          },
        });
        if (error) throw error;
        // E-mail já cadastrado: o Supabase devolve um usuário "vazio". Mostramos a mesma tela de confirmação
        // de um cadastro novo, para que ninguém descubra quais e-mails têm conta (enumeração).
        return { needsConfirmation: !data.session };
      },
      async signInWithProvider(provider) {
        const client = need();
        if (isNative()) {
          const { data, error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true } });
          if (error) throw error;
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: data.url, presentationStyle: "popover" });
          return;
        }
        const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo: redirectUrl("/auth/callback") } });
        if (error) throw error;
      },
      async sendPasswordReset(email) {
        const { error } = await need().auth.resetPasswordForEmail(email, { redirectTo: redirectUrl("/redefinir-senha") });
        if (error) throw error;
      },
      async updatePassword(password) {
        const { error } = await need().auth.updateUser({ password });
        if (error) throw error;
      },
      async signOut() {
        if (sb) await sb.auth.signOut();
        stopSync({ clearLocal: true });
        setProfile(null);
      },
      refreshProfile: () => loadProfile(user),
      needsConsent,
      async acceptConsent() {
        const client = need();
        if (!user) return;
        const ua = navigator.userAgent.slice(0, 250);
        const { error } = await client.from("consents").insert([
          { user_id: user.id, document: "termos", version: TERMS_VERSION, user_agent: ua },
          { user_id: user.id, document: "privacidade", version: PRIVACY_VERSION, user_agent: ua },
          { user_id: user.id, document: "idade", version: TERMS_VERSION, user_agent: ua },
        ]);
        if (error) throw error;
        setNeedsConsent(false);
      },
      async exportMyData() {
        const client = need();
        if (!user) throw new Error("Entre na sua conta para exportar os dados.");
        const [p, st, c] = await Promise.all([
          client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          client.from("user_state").select("*").eq("user_id", user.id).maybeSingle(),
          client.from("consents").select("document, version, accepted_at, user_agent").eq("user_id", user.id),
        ]);
        const payload = {
          exportado_em: new Date().toISOString(),
          conta: {
            id: user.id,
            email: user.email,
            criada_em: user.created_at,
            ultimo_acesso: user.last_sign_in_at,
            provedores: user.app_metadata?.providers ?? [],
            metadados: user.user_metadata,
          },
          perfil: p.data,
          dados_do_app: st.data?.state ?? getState(),
          consentimentos: c.data ?? [],
        };
        return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      },
      async deleteAccount() {
        const client = need();
        const { error } = await client.rpc("delete_my_account");
        if (error) throw error;
        stopSync({ clearLocal: true });
        await client.auth.signOut().catch(() => {});
        setProfile(null);
      },
    };
  }, [session, profile, loading, loadProfile, needsConsent]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
