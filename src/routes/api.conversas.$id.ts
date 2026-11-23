import { createFileRoute } from "@tanstack/react-router";
import { unseal, type StoredMessage } from "@/lib/server/conversations";
import { authorize, convCors, convJson, isUuid } from "@/lib/server/conversationsAuth";

/**
 *   GET    /api/conversas/:id  → { id, messages }   (abre e descriptografa uma conversa da própria pessoa)
 *   DELETE /api/conversas/:id  → { ok: true }       (apaga de vez)
 */
export const Route = createFileRoute("/api/conversas/$id")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: convCors(request) }),

      GET: async ({ request, params }) => {
        if (!isUuid(params.id)) return convJson(request, { error: "não encontrada" }, 404);
        const ctx = await authorize(request);
        if (ctx instanceof Response) return ctx;
        const { data, error } = await ctx.sb.from("assistant_conversations").select("id, messages_enc").eq("id", params.id).maybeSingle();
        if (error) return convJson(request, { error: "não foi possível abrir" }, 502);
        if (!data) return convJson(request, { error: "não encontrada" }, 404); // de outra pessoa = invisível (RLS)
        try {
          const messages = await unseal<StoredMessage[]>(ctx.key, data.messages_enc as string, ctx.userId);
          return convJson(request, { id: data.id, messages });
        } catch {
          return convJson(request, { error: "não foi possível abrir" }, 500);
        }
      },

      DELETE: async ({ request, params }) => {
        if (!isUuid(params.id)) return convJson(request, { error: "não encontrada" }, 404);
        const ctx = await authorize(request);
        if (ctx instanceof Response) return ctx;
        const { error } = await ctx.sb.from("assistant_conversations").delete().eq("id", params.id);
        if (error) return convJson(request, { error: "não foi possível apagar" }, 502);
        return convJson(request, { ok: true });
      },
    },
  },
});
