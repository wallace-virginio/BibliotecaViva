import { Link } from "@tanstack/react-router";
import { BookOpenText, LibraryBig, Map, Sparkles } from "lucide-react";
import type { FeatureKey } from "@/lib/features";
import { cn } from "@/lib/utils";

/** O que cada função vai fazer quando ficar pronta — dito com honestidade, sem prometer data. */
const INFO: Record<FeatureKey, { title: string; text: string; items: string[] }> = {
  eventos: {
    title: "Agenda de eventos",
    text: "Estamos conectando a agenda real das bibliotecas. Logo você vai poder ver e se inscrever em:",
    items: ["Clubes de leitura", "Oficinas e cursos gratuitos", "Contação de histórias para crianças", "Exposições e encontros com autores"],
  },
  salas: {
    title: "Salas e computadores",
    text: "Estamos ligando o app aos sistemas de reserva das bibliotecas. Logo você vai poder:",
    items: ["Ver salas de estudo livres agora", "Reservar computadores com internet", "Escolher horário e receber lembrete"],
  },
  comunidade: {
    title: "Comunidade de leitores",
    text: "Um espaço para quem gosta de ler trocar ideias. Logo você vai poder:",
    items: ["Compartilhar o que está lendo", "Participar de grupos de estudo", "Seguir outros leitores da sua cidade"],
  },
  reservas: {
    title: "Reserva de livros",
    text: "Estamos conectando o acervo físico das bibliotecas. Logo você vai poder:",
    items: ["Ver se o livro está disponível perto de você", "Saber o andar e a estante", "Reservar e retirar no balcão"],
  },
  painelBiblioteca: {
    title: "Painel da biblioteca",
    text: "Um painel para a equipe da biblioteca cuidar do que aparece no app:",
    items: ["Horários, salas e eventos", "Acervo e reservas", "Avisos para os leitores"],
  },
  desenvolvedor: {
    title: "Área do desenvolvedor",
    text: "Para quem quer conectar a biblioteca da sua cidade ao app:",
    items: ["SDKs e documentação", "Chaves de API", "Conectores para sistemas de bibliotecas"],
  },
};

/** Versão pequena, para o meio de uma página (ex.: bloco de agenda na página da biblioteca). */
export function EmDesenvolvimentoNota({ feature, className }: { feature: FeatureKey; className?: string }) {
  const info = INFO[feature];
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-dashed bg-surface p-3", className)}>
      <img src="/ori/ori-128.webp" alt="" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 text-left">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">Em desenvolvimento</p>
        <p className="text-sm text-muted-foreground">
          {info.title}: {info.items.slice(0, 2).join(" · ").toLowerCase()} em breve por aqui.
        </p>
      </div>
    </div>
  );
}

/**
 * Tela "Em desenvolvimento" com o Ori — no lugar de funções que ainda não têm dados reais.
 * `inShell`: dentro da área logada (/app), que já tem o próprio espaçamento.
 */
export function EmDesenvolvimento({ feature, inShell = false }: { feature: FeatureKey; inShell?: boolean }) {
  const info = INFO[feature];
  return (
    <div className={cn("mx-auto flex max-w-lg flex-col items-center px-4 text-center", inShell ? "py-6" : "pt-28 pb-24 lg:pt-32")}>
      <img
        src="/ori/ori-256.webp"
        srcSet="/ori/ori-256.webp 1x, /ori/ori-512.webp 2x"
        alt="Ori, o mascote da Biblioteca Viva"
        width={144}
        height={144}
        className="ori-float size-36 rounded-full object-cover shadow-elevated"
      />
      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
        <Sparkles className="size-3.5" /> Em desenvolvimento
      </p>
      <h1 className="mt-3 text-3xl md:text-4xl">{info.title}</h1>
      <p className="mt-3 text-muted-foreground">{info.text}</p>
      <ul className="mt-4 w-full space-y-2 text-left">
        {info.items.map((it) => (
          <li key={it} className="flex items-center gap-2.5 rounded-xl border bg-surface px-4 py-3 text-sm">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" /> {it}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm font-medium">Enquanto isso, já dá para:</p>
      <div className="mt-3 grid w-full grid-cols-2 gap-2">
        {[
          { to: "/mapa", label: "Achar bibliotecas", icon: Map },
          { to: "/acervo", label: "Ler livros grátis", icon: BookOpenText, search: { ebook: true } },
          { to: "/assistente", label: "Falar com o Ori", icon: Sparkles },
          { to: "/app/livros", label: "Montar sua estante", icon: LibraryBig },
        ].map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            search={"search" in rest ? rest.search : undefined}
            className="flex min-h-12 items-center gap-2 rounded-xl border bg-surface px-3 py-2.5 text-left text-sm font-medium hover:border-primary active:bg-surface-2"
          >
            <Icon className="size-4 shrink-0 text-primary" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
