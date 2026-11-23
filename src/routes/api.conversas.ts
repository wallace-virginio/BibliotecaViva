import { createFileRoute } from "@tanstack/react-router";
import { sanitizeStored, seal, titleFor, unseal } from "@/lib/server/conversations";
import { authorize, convCors, convJson, isUuid } from "@/lib/server/conversationsAuth";

/**
 * Histórico do assistente — só a pessoa logada, só as conversas dela (RLS + criptografia por usuário).
 *   GET  /api/conversas            → { conversas: [{ id, titulo, mensagens, atualizada }] }
 *   POST /api/conversas  { id?, messages }  → { id }   (cria ou atualiza)
 */
export const Route = createFileRoute("/api/conversas")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: convCors(request) }),

      GET: async ({ request }) => {
        const ctx = await authorize(request);
        if (ctx instanceof Response) return ctx;
        const { data, error } = await ctx.sb
          .from("assistant_conversations")
          .select("id, title_enc, message_count, updated_at")
          .order("updated_at", { ascending: false })
          .limit(50);
        if (error) return convJson(request, { error: "não foi possível carregar o histórico" }, 502);
        const conversas = await Promise.all(
          data.map(async (r) => ({
            id: r.id as string,
            titulo: await unseal<string>(ctx.key, r.title_enc as string, ctx.userId).catch(() => "Conversa"),
            mensagens: r.message_count as number,
            atualizada: r.updated_at as string,
          })),
        );
        return convJson(request, { conversas });
      },

      POST: async ({ request }) => {
        const ctx = await authorize(request);
        if (ctx instanceof Response) return ctx;
        let body: { id?: unknown; messages?: unknown };
        try {
          body = await request.json();
        } catch {
          return convJson(request, { error: "pedido inválido" }, 400);
        }
        const messages = sanitizeStored(body.messages);
        if (!messages.length) return convJson(request, { error: "conversa vazia" }, 400);
        const row = {
          title_enc: await seal(ctx.key, titleFor(messages), ctx.userId),
          messages_enc: await seal(ctx.key, messages, ctx.userId),
          message_count: messages.length,
          updated_at: new Date().toISOString(),
        };
        const id = typeof body.id === "string" && isUuid(body.id) ? body.id : null;
        const q = id
          ? ctx.sb.from("assistant_conversations").update(row).eq("id", id).select("id").maybeSingle()
          : ctx.sb.from("assistant_conversations").insert({ ...row, user_id: ctx.userId }).select("id").single();
        const { data, error } = await q;
        if (error || !data) return convJson(request, { error: "não foi possível salvar" }, 502);
        return convJson(request, { id: data.id });
      },
    },
  },
});
