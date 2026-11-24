import { createFileRoute } from "@tanstack/react-router";
import { EmDesenvolvimento } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import { Heart, MessageCircle, Share2, UserPlus } from "lucide-react";
import { actions, useStore } from "@/lib/store";

/** Identificador estável de um post (quem + o quê), para a curtida continuar salva. */
const postId = (f: { who: string; what: string; target: string }) => `${f.who}|${f.what}|${f.target}`;
import { DashHeader } from "@/components/dashboard";
import { Button, Card } from "@/components/ui";
import { STUDY_GROUPS } from "@/data/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade — Biblioteca Viva" }, { name: "description", content: "Pessoas que você segue, grupos e atividades." }] }),
  // função ainda sem dados reais: tela "Em desenvolvimento" com o Ori (ligar em src/lib/features.ts)

  component: FEATURES.comunidade ? Comunidade : () => <EmDesenvolvimento feature="comunidade" inShell />,
});

const FEED = [
  { who: "Marina Alves", what: "terminou de ler", target: "Dom Casmurro", note: "Capitu é inocente e eu não aceito discussão 😅", likes: 24, comments: 8, when: "há 2 h" },
  { who: "Kenji Watanabe", what: "publicou o conector", target: "provider-koha v2.1", note: "Agora com suporte a reservas de salas!", likes: 61, comments: 12, when: "há 5 h" },
  { who: "Júlia Santos", what: "avaliou", target: "Biblioteca Mário de Andrade ★★★★★", note: "Melhor lugar para estudar à noite em SP.", likes: 17, comments: 3, when: "ontem" },
  { who: "Pedro Henrique", what: "criou o grupo", target: "Python do zero", note: "Encontros toda terça, 20h. Bora?", likes: 33, comments: 15, when: "ontem" },
];

const PEOPLE = ["Ana Ribeiro", "Lucas Mendes", "Sofía García", "Amara Okafor"];

function Comunidade() {
  // curtidas e "seguir" salvos de verdade (aparelho + conta)
  const liked = useStore((s) => s.community.liked);
  const following = useStore((s) => s.community.following);
  return (
    <>
      <DashHeader title="Comunidade" description="O que as pessoas que você segue estão lendo e fazendo." />
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card className="p-4">
            <textarea placeholder="Compartilhe uma leitura, uma dica ou uma pergunta…" rows={2} className="w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground" />
            <div className="flex justify-end"><Button size="sm">Publicar</Button></div>
          </Card>
          {FEED.map((f, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span className={cn("grid size-10 place-items-center rounded-full text-sm font-semibold text-on-image", `bg-cover-${(i % 8) + 1}`)}>{f.who.split(" ").map((n) => n[0]).join("")}</span>
                <div className="min-w-0 text-sm">
                  <p><strong>{f.who}</strong> <span className="text-muted-foreground">{f.what}</span> <strong>{f.target}</strong></p>
                  <p className="text-xs text-muted-foreground">{f.when}</p>
                </div>
              </div>
              <p className="mt-3 text-[15px]">{f.note}</p>
              <div className="mt-4 flex gap-1 text-sm text-muted-foreground">
                <button onClick={() => actions.toggleLike(postId(f))} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 hover:bg-surface-2", liked.includes(postId(f)) && "text-danger")}>
                  <Heart className={cn("size-4", liked.includes(postId(f)) && "fill-current")} /> {f.likes + (liked.includes(postId(f)) ? 1 : 0)}
                </button>
                <button className="flex h-9 items-center gap-1.5 rounded-full px-3 hover:bg-surface-2"><MessageCircle className="size-4" /> {f.comments}</button>
                <button className="flex h-9 items-center gap-1.5 rounded-full px-3 hover:bg-surface-2"><Share2 className="size-4" /></button>
              </div>
            </Card>
          ))}
        </div>
        <aside className="space-y-5">
          <Card className="p-5">
            <p className="font-semibold">Quem seguir</p>
            <ul className="mt-4 space-y-3">
              {PEOPLE.map((p) => (
                <li key={p} className="flex items-center justify-between gap-2 text-sm">
                  <span>{p}</span>
                  <Button size="sm" variant={following.includes(p) ? "soft" : "outline"} onClick={() => actions.toggleFollowMember(p)}>
                    {following.includes(p) ? "Seguindo" : <><UserPlus className="size-3.5" /> Seguir</>}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <p className="font-semibold">Seus grupos</p>
            <ul className="mt-3 space-y-2 text-sm">
              {STUDY_GROUPS.slice(0, 3).map((g) => (
                <li key={g.name} className="flex justify-between gap-2"><span className="truncate">{g.name}</span><span className="shrink-0 text-muted-foreground">{g.next}</span></li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
