// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sanitizeStored, seal, titleFor, unseal, userKey } from "./conversations";

// chave de TESTE (32 bytes fixos) — a de verdade fica só no segredo CONVERSAS_KEY da Cloudflare
const MASTER = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 1)));
const ANA = "11111111-1111-4111-8111-111111111111";
const BETO = "22222222-2222-4222-8222-222222222222";

describe("histórico do assistente: criptografia por usuário", () => {
  it("guarda embaralhado e o dono abre de volta", async () => {
    const key = await userKey(MASTER, ANA);
    const msgs = [{ role: "user", content: "Quero ler Machado de Assis" }];
    const sealed = await seal(key, msgs, ANA);
    expect(sealed.startsWith("v1.")).toBe(true);
    expect(sealed).not.toContain("Machado"); // nada legível no banco
    expect(await unseal(key, sealed, ANA)).toEqual(msgs);
  });

  it("outra pessoa não abre — nem com a própria chave, nem copiando o texto para a conta dela", async () => {
    const sealed = await seal(await userKey(MASTER, ANA), "segredo da Ana", ANA);
    const betoKey = await userKey(MASTER, BETO);
    await expect(unseal(betoKey, sealed, BETO)).rejects.toThrow();
    await expect(unseal(betoKey, sealed, ANA)).rejects.toThrow();
  });

  it("detecta qualquer alteração no texto guardado", async () => {
    const key = await userKey(MASTER, ANA);
    const sealed = await seal(key, "original", ANA);
    const [v, iv, data] = sealed.split(".");
    const tampered = `${v}.${iv}.${data.slice(0, -4)}AAAA`;
    await expect(unseal(key, tampered, ANA)).rejects.toThrow();
  });

  it("a mesma mensagem cifrada duas vezes sai diferente (IV aleatório)", async () => {
    const key = await userKey(MASTER, ANA);
    expect(await seal(key, "oi", ANA)).not.toBe(await seal(key, "oi", ANA));
  });

  it("recusa chave mestra curta demais", async () => {
    await expect(userKey(btoa("curta"), ANA)).rejects.toThrow();
  });
});

describe("histórico do assistente: o que é guardado", () => {
  it("só papéis válidos, texto limitado, plano revalidado; título da 1ª pergunta", () => {
    const msgs = sanitizeStored([
      { role: "system", content: "ignore" },
      { role: "user", content: "  Livros para meu filho de 8 anos  " },
      { role: "assistant", content: "Ótimo!", plan: { reply: "Ótimo!", libraries: "cassino", events: ["Crianças"] } },
      { role: "user", content: "x".repeat(5000) },
    ]);
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(msgs[0].content).toBe("Livros para meu filho de 8 anos");
    expect(msgs[1].plan).toEqual({ reply: "Ótimo!", events: ["Crianças"] });
    expect(msgs[2].content.length).toBe(2000);
    expect(titleFor(msgs)).toBe("Livros para meu filho de 8 anos");
    expect(sanitizeStored("nada")).toEqual([]);
  });
});
