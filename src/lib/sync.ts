/**
 * Sincroniza o store local com o Supabase enquanto o usuário está logado.
 *  - Tabela `user_state` (1 linha por usuário, JSON): favoritos, reservas, histórico, progresso de leitura…
 *  - Tabela `profiles`: espelha `developer_mode`.
 * Estratégia: ao entrar, carrega os dados da conta (sem misturar o que foi feito no aparelho sem login);
 * depois envia as mudanças com debounce.
 */
import { actions, emptyState, getState, subscribeStore, type State } from "./store";
import { getSupabase } from "./supabase";

let currentUser: string | null = null;
let unsubscribe: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let lastDevMode: boolean | undefined;

async function push(userId: string) {
  const sb = getSupabase();
  if (!sb || currentUser !== userId) return;
  const state = getState();
  await sb.from("user_state").upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (state.developerMode !== lastDevMode) {
    lastDevMode = state.developerMode;
    await sb.from("profiles").update({ developer_mode: state.developerMode, updated_at: new Date().toISOString() }).eq("id", userId);
  }
}

export async function startSync(userId: string) {
  const sb = getSupabase();
  if (!sb || currentUser === userId) return;
  stopSync({ clearLocal: false });
  currentUser = userId;

  const [{ data: row, error }, { data: profile }] = await Promise.all([
    sb.from("user_state").select("state").eq("user_id", userId).maybeSingle(),
    sb.from("profiles").select("developer_mode").eq("id", userId).maybeSingle(),
  ]);
  if (currentUser !== userId) return;
  // Falha ao ler (ex.: sem internet): não sobrescreve a nuvem com um estado vazio.
  if (error) {
    currentUser = null;
    return;
  }

  lastDevMode = profile?.developer_mode ?? undefined;
  // Privacidade em aparelho compartilhado: o que foi feito sem login NÃO é misturado à conta.
  // A conta carrega só os próprios dados (e as preferências de leitura deste aparelho).
  const local = getState();
  const remote = (row?.state as Partial<State>) ?? null;
  actions.replace(
    remote
      ? { ...emptyState, ...remote, readerPrefs: local.readerPrefs, developerMode: lastDevMode ?? !!remote.developerMode }
      : { ...emptyState, readerPrefs: local.readerPrefs, developerMode: lastDevMode ?? false },
  );
  await push(userId).catch(() => {});

  unsubscribe = subscribeStore(() => {
    clearTimeout(timer);
    timer = setTimeout(() => push(userId).catch(() => {}), 1200);
  });
}

export function stopSync({ clearLocal }: { clearLocal: boolean }) {
  clearTimeout(timer);
  unsubscribe?.();
  unsubscribe = null;
  const wasLogged = currentUser !== null;
  currentUser = null;
  lastDevMode = undefined;
  // Ao sair, os dados da conta não ficam no aparelho.
  if (clearLocal && wasLogged) actions.reset();
}
