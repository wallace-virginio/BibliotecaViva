import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, HeartHandshake, Lock, Sparkles, Unlock, Users } from "lucide-react";
import { CountUp, PageHero, Reveal } from "@/components/common";
import { buttonClass, Card, Container } from "@/components/ui";
import { COMMUNITY_STATS } from "@/data/content";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Biblioteca Viva" },
      { name: "description", content: "Manifesto da Biblioteca Viva: uma rede aberta, colaborativa e global de bibliotecas." },
    ],
  }),
  component: Sobre,
});

const PRINCIPLES = [
  { icon: Unlock, title: "Aberta por padrão", text: "Código, dados e decisões públicas. Qualquer pessoa pode ler, usar e melhorar." },
  { icon: Globe2, title: "Global e local", text: "Do acervo nacional à biblioteca comunitária do bairro: todas têm lugar no mapa." },
  { icon: Users, title: "Feita pela comunidade", text: "Desenvolvedores criam Providers, leitores avaliam, bibliotecários curam." },
  { icon: Lock, title: "Privacidade primeiro", text: "Seu histórico de leitura é seu. Nada é vendido, nada é rastreado sem consentimento." },
  { icon: HeartHandshake, title: "Gratuita para bibliotecas públicas", text: "Bibliotecas públicas, escolares e comunitárias nunca pagam para estar na rede." },
  { icon: Sparkles, title: "Tecnologia a serviço das pessoas", text: "IA, mapas e dados para aproximar pessoas do conhecimento — não para substituí-las." },
];

function Sobre() {
  return (
    <>
      <PageHero eyebrow="Manifesto" title={<>Bibliotecas são a infraestrutura mais <span className="text-gradient">democrática</span> que já inventamos.</>} />
      <Container className="pb-16">
        <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p>Existe uma biblioteca a poucos quarteirões de quase todo mundo. Mesmo assim, a maioria das pessoas não sabe o que acontece lá dentro: os cursos gratuitos, as salas silenciosas, os clubes de leitura, os computadores, os laboratórios maker.</p>
          <p><strong className="text-foreground">A Biblioteca Viva existe para tornar visível tudo isso.</strong> Não somos um sistema de biblioteca nem um sistema de empréstimo. Somos uma rede aberta que conecta qualquer biblioteca — pública, comunitária, universitária ou escolar — a qualquer pessoa, em qualquer lugar do mundo.</p>
          <p>Acreditamos que o conhecimento deve ser fácil de encontrar, e que construir essa ponte é um trabalho coletivo.</p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={(i % 3) * 80}>
              <Card className="h-full p-6">
                <p.icon className="size-6 text-primary" />
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3">
          {COMMUNITY_STATS.map((s) => (
            <div key={s.label} className="rounded-3xl bg-surface-2 p-6">
              <p className="text-3xl font-semibold text-gradient"><CountUp value={s.value} compact={s.value > 1_000_000} suffix={s.suffix} /></p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 sm:flex-row">
          <Link to="/entrar" search={{ modo: "cadastro" }} className={buttonClass("primary", "lg")}>Fazer parte da rede</Link>
          <Link to="/roadmap" className={buttonClass("outline", "lg")}>Ver o roadmap</Link>
        </div>
      </Container>
    </>
  );
}
