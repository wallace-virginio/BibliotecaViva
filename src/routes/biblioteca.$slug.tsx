import { createFileRoute, Link } from "@tanstack/react-router";
import { EmDesenvolvimentoNota } from "@/components/EmDesenvolvimento";
import { FEATURES } from "@/lib/features";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock,
  DoorOpen,
  Globe,
  Grid3x3,
  HandHeart,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Monitor,
  Navigation,
  Phone,
  Share2,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { BookCard, BookGridSkeleton, useLibraryPhotos } from "@/components/common";
import { AMENITY_META, OpenBadge } from "@/components/map/LibraryPanel";
import { MiniMap } from "@/components/map/MiniMap";
import { Badge, Button, buttonClass, Card, Container, EmptyState, Stars } from "@/components/ui";
import { EVENTS, FAQ } from "@/data/content";
import { fromOsm, getFeaturedLibrary, type Library } from "@/data/libraries";
import { booksBySubject } from "@/lib/api/openlibrary";
import { shareLink } from "@/lib/native";
import { IS_APP } from "@/lib/platform";
import { libraryByOsmId } from "@/lib/api/overpass";
import { DAY_NAMES, formatRanges } from "@/lib/hours";
import { useAsync } from "@/lib/hooks";
import { actions, useStore } from "@/lib/store";
import { cn, compactNumber, formatNumber, seeded } from "@/lib/utils";

export const Route = createFileRoute("/biblioteca/$slug")({
  head: ({ params }) => {
    const lib = getFeaturedLibrary(params.slug);
    const name = lib?.name ?? "Biblioteca";
    return {
      meta: [
        { title: `${name} — Biblioteca Viva` },
        { name: "description", content: lib?.description ?? `Horários, eventos, salas, acervo e serviços de ${name}.` },
      ],
    };
  },
  component: LibraryPage,
});

function LibraryPage() {
  const { slug } = Route.useParams();
  const featured = getFeaturedLibrary(slug);
  const osm = useAsync<Library | undefined>(
    async (signal) => {
      if (featured || !slug.startsWith("osm-")) return featured;
      const o = await libraryByOsmId(slug.slice(4), signal);
      return o ? fromOsm(o) : undefined;
    },
    [slug],
  );
  const lib = featured ?? osm.data;

  if (!lib && osm.loading)
    return (
      <div className="grid min-h-[70vh] place-items-center pt-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  if (!lib)
    return (
      <Container className="pt-32 pb-20">
        <EmptyState icon={<MapPin className="size-6" />} title="Biblioteca não encontrada" description="Ela pode ter sido removida do OpenStreetMap ou o link está incorreto." action={<Link to="/" hash="mapa" className={buttonClass("primary", "md")}>Voltar ao mapa</Link>} />
      </Container>
    );
  return <LibraryProfile lib={lib} />;
}

function Gallery({ lib }: { lib: Library }) {
  const { data, loading } = useLibraryPhotos(lib);
  const photos = data ?? [];
  const tones = ["bg-cover-2", "bg-cover-4", "bg-cover-6", "bg-cover-1", "bg-cover-8"];
  const cell = (i: number, cls: string) =>
    loading && !data ? (
      <div key={i} className={cn("skeleton", cls)} />
    ) : photos[i] ? (
      <img key={i} src={photos[i]} alt={`${lib.name} — foto ${i + 1}`} className={cn("size-full object-cover transition duration-500 hover:brightness-90", cls)} />
    ) : (
      <div key={i} className={cn("grid place-items-center text-on-image", tones[i], cls)}>
        <BookOpen className="size-8 opacity-60" />
      </div>
    );
  return (
    <div className="relative grid h-[280px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:h-[440px]">
      <div className="col-span-4 row-span-2 md:col-span-2">{cell(0, "size-full")}</div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="hidden md:block">{cell(i, "size-full")}</div>
      ))}
      {photos.length > 0 && (
        <span className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full glass border px-3 py-1.5 text-xs font-medium shadow-soft">
          <Grid3x3 className="size-3.5" /> {photos.length} fotos · Wikimedia Commons
        </span>
      )}
    </div>
  );
}

const SECTIONS = ["Sobre", "Acervo", "Agenda", "Salas", "Avaliações", "Serviços", "Equipe", "Contato"] as const;

function LibraryProfile({ lib }: { lib: Library }) {
  const followed = useStore((s) => s.followedLibraries.includes(lib.slug));
  const r = seeded(lib.slug + "x");
  const today = new Date().getDay();
  const events = EVENTS.filter((e) => e.librarySlug === lib.slug);
  const agenda = [
    ...lib.eventsToday.map((e, i) => ({ id: `t${i}`, title: e.title, when: `Hoje · ${e.time}`, spots: e.spots, category: e.category })),
    ...events.map((e) => ({ id: e.id, title: e.title, when: `${e.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} · ${e.time}`, spots: e.spotsLeft, category: e.category })),
  ];
  const subject = lib.curations.includes("criancas") ? "children" : lib.curations.includes("universitarias") ? "science" : lib.curations.includes("historicas") ? "history" : "literature";
  const books = useAsync((s) => booksBySubject(subject, 12, s), [subject]);
  const founded = lib.founded ?? 1950 + r.int(0, 60);
  const timeline = [
    { year: founded, text: "Fundação da biblioteca" },
    { year: founded + Math.max(5, Math.floor((2020 - founded) / 3)), text: "Ampliação do acervo e da sede" },
    { year: Math.max(founded + 10, 2012), text: "Inauguração do espaço digital e Wi-Fi público" },
    { year: 2026, text: "Conectada à rede Biblioteca Viva" },
  ];
  const team = [
    { name: r.pick(["Helena Martins", "Beatriz Lima", "Fernanda Rocha"]), role: "Diretora" },
    { name: r.pick(["João Pereira", "Marcos Souza", "Tiago Nunes"]), role: "Bibliotecário-chefe" },
    { name: r.pick(["Carla Dias", "Patrícia Gomes", "Renata Alves"]), role: "Mediação de leitura" },
    { name: r.pick(["André Costa", "Rafael Moreira", "Lucas Barros"]), role: "Makerspace & tecnologia" },
  ];
  const reviews = [
    { name: "Mariana S.", rating: 5, text: "Lugar lindo e silencioso, as salas de estudo salvaram meu semestre.", when: "há 2 semanas" },
    { name: "Diego R.", rating: 4, text: "Acervo ótimo e equipe muito atenciosa. O Wi-Fi poderia ser mais rápido.", when: "há 1 mês" },
    { name: "Paula T.", rating: 5, text: "Levo meus filhos toda semana para a contação de histórias. Imperdível!", when: "há 2 meses" },
  ];
  const rating = lib.rating;

  return (
    <div className="pt-24 pb-24">
      <Container>
        {/* no app o "Voltar" fica no cabeçalho */}
        {!IS_APP && (
          <Link to="/" hash="mapa" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Voltar ao mapa
          </Link>
        )}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="animate-fade-up">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge tone="primary">{lib.kind}</Badge>
              {lib.featured ? <Badge tone="success">Conectada à rede</Badge> : <Badge>Dados do OpenStreetMap</Badge>}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{lib.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {FEATURES.comunidade && <Stars value={rating} className="text-foreground" />}
              {FEATURES.comunidade && <span>{formatNumber(lib.reviews)} avaliações</span>}
              <span className="flex items-center gap-1"><MapPin className="size-4" />{[lib.address, lib.city, lib.country].filter(Boolean).join(" · ") || "Endereço não informado"}</span>
              <OpenBadge lib={lib} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => shareLink(lib.name, `/biblioteca/${lib.slug}`)}>
              <Share2 className="size-4" /> Compartilhar
            </Button>
            <Button variant={followed ? "soft" : "outline"} size="sm" onClick={() => actions.toggleFollowLibrary(lib.slug)}>
              <Heart className={cn("size-4", followed && "fill-current")} /> {followed ? "Seguindo" : "Seguir"}
            </Button>
          </div>
        </div>

        <Gallery lib={lib} />

        <nav className="sticky top-[72px] z-30 -mx-4 mt-8 flex gap-1 overflow-x-auto border-b bg-background/90 px-4 py-2 backdrop-blur scrollbar-none">
          {SECTIONS.map((s) => (
            <a key={s} href={`#${s.toLowerCase()}`} className="shrink-0 rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
              {s}
            </a>
          ))}
        </nav>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-14">
            {/* Sobre + história */}
            <section id="sobre" className="scroll-mt-32">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: BookOpen, label: "Livros", value: compactNumber(lib.books) },
                  { icon: DoorOpen, label: "Salas", value: String(lib.rooms.total) },
                  { icon: Monitor, label: "Computadores", value: String(lib.computers.total) },
                  { icon: Users, label: "Visitas/mês", value: compactNumber(lib.visitorsMonth) },
                ].map((s) => (
                  <Card key={s.label} className="p-4">
                    <s.icon className="size-5 text-primary" />
                    <p className="mt-3 text-2xl font-semibold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </Card>
                ))}
              </div>
              <h2 className="mt-10 text-2xl font-semibold tracking-tight">Sobre</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{lib.description}</p>
              <h3 className="mt-8 font-semibold">Linha do tempo</h3>
              <ol className="mt-4 space-y-0 border-l-2 border-primary-soft pl-6">
                {timeline.map((t) => (
                  <li key={t.year + t.text} className="relative pb-5">
                    <span className="absolute top-1 -left-[31px] size-3 rounded-full bg-primary ring-4 ring-background" />
                    <span className="text-sm font-semibold text-primary">{t.year}</span>
                    <p className="text-sm text-muted-foreground">{t.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Acervo */}
            <section id="acervo" className="scroll-mt-32">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Destaques do acervo</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{formatNumber(lib.books)} itens · metadados da Open Library</p>
                </div>
                <Link to="/acervo" className="text-sm font-medium text-primary">Ver acervo →</Link>
              </div>
              <div className="mt-6">
                {books.loading ? <BookGridSkeleton count={6} className="lg:grid-cols-6" /> : (
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    {(books.data ?? []).slice(0, 12).map((b) => <BookCard key={b.id} book={b} />)}
                  </div>
                )}
              </div>
            </section>

            {/* Agenda */}
            {FEATURES.eventos ? (
            <section id="agenda" className="scroll-mt-32">
              <h2 className="text-2xl font-semibold tracking-tight">Agenda de eventos</h2>
              <div className="mt-5 space-y-3">
                {agenda.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento programado para os próximos dias.</p>}
                {agenda.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 rounded-2xl border bg-surface p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-soft-foreground"><CalendarDays className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{e.title}</p>
                      <p className="text-sm text-muted-foreground">{e.when} · {e.category}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={e.spots ? "primary" : "outline"}
                      onClick={() => actions.reserve({ id: `ev-${lib.slug}-${e.id}`, kind: "evento", title: e.title, subtitle: lib.name, when: e.when })}
                    >
                      {e.spots ? "Inscrever" : "Lista de espera"}
                    </Button>
                  </div>
                ))}
              </div>
            </section>
            ) : (
              <section className="scroll-mt-32"><EmDesenvolvimentoNota feature="eventos" /></section>
            )}

            {/* Salas e computadores */}
            {FEATURES.salas ? (
            <section id="salas" className="scroll-mt-32">
              <h2 className="text-2xl font-semibold tracking-tight">Salas e computadores</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: Math.min(lib.rooms.total, 4) }).map((_, i) => {
                  const free = i < lib.rooms.available;
                  return (
                    <Card key={i} className="flex items-center gap-4 p-4">
                      <span className={cn("grid size-11 place-items-center rounded-xl", free ? "bg-success-soft text-success" : "bg-surface-2 text-muted-foreground")}><DoorOpen className="size-5" /></span>
                      <div className="flex-1">
                        <p className="font-medium">Sala {String.fromCharCode(65 + i)} · {[4, 6, 8, 12][i]} pessoas</p>
                        <p className="text-sm text-muted-foreground">{free ? "Disponível agora" : "Ocupada até 16:00"}</p>
                      </div>
                      <Link to="/salas" search={{ biblioteca: lib.slug }} className={buttonClass(free ? "soft" : "ghost", "sm")}>Reservar</Link>
                    </Card>
                  );
                })}
              </div>
              <Card className="mt-4 flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <Monitor className="size-5 text-primary" />
                  <span className="font-medium">{lib.computers.available} de {lib.computers.total} computadores livres</span>
                </div>
                <div className="hidden h-2 w-40 overflow-hidden rounded-full bg-surface-3 sm:block">
                  <div className="h-full bg-gradient-primary" style={{ width: `${(lib.computers.available / lib.computers.total) * 100}%` }} />
                </div>
              </Card>
            </section>
            ) : (
              <section className="scroll-mt-32"><EmDesenvolvimentoNota feature="salas" /></section>
            )}

            {/* Avaliações */}
            {FEATURES.comunidade ? (
            <section id="avaliações" className="scroll-mt-32">
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Star className="size-6 fill-star text-star" /> {rating.toFixed(1).replace(".", ",")} · {formatNumber(lib.reviews)} avaliações</h2>
              <div className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                {["Silêncio", "Acervo", "Atendimento", "Conforto", "Wi-Fi", "Acessibilidade"].map((k, i) => {
                  const v = Math.min(5, rating - 0.4 + ((i * 37) % 9) / 10);
                  return (
                    <div key={k} className="flex items-center justify-between gap-4 text-sm">
                      <span>{k}</span>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-3"><div className="h-full bg-foreground" style={{ width: `${(v / 5) * 100}%` }} /></div>
                        <span className="w-6 tabular-nums">{v.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {reviews.map((rv) => (
                  <div key={rv.name}>
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-primary-soft font-semibold text-primary-soft-foreground">{rv.name[0]}</span>
                      <div>
                        <p className="text-sm font-medium">{rv.name}</p>
                        <p className="text-xs text-muted-foreground">{rv.when}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{rv.text}</p>
                  </div>
                ))}
              </div>
            </section>
            ) : (
              <section className="scroll-mt-32"><EmDesenvolvimentoNota feature="comunidade" /></section>
            )}

            {/* Serviços + horários */}
            <section id="serviços" className="scroll-mt-32">
              <h2 className="text-2xl font-semibold tracking-tight">Serviços e horários</h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div className="grid grid-cols-2 gap-3">
                  {AMENITY_META.map(({ key, label, icon: Icon }) => (
                    <div key={key} className={cn("flex items-center gap-3 rounded-2xl border p-3.5 text-sm", !lib.amenities[key] && "opacity-45 line-through")}>
                      <Icon className="size-5 text-primary" /> {label}
                    </div>
                  ))}
                </div>
                <Card className="p-5">
                  <p className="mb-3 flex items-center gap-2 font-medium"><Clock className="size-4 text-primary" /> Horário de funcionamento</p>
                  {lib.hours ? (
                    <ul className="space-y-1.5 text-sm">
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <li key={d} className={cn("flex justify-between", d === today ? "font-semibold" : "text-muted-foreground")}>
                          <span>{DAY_NAMES[d]}</span>
                          <span className="tabular-nums">{formatRanges(lib.hours![d].ranges)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Horário não informado no OpenStreetMap.</p>
                  )}
                </Card>
              </div>
            </section>

            {/* Equipe */}
            <section id="equipe" className="scroll-mt-32">
              <h2 className="text-2xl font-semibold tracking-tight">Equipe</h2>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {team.map((t, i) => (
                  <Card key={t.role} className="p-5 text-center">
                    <span className={cn("mx-auto grid size-14 place-items-center rounded-full text-lg font-semibold text-on-image", `bg-cover-${(i % 8) + 1}`)}>
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <p className="mt-3 text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="text-2xl font-semibold tracking-tight">Perguntas frequentes</h2>
              <div className="mt-5 divide-y rounded-3xl border bg-surface">
                {FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </section>

            {/* Como chegar + contato */}
            <section id="contato" className="scroll-mt-32">
              <h2 className="text-2xl font-semibold tracking-tight">Como chegar e contato</h2>
              <MiniMap lib={lib} className="mt-5 h-80 overflow-hidden rounded-3xl border" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a href={`https://www.openstreetmap.org/directions?to=${lib.lat}%2C${lib.lon}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border p-4 text-sm transition hover:border-primary">
                  <Navigation className="size-5 text-primary" /> Traçar rota no OpenStreetMap
                </a>
                {lib.website && (
                  <a href={lib.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border p-4 text-sm transition hover:border-primary">
                    <Globe className="size-5 text-primary" /> <span className="truncate">{lib.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
                {lib.phone && (
                  <a href={`tel:${lib.phone}`} className="flex items-center gap-3 rounded-2xl border p-4 text-sm transition hover:border-primary">
                    <Phone className="size-5 text-primary" /> {lib.phone}
                  </a>
                )}
                <a href={`mailto:${lib.email ?? "contato@bibliotecaviva.org"}`} className="flex items-center gap-3 rounded-2xl border p-4 text-sm transition hover:border-primary">
                  <Mail className="size-5 text-primary" /> {lib.email ?? "Enviar mensagem"}
                </a>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
            <Card className="p-6 shadow-card">
              <OpenBadge lib={lib} />
              <p className="mt-4 text-lg font-semibold">Reserve um espaço</p>
              <p className="text-sm text-muted-foreground">{lib.rooms.available} salas e {lib.computers.available} computadores livres agora.</p>
              <Link to="/salas" search={{ biblioteca: lib.slug }} className={buttonClass("primary", "md", "mt-5 w-full")}>
                Reservar sala ou computador
              </Link>
              <a href="#agenda" className={buttonClass("outline", "md", "mt-2 w-full")}>Ver agenda</a>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="bg-cover-4 p-5 text-on-image">
                <HandHeart className="size-7" />
                <p className="mt-3 text-lg font-semibold">Doações e voluntariado</p>
                <p className="text-sm opacity-90">Ajude esta biblioteca a crescer.</p>
              </div>
              <div className="space-y-2 p-5">
                <Button variant="soft" className="w-full" onClick={() => actions.reserve({ id: `vol-${lib.slug}`, kind: "evento", title: "Voluntariado", subtitle: lib.name, when: "A combinar" })}>
                  Quero ser voluntário
                </Button>
                <Button variant="outline" className="w-full">Doar livros</Button>
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium">
        {q}
        <ChevronDown className={cn("size-4 shrink-0 transition", open && "rotate-180")} />
      </button>
      {open && <p className="animate-fade-in px-5 pb-4 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}
