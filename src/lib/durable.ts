/**
 * Cópia de segurança nativa dos dados que a pessoa não pode perder no app.
 *
 * O localStorage do WebView pode ser apagado pelo Android ("limpar cache", falta de espaço). O app continua
 * lendo e gravando no localStorage (síncrono, como sempre), mas cada gravação dessas chaves também vai para o
 * armazenamento nativo (Capacitor Preferences = SharedPreferences / UserDefaults). Ao abrir, se o localStorage
 * estiver vazio e a cópia nativa existir, ela é restaurada e a tela recarrega uma vez.
 *
 * Fica de fora de propósito a localização: a Política de Privacidade promete que ela vale só durante a sessão.
 */
import { isNative } from "./native";

export const DURABLE_KEYS = ["bv-state-v1", "bv-auth", "bv-theme", "bv-a11y"] as const;
const isDurable = (k: string): boolean => (DURABLE_KEYS as readonly string[]).includes(k);

/** Restaura do armazenamento nativo o que sumiu do localStorage. Devolve true se restaurou algo. */
export async function restoreDurable(): Promise<boolean> {
  if (!isNative()) return false;
  const { Preferences } = await import("@capacitor/preferences");
  let restored = false;
  for (const key of DURABLE_KEYS) {
    if (localStorage.getItem(key) !== null) continue;
    const { value } = await Preferences.get({ key });
    if (value !== null) {
      localStorage.setItem(key, value);
      restored = true;
    }
  }
  return restored;
}

/** Passa a espelhar no armazenamento nativo toda gravação/remoção das chaves importantes. */
export async function mirrorDurable() {
  if (!isNative()) return;
  const { Preferences } = await import("@capacitor/preferences");
  // estado atual (inclusive o que foi gravado antes deste espelho começar)
  for (const key of DURABLE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) Preferences.set({ key, value }).catch(() => {});
  }
  const proto = Storage.prototype;
  const setItem = proto.setItem;
  const removeItem = proto.removeItem;
  proto.setItem = function (key: string, value: string) {
    setItem.call(this, key, value);
    if (this === window.localStorage && isDurable(key)) Preferences.set({ key, value }).catch(() => {});
  };
  proto.removeItem = function (key: string) {
    removeItem.call(this, key);
    if (this === window.localStorage && isDurable(key)) Preferences.remove({ key }).catch(() => {});
  };
}
