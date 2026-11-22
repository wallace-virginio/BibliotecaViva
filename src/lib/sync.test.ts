import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Sincronização com o Supabase: o mais importante é nunca apagar os dados da nuvem
 * com um estado vazio quando a leitura falha (ex.: sem internet).
 */
const upsert = vi.fn(async () => ({ error: null }));
let readError: unknown = null;
let remoteState: unknown = null;

vi.mock("./supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            table === "user_state"
              ? { data: readError ? null : remoteState ? { state: remoteState } : null, error: readError }
              : { data: { developer_mode: false }, error: null },
        }),
      }),
      upsert,
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  }),
}));

describe("startSync", () => {
  beforeEach(async () => {
    vi.resetModules();
    upsert.mockClear();
    readError = null;
    remoteState = null;
  });

  it("se não conseguir ler os dados da conta, não sobrescreve a nuvem", async () => {
    readError = { message: "Failed to fetch" };
    const { startSync, stopSync } = await import("./sync");
    await startSync("user-1");
    expect(upsert).not.toHaveBeenCalled();
    stopSync({ clearLocal: false });
  });

  it("carrega os dados da conta sem misturar o que foi feito no aparelho sem login", async () => {
    const { actions, getState } = await import("./store");
    actions.toggleFavorite({ id: "OL-convidado", title: "Do aparelho" });
    remoteState = { favorites: [{ id: "OL-conta", title: "Da conta", savedAt: 1 }] };
    const { startSync, stopSync } = await import("./sync");
    await startSync("user-2");
    expect(getState().favorites.map((f) => f.id)).toEqual(["OL-conta"]);
    expect(upsert).toHaveBeenCalledTimes(1);
    stopSync({ clearLocal: false });
  });
});
