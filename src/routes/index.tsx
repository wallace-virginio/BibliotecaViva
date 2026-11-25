import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenText, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCover, LibraryImage, Reveal } from "@/components/common";
import { AppHome } from "@/components/app/AppHome";
import { IS_APP } from "@/lib/platform";
import { FEATURES } from "@/lib/features";
import { CoverWall } from "@/components/CoverWall";
import { CurationGrid } from "@/components/CurationGrid";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MapExplorer } from "@/components/map/MapExplorer";
import { TextFill } from "@/components/motion";
import { RankNumber, ShelfRow } from "@/components/Ranking";
import { buttonClass, Container, SectionHeader } from "@/components/ui";
import { EVENTS, FREE_CLASSICS } from "@/data/content";
import { FEATURED_LIBRARIES, getFeaturedLibrary } from "@/data/libraries";
import { trending } from "@/lib/api/rankings";
import { useAsync } from "@/lib/hooks";
import { useLocation } from "@/lib/location";
import { actions, useStore } from "@/lib/store";
import { cn, formatDistance, haversineKm } from "@/lib/utils";
import { useI18n, usePageTitle, useT } from "@/lib/i18n";
import { localeTag } from "@/lib/locale";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Biblioteca Viva — o que a biblioteca do seu bairro tem para você" },
      {
        name: "description",
        content: "Livros para emprestar, salas para estudar, clubes de leitura e oficinas — quase tudo de graça. Veja o que tem na biblioteca perto de você.",
      },
    ],
  }),
  // No app de celular, "/" é a tela Início do app; no site, a home editorial (voltada também às bibliotecas).
  component: IS_APP ? AppHome : Home,
});

/*
 * Página inicial com cara de publicação, não de "landing de startup".
 * Referências: NYPL (fotos reais com legenda, agenda em lista), Airbnb (busca logo de cara),
 * Letterboxd (pôsteres numerados), Spotify (estantes de conteúdo) e jornais como The Guardian (fios, serifa, hierarquia).
 */
function Home() {
  usePageTitle(useT().home.metaTitle);
  return (
    <>
      <Masthead />
      <NearYou />
      <OnTheShelf />
      <PickOfTheWeek />
      <Manifesto />
      {FEATURES.eventos && <Agenda />}
      <Collections />
      <ForLibraries />
    </>
  );
}

const FREE_BOOKS = FREE_CLASSICS.map((b) => ({ id: b.id, title: b.title, authors: [b.author], coverId: b.coverId, subjects: [] }));

/* ============ ABERTURA: frase humana + busca + fotos reais ============ */
function Masthead() {
  const { location, ask } = useLocation();
  const { t, locale } = useI18n();
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toLocaleDateString(localeTag(locale), { weekday: "long", day: "numeric", month: "long" })), [locale]);
  const photos = ["real-gabinete-portugues-de-leitura", "biblioteca-mario-de-andrade", "state-library-victoria"].map((s) => getFeaturedLibrary(s)!);

  return (
    <section className="pt-20 pb-12 md:pt-28 md:pb-16">
      <Container>
        <div className="rule-thin mb-6 flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
          <span className="first-letter:uppercase">{today || " "}</span>
          <button onClick={ask} className="flex items-center gap-1 hover:text-foreground">
            <MapPin className="size-3.5" /> {location ? t.home.edition(location.label) : t.home.chooseCity}
          </button>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="animate-fade-up">
            <h1 className="text-[2.35rem] leading-[1.08] text-balance sm:text-5xl md:text-[3.6rem]">
              {t.home.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
              {t.home.leadA}
              <span className="highlight text-foreground">{t.home.leadHighlight}</span>
              {t.home.leadB}
            </p>

            <div className="mt-7">
              <GlobalSearch className="!mx-0 !max-w-none" />
            </div>

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <li><Link to="/mapa" className="font-medium text-primary underline-offset-4 hover:underline">{t.home.linkOpen}</Link></li>
              <li><Link to="/acervo" search={{ ebook: true }} className="font-medium text-primary underline-offset-4 hover:underline">{t.home.linkFree}</Link></li>
              {FEATURES.eventos && <li><Link to="/eventos" className="font-medium text-primary underline-offset-4 hover:underline">{t.home.linkWeek}</Link></li>}
            </ul>
          </div>

          {/* Fotos de bibliotecas de verdade, com legenda — como numa revista */}
          <div className="grid grid-cols-5 grid-rows-[auto_auto] gap-3">
            <figure className="col-span-5 sm:col-span-3 sm:row-span-2">
              <LibraryImage lib={photos[0]} className="aspect-[4/5] w-full rounded-lg sm:aspect-auto sm:h-[26rem]" />
              <figcaption className="caption mt-1.5">{photos[0].name}, {photos[0].city}</figcaption>
            </figure>
            {photos.slice(1).map((l) => (
              <figure key={l.slug} className="col-span-5 hidden sm:col-span-2 sm:block">
                <LibraryImage lib={l} className="h-[11.6rem] w-full rounded-lg" />
                <figcaption className="caption mt-1.5 line-clamp-1">{l.name}, {l.city}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ============ PERTO DE VOCÊ (mapa) ============ */
function NearYou() {
  const { location } = useLocation();
  const t = useT();
  return (
    <section id="mapa" className="scroll-mt-24 pb-16">
      <Container>
        <SectionHeader
          eyebrow={t.home.mapEyebrow}
          title={location ? t.home.mapTitleNear(location.label) : t.home.mapTitle}
          description={t.home.mapDesc}
        />
        <MapExplorer />
      </Container>
    </section>
  );
}

/* ============ NA ESTANTE: o que estão lendo (pôsteres numerados) ============ */
function OnTheShelf() {
  const hot = useAsync((sig) => trending("weekly", 10, sig), []);
  const t = useT();
  return (
    <section className="bg-surface-2/60 py-14 md:py-16">
      <Container className="space-y-12">
        <div>
          <SectionHeader
            eyebrow={t.home.shelfEyebrow}
            title={t.home.shelfTitle}
            action={<Link to="/ranking" className="flex items-center gap-1 text-sm font-medium text-primary">{t.home.seeRanking} <ArrowRight className="size-4" /></Link>}
          />
          <ShelfRow title="" books={hot.data} loading={hot.loading} badge={(_, i) => <RankNumber n={i + 1} />} />
        </div>
        <div>
          <SectionHeader eyebrow={t.home.freeEyebrow} title={t.home.freeTitle} description={t.home.freeDesc} />
          <ShelfRow title="" books={FREE_BOOKS} />
        </div>
      </Container>
    </section>
  );
}

/* ============ ESCOLHA DA SEMANA: uma indicação com texto de gente ============ */
function PickOfTheWeek() {
  const pick = FREE_CLASSICS[0]; // Dom Casmurro
  const progress = useStore((s) => s.reading[pick.id]);
  const t = useT();
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="rule-top grid gap-8 pt-6 md:grid-cols-[minmax(0,280px)_1fr] md:gap-14">
          <Reveal>
            <Link to="/livro/$id" params={{ id: pick.id }} className="block">
              <BookCover coverId={pick.coverId} title={pick.title} author={pick.author} size="L" className="mx-auto w-48 rotate-[-2deg] rounded-md shadow-elevated md:w-full" />
            </Link>
          </Reveal>
          <div className="max-w-2xl">
            <p className="kicker">{t.home.pickEyebrow}</p>
            <h2 className="mt-2 text-4xl md:text-5xl">{pick.title}</h2>
            <p className="mt-1 text-muted-foreground">{pick.author} · 1899</p>
            <div className="mt-6 space-y-4 font-serif text-lg leading-relaxed md:text-xl">
              <p>{t.home.pickP1}</p>
              <p className="text-muted-foreground">{t.home.pickP2}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/ler/$id" params={{ id: pick.id }} className={buttonClass("primary", "lg")}>
                <BookOpenText className="size-5" /> {progress ? t.home.continueAt(progress.percent) : t.home.readNow}
              </Link>
              <Link to="/livro/$id" params={{ id: pick.id }} className={buttonClass("outline", "lg")}>{t.home.seeBook}</Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ============ MANIFESTO (texto que se preenche com a rolagem) ============ */
function Manifesto() {
  const t = useT();
  return (
    <section className="bg-foreground py-20 text-background md:py-28">
      <Container className="max-w-4xl">
        <p className="mb-6 text-xs font-bold tracking-[0.12em] uppercase opacity-70">{t.home.manifestoEyebrow}</p>
        <TextFill
          className="font-serif text-3xl leading-snug md:text-5xl md:leading-tight"
          key={t.home.manifesto}
          text={t.home.manifesto}
        />
      </Container>
    </section>
  );
}

/* ============ AGENDA: lista como programação impressa ============ */
function Agenda() {
  const { location } = useLocation();
  const joined = useStore((s) => s.reservations.filter((r) => r.kind === "evento").map((r) => r.id));
  const items = EVENTS.map((e) => {
    const lib = FEATURED_LIBRARIES.find((l) => l.slug === e.librarySlug);
    return { e, lib, km: location && lib ? haversineKm(location, lib) : undefined };
  })
    // o hackathon é coisa da área do desenvolvedor: fica fora da página inicial
    .filter((x) => x.e.category !== "Hackathon")
    .filter((x) => !location || x.e.online || (x.km ?? 0) <= 60)
    .sort((a, b) => a.e.date.getTime() - b.e.date.getTime() || a.e.time.localeCompare(b.e.time))
    .slice(0, 6);

  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeader
          eyebrow="Agenda"
          title={location ? `Esta semana em ${location.label}` : "Esta semana nas bibliotecas"}
          action={<Link to="/eventos" className="flex items-center gap-1 text-sm font-medium text-primary">Agenda completa <ArrowRight className="size-4" /></Link>}
        />
        <ol className="divide-y border-y">
          {items.map(({ e, lib, km }) => {
            const id = `evento-${e.id}`;
            const done = joined.includes(id);
            return (
              <li key={e.id} className="grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-2 py-5 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center">
                <div className="text-center leading-none">
                  <div className="font-serif text-3xl font-semibold tabular-nums">{e.date.getDate()}</div>
                  <div className="mt-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {e.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-deep">{e.category}{e.online ? " · Online" : ""}</p>
                  <p className="mt-0.5 font-serif text-lg leading-snug font-medium">{e.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {e.time} · {e.online ? "pela internet" : lib?.name}
                    {!e.online && km !== undefined ? ` · ${formatDistance(km)}` : ""}
                    {" · "}
                    <span className={cn(e.spotsLeft === 0 ? "text-danger" : e.spotsLeft < 10 && "text-warning")}>
                      {e.spotsLeft === 0 ? "lotado" : `${e.spotsLeft} vagas`}
                    </span>
                  </p>
                </div>
                <button
                  disabled={e.spotsLeft === 0 && !done}
                  onClick={() =>
                    done
                      ? actions.cancelReservation(id)
                      : actions.reserve({ id, kind: "evento", title: e.title, subtitle: e.online ? "Online" : lib?.name, when: `${e.date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })} · ${e.time}` })
                  }
                  className={cn("col-start-2 justify-self-start text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-40 sm:col-start-3", done ? "text-success" : "text-primary")}
                >
                  {done ? "Inscrito ✓" : e.spotsLeft === 0 ? "Sem vagas" : "Quero ir"}
                </button>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

/* ============ COLEÇÕES (fotos reais) + parede de capas ============ */
function Collections() {
  const t = useT();
  return (
    <section className="bg-surface-2/60 py-16 md:py-24">
      <Container>
        <SectionHeader
          eyebrow={t.home.collectionsEyebrow}
          title={t.home.collectionsTitle}
          action={<Link to="/descobrir" className="flex items-center gap-1 text-sm font-medium text-primary">{t.home.allCollections} <ArrowRight className="size-4" /></Link>}
        />
        <CurationGrid />
      </Container>
      <div className="mt-16">
        <Container><p className="kicker mb-4">{t.home.fromCollection}</p></Container>
        <CoverWall rows={2} className="h-[22rem]" />
      </div>
    </section>
  );
}

/* ============ PARA BIBLIOTECAS (bloco honesto, sem marketing) ============ */
function ForLibraries() {
  const t = useT();
  return (
    <section className="py-16 md:py-20">
      <Container>
        <div className="rule-top grid gap-6 pt-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-2xl">
            <p className="kicker">{t.home.libsEyebrow}</p>
            <h2 className="mt-2 text-3xl md:text-4xl">{t.home.libsTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.home.libsText}</p>
          </div>
          <Link to="/entrar" search={{ modo: "biblioteca" }} className={buttonClass("secondary", "lg")}>
            {t.home.libsCta}
          </Link>
        </div>
      </Container>
    </section>
  );
}
