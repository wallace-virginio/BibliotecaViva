import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarDays, Check, DoorOpen, MapPin, Sparkles, Star, Users } from "lucide-react";
import { useState } from "react";
import { CountUp, EventCard, Reveal } from "@/components/common";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MapExplorer } from "@/components/map/MapExplorer";
import { Badge, buttonClass, Card, Container, SectionHeader } from "@/components/ui";
import { COMMUNITY_STATS, EVENTS, FUTURE_FEATURES, ROADMAP, STATUS_TONE } from "@/data/content";
import { FEATURED_LIBRARIES } from "@/data/libraries";
import { CurationGrid } from "@/components/CurationGrid";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Biblioteca Viva — Conectando pessoas ao conhecimento" },
      {
        name: "description",
        content:
          "Descubra bibliotecas, participe de eventos, encontre espaços para estudar e ajude a construir a maior rede aberta de bibliotecas do mundo.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <MapSection />
      <SearchSection />
      <Audiences />
      <Discover />
      <Community />
      <WeekEvents />
      <RoadmapPreview />
      <Future />
      <FinalCta />
    </>
  );
}

/* ============ HERO ============ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-14 md:pt-40 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <Container className="relative grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-fade-up">
          <Link to="/roadmap" className="mb-6 inline-flex items-center gap-2 rounded-full border glass py-1 pr-3 pl-1 text-xs font-medium shadow-soft">
            <span className="rounded-full bg-gradient-primary px-2 py-0.5 text-primary-foreground">Novo</span>
            Conheça a Biblioteca Viva AI <ArrowRight className="size-3" />
          </Link>
          <h1 className="text-[2.6rem] leading-[1.05] sm:text-5xl font-semibold tracking-tight text-balance md:text-6xl lg:text-7xl">
            Conectando pessoas ao <span className="text-gradient">conhecimento.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground md:text-xl">
            Descubra bibliotecas, participe de eventos, encontre espaços para estudar e ajude a construir a maior rede
            aberta de bibliotecas do mundo.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/mapa" className={buttonClass("primary", "lg")}>
              <MapPin className="size-5" /> Encontrar Biblioteca
            </Link>
            <Link to="/entrar" search={{ modo: "biblioteca" }} className={buttonClass("outline", "lg")}>
              <Building2 className="size-5" /> Quero cadastrar minha biblioteca
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {["bg-cover-1", "bg-cover-2", "bg-cover-3", "bg-cover-4"].map((c, i) => (
                <span key={c} className={cn("grid size-8 place-items-center rounded-full border-2 border-background text-[11px] font-semibold text-on-image", c)}>
                  {["AR", "KW", "LM", "SG"][i]}
                </span>
              ))}
            </div>
            <span>
              <strong className="text-foreground">12.480 bibliotecas</strong> em 64 países já fazem parte.
            </span>
          </div>
        </div>
        <HeroIllustration />
      </Container>
    </section>
  );
}

function HeroIllustration() {
  const lib = FEATURED_LIBRARIES[1];
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[520px] animate-fade-in [animation-delay:200ms] md:block">
      {/* globo estilizado */}
      <div className="absolute inset-[8%] rounded-full bg-gradient-primary opacity-15 blur-3xl" />
      <svg viewBox="0 0 400 400" className="absolute inset-[6%] text-primary" fill="none" aria-hidden>
        <defs>
          <radialGradient id="g1" cx="35%" cy="30%">
            <stop offset="0" stopColor="currentColor" stopOpacity=".25" />
            <stop offset="1" stopColor="currentColor" stopOpacity=".03" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="170" fill="url(#g1)" stroke="currentColor" strokeOpacity=".25" />
        {[40, 80, 120, 160].map((r) => (
          <ellipse key={r} cx="200" cy="200" rx={r} ry="170" stroke="currentColor" strokeOpacity=".14" />
        ))}
        {[-110, -55, 0, 55, 110].map((y) => (
          <ellipse key={y} cx="200" cy={200 + y} rx={Math.sqrt(170 * 170 - y * y)} ry="10" stroke="currentColor" strokeOpacity=".14" />
        ))}
        {[
          [140, 150], [250, 120], [290, 220], [180, 260], [110, 230], [230, 300], [200, 180],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="14" fill="currentColor" opacity=".12">
              <animate attributeName="r" values="6;18;6" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r="5" fill="currentColor" />
          </g>
        ))}
        <path d="M140 150 Q200 100 250 120 M250 120 Q300 160 290 220 M200 180 Q150 220 180 260 M180 260 Q210 290 230 300 M110 230 Q130 190 140 150" stroke="currentColor" strokeOpacity=".4" strokeDasharray="4 6" />
      </svg>

      {/* cartões flutuantes */}
      <Card className="absolute top-[6%] left-[-4%] w-56 animate-float p-3.5 glass shadow-elevated">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success"><DoorOpen className="size-5" /></span>
          <div>
            <p className="text-sm font-semibold">{lib.name.replace("Biblioteca ", "")}</p>
            <p className="text-xs text-success">● Aberta agora · 3 salas livres</p>
          </div>
        </div>
      </Card>
      <Card className="absolute top-[40%] right-[-6%] w-52 animate-float p-3.5 glass shadow-elevated [animation-delay:1.2s]">
        <p className="text-xs text-muted-foreground">Hoje · 19:00</p>
        <p className="mt-0.5 text-sm font-semibold">Clube de leitura: Dom Casmurro</p>
        <div className="mt-2 flex items-center justify-between">
          <Badge tone="primary">7 vagas</Badge>
          <span className="text-xs font-medium text-primary">Participar →</span>
        </div>
      </Card>
      <Card className="absolute bottom-[6%] left-[4%] w-60 animate-float p-3.5 glass shadow-elevated [animation-delay:2.2s]">
        <div className="flex items-center gap-3">
          <img src="https://covers.openlibrary.org/b/id/8231856-M.jpg" alt="" className="h-14 w-10 rounded-md object-cover shadow-soft" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Disponível perto de você</p>
            <p className="text-xs text-muted-foreground">Estante B · 3º andar · 1,2 km</p>
            <div className="mt-1 flex text-star">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3 fill-current" />)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============ MAPA ============ */
function MapSection() {
  return (
    <section id="mapa" className="scroll-mt-24 py-16 md:py-20">
      <Container>
        <SectionHeader
          eyebrow="Mapa vivo"
          title={<>Tudo o que existe <span className="text-gradient">perto de você.</span></>}
          description="Bibliotecas reais do OpenStreetMap e da rede Biblioteca Viva, com horários, salas, computadores e eventos de hoje. Clique em um marcador para explorar."
        />
        <Reveal>
          <MapExplorer />
        </Reveal>
      </Container>
    </section>
  );
}

/* ============ BUSCA ============ */
function SearchSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero opacity-60" />
      <Container className="relative text-center">
        <SectionHeader
          eyebrow="Busca global"
          title="Uma pergunta. Todo o conhecimento da rede."
          description="Livros, eventos, bibliotecas, cursos, oficinas, clubes de leitura e espaços de estudo — tudo ao mesmo tempo."
        />
        <GlobalSearch />
        <p className="mt-6 text-sm text-muted-foreground">Mais de 40 milhões de livros indexados via Open Library.</p>
      </Container>
    </section>
  );
}

/* ============ PÚBLICOS ============ */
function Audiences() {
  const items = [
    {
      icon: Users,
      who: "Para cidadãos",
      title: "Descubra o que existe perto de você",
      points: ["Mapa de bibliotecas abertas agora", "Eventos, cursos e clubes de leitura", "Reserve salas e computadores", "Assistente de IA para estudar"],
      cta: { to: "/descobrir", label: "Começar a explorar" },
      tone: "bg-cover-2",
    },
    {
      icon: Building2,
      who: "Para bibliotecas",
      title: "Seja encontrada e gerencie tudo em um lugar",
      points: ["Perfil público estilo Airbnb", "Agenda, acervo, salas e equipe", "Indicadores e comunidade", "Grátis para bibliotecas públicas"],
      cta: { to: "/app/admin", label: "Ver painel da biblioteca" },
      tone: "bg-cover-4",
    },
  ] as const;
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeader eyebrow="Um ecossistema" title="Para quem lê e para quem faz a biblioteca acontecer." description="Cidadãos descobrem, bibliotecas são encontradas — e a rede cresce junto." />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {items.map((it, i) => (
            <Reveal key={it.who} delay={i * 100}>
              <Card className="card-hover flex h-full flex-col p-7">
                <span className={cn("grid size-12 place-items-center rounded-2xl text-on-image shadow-soft", it.tone)}>
                  <it.icon className="size-6" />
                </span>
                <p className="mt-6 text-sm font-medium text-primary">{it.who}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight">{it.title}</h3>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {it.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {p}
                    </li>
                  ))}
                </ul>
                <Link to={it.cta.to} className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all">
                  {it.cta.label} <ArrowRight className="size-4" />
                </Link>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ============ DESCOBRIR ============ */
function Discover() {
  return (
    <section className="bg-surface-2/50 py-20 md:py-28">
      <Container>
        <SectionHeader
          align="left"
          eyebrow="Descobrir"
          title="Curadorias para cada tipo de curiosidade"
          description="Coleções feitas pela comunidade para você encontrar o lugar certo."
          action={<Link to="/descobrir" className={buttonClass("outline", "md")}>Ver todas <ArrowRight className="size-4" /></Link>}
        />
        <CurationGrid />
      </Container>
    </section>
  );
}

/* ============ COMUNIDADE ============ */
function Community() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeader eyebrow="Comunidade" title="Uma rede que cresce todos os dias" description="Cada biblioteca conectada, cada conector publicado e cada evento cadastrado deixa a rede mais viva." />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {COMMUNITY_STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <Card className="h-full p-6 text-center">
                <p className="text-3xl font-semibold tracking-tight text-gradient md:text-4xl">
                  <CountUp value={s.value} suffix={s.suffix} compact={s.value > 1_000_000} />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ============ EVENTOS ============ */
function WeekEvents() {
  const [joined, setJoined] = useState<string[]>([]);
  return (
    <section className="bg-surface-2/50 py-20 md:py-28">
      <Container>
        <SectionHeader
          align="left"
          eyebrow="Agenda"
          title="Eventos globais desta semana"
          description="Presenciais e online, em bibliotecas do mundo inteiro."
          action={<Link to="/eventos" className={buttonClass("outline", "md")}>Ver agenda completa <ArrowRight className="size-4" /></Link>}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS.slice(0, 4).map((e, i) => (
            <Reveal key={e.id} delay={i * 80}>
              <EventCard event={e} joined={joined.includes(e.id)} onJoin={() => setJoined((j) => (j.includes(e.id) ? j : [...j, e.id]))} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ============ ROADMAP ============ */
function RoadmapPreview() {
  return (
    <section className="bg-surface-2/50 py-20 md:py-28">
      <Container>
        <SectionHeader align="left" eyebrow="Roadmap" title="O que vem por aí" action={<Link to="/roadmap" className={buttonClass("outline", "md")}>Roadmap completo <ArrowRight className="size-4" /></Link>} />
        <div className="relative -mx-4 overflow-x-auto px-4 pb-4 scrollbar-none">
          <div className="flex min-w-max gap-4">
            {ROADMAP.map((r, i) => (
              <Reveal key={r.version} delay={i * 60}>
                <div className="relative w-64">
                  <div className="mb-4 flex items-center gap-2">
                    <span className={cn("size-3 rounded-full ring-4", r.status === "lançado" ? "bg-success ring-success-soft" : r.status === "em construção" ? "bg-primary ring-primary-soft" : "bg-border-strong ring-surface-3")} />
                    <span className="h-px flex-1 bg-border-strong" />
                  </div>
                  <Card className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">{r.version}</span>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </div>
                    <h3 className="mt-2 font-semibold">{r.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.period}</p>
                  </Card>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ============ FUTURO ============ */
function Future() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeader eyebrow="Laboratório" title="A biblioteca do futuro já está em rascunho" description="Conceitos que estamos explorando com a comunidade." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FUTURE_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 5) * 60}>
                <Card className="card-hover group h-full p-5">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground transition group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-primary p-10 text-center text-primary-foreground shadow-glow md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
          <CalendarDays className="relative mx-auto size-10 opacity-80" />
          <h2 className="relative mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">Sua próxima descoberta está a poucos quarteirões.</h2>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#mapa" className={buttonClass("secondary", "lg")}>Abrir o mapa</a>
            <Link to="/assistente" className={buttonClass("glass", "lg")}><Sparkles className="size-4" /> Perguntar à IA</Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
