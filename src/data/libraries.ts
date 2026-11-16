import type { DayHours } from "@/lib/hours";
import { parseOpeningHours } from "@/lib/hours";
import type { OsmLibrary } from "@/lib/api/overpass";
import { seeded, slugify } from "@/lib/utils";

export type CurationKey =
  | "historicas"
  | "mais-visitadas"
  | "eventos"
  | "estudar"
  | "criancas"
  | "maker"
  | "universitarias"
  | "digitais";

export type LibraryKind = "Pública" | "Nacional" | "Universitária" | "Comunitária" | "Escolar" | "Digital";

export type Amenities = {
  acessibilidade: boolean;
  wifi: boolean;
  makerspace: boolean;
  cafe: boolean;
  impressao: boolean;
  scanner: boolean;
};

export type LibraryEvent = { title: string; time: string; spots: number; category: string };

export type Library = {
  slug: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  kind: LibraryKind;
  featured: boolean;
  osmId?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  hours?: DayHours[];
  description: string;
  founded?: number;
  wiki?: { title: string; lang: "pt" | "en" };
  curations: CurationKey[];
  rating: number;
  reviews: number;
  books: number;
  rooms: { available: number; total: number };
  computers: { available: number; total: number };
  amenities: Amenities;
  eventsToday: LibraryEvent[];
  visitorsMonth: number;
};

const STD_HOURS = "Mo-Fr 09:00-20:00; Sa 10:00-17:00; Su off";

type Seed = Omit<
  Library,
  "slug" | "featured" | "rating" | "reviews" | "rooms" | "computers" | "eventsToday" | "visitorsMonth" | "hours" | "amenities"
> & { hours?: string; amenities?: Partial<Amenities>; slug?: string };

const EVENT_POOL: [string, string][] = [
  ["Clube de leitura: ficção científica", "Clube de leitura"],
  ["Oficina de programação para iniciantes", "Oficina"],
  ["Contação de histórias infantil", "Crianças"],
  ["Sarau de poesia", "Cultura"],
  ["Introdução à Inteligência Artificial", "Curso"],
  ["Roda de conversa: Machado de Assis", "Clube de leitura"],
  ["Impressão 3D no makerspace", "Oficina"],
  ["Grupo de estudos: vestibular", "Estudo"],
  ["Exposição de obras raras", "Exposição"],
  ["Workshop de escrita criativa", "Oficina"],
  ["Cinema na biblioteca", "Cultura"],
  ["Mentoria de carreira em tecnologia", "Curso"],
];

function derive(slug: string, base: { books?: number; curations: CurationKey[]; amenities?: Partial<Amenities> }) {
  const r = seeded(slug);
  const roomsTotal = r.int(2, 14);
  const pcsTotal = r.int(4, 40);
  const nEvents = r.int(0, 3);
  const events: LibraryEvent[] = [];
  const used = new Set<number>();
  for (let i = 0; i < nEvents; i++) {
    let idx = r.int(0, EVENT_POOL.length - 1);
    while (used.has(idx)) idx = (idx + 1) % EVENT_POOL.length;
    used.add(idx);
    const h = r.int(10, 19);
    events.push({ title: EVENT_POOL[idx][0], category: EVENT_POOL[idx][1], time: `${h}:${r.pick(["00", "30"])}`, spots: r.int(0, 30) });
  }
  events.sort((a, b) => a.time.localeCompare(b.time));
  return {
    rating: Math.round((3.9 + r.next() * 1.1) * 10) / 10,
    reviews: r.int(18, 2400),
    rooms: { total: roomsTotal, available: r.int(0, roomsTotal) },
    computers: { total: pcsTotal, available: r.int(0, pcsTotal) },
    eventsToday: events,
    visitorsMonth: r.int(800, 90000),
    books: base.books ?? r.int(4, 120) * 1000,
    amenities: {
      acessibilidade: r.bool(0.8),
      wifi: r.bool(0.92),
      makerspace: base.curations.includes("maker") || r.bool(0.25),
      cafe: r.bool(0.45),
      impressao: r.bool(0.75),
      scanner: r.bool(0.6),
      ...base.amenities,
    },
  };
}

function build(s: Seed): Library {
  const slug = s.slug ?? slugify(s.name);
  return {
    ...s,
    slug,
    featured: true,
    hours: parseOpeningHours(s.hours ?? STD_HOURS),
    ...derive(slug, s),
  };
}

const SEEDS: Seed[] = [
  {
    name: "Biblioteca Nacional do Brasil",
    city: "Rio de Janeiro",
    country: "Brasil",
    lat: -22.9097,
    lon: -43.1751,
    kind: "Nacional",
    address: "Av. Rio Branco, 219 — Centro",
    website: "https://www.bn.gov.br",
    founded: 1810,
    books: 9_000_000,
    wiki: { title: "Biblioteca Nacional (Brasil)", lang: "pt" },
    description:
      "A maior biblioteca da América Latina e uma das dez maiores do mundo. Guarda obras raras, mapas, partituras e o acervo trazido pela família real portuguesa.",
    curations: ["historicas", "mais-visitadas"],
    hours: "Mo-Fr 10:00-17:00",
  },
  {
    name: "Biblioteca Mário de Andrade",
    city: "São Paulo",
    country: "Brasil",
    lat: -23.5469,
    lon: -46.6425,
    kind: "Pública",
    address: "R. da Consolação, 94 — República",
    founded: 1925,
    books: 3_300_000,
    wiki: { title: "Biblioteca Mário de Andrade", lang: "pt" },
    description:
      "Segunda maior biblioteca do país, ícone art déco no centro de São Paulo, com hemeroteca, mapoteca, obras raras e funcionamento noturno.",
    curations: ["historicas", "mais-visitadas", "estudar", "eventos"],
    hours: "Mo-Fr 08:00-22:00; Sa,Su 08:00-20:00",
  },
  {
    name: "Real Gabinete Português de Leitura",
    city: "Rio de Janeiro",
    country: "Brasil",
    lat: -22.9056,
    lon: -43.1817,
    kind: "Pública",
    address: "R. Luís de Camões, 30 — Centro",
    founded: 1837,
    books: 350_000,
    wiki: { title: "Real Gabinete Português de Leitura", lang: "pt" },
    description:
      "Salão neomanuelino deslumbrante com a maior coleção de literatura portuguesa fora de Portugal. Considerada uma das bibliotecas mais bonitas do mundo.",
    curations: ["historicas", "mais-visitadas"],
    hours: "Mo-Fr 10:00-17:00",
  },
  {
    name: "Biblioteca Parque Villa-Lobos",
    city: "São Paulo",
    country: "Brasil",
    lat: -23.5468,
    lon: -46.722,
    kind: "Pública",
    address: "Av. Queiroz Filho, 1205 — Parque Villa-Lobos",
    founded: 2014,
    books: 30_000,
    wiki: { title: "Biblioteca Parque Villa-Lobos", lang: "pt" },
    description:
      "Biblioteca dentro de um parque, com espaço infantil, games, música e um programa cultural intenso aos fins de semana.",
    curations: ["criancas", "eventos", "estudar", "maker"],
    hours: "Tu-Su 09:30-18:30",
  },
  {
    name: "Biblioteca de São Paulo",
    city: "São Paulo",
    country: "Brasil",
    lat: -23.5139,
    lon: -46.6236,
    kind: "Pública",
    address: "Av. Cruzeiro do Sul, 2630 — Santana",
    founded: 2010,
    books: 45_000,
    wiki: { title: "Biblioteca de São Paulo", lang: "pt" },
    description: "Biblioteca-parque moderna, acessível e voltada à família, construída onde antes funcionava o Carandiru.",
    curations: ["criancas", "eventos", "estudar"],
    hours: "Tu-Su 09:30-18:30",
  },
  {
    name: "Biblioteca Pública do Paraná",
    city: "Curitiba",
    country: "Brasil",
    lat: -25.4293,
    lon: -49.2671,
    kind: "Pública",
    founded: 1857,
    books: 700_000,
    wiki: { title: "Biblioteca Pública do Paraná", lang: "pt" },
    description: "Uma das bibliotecas mais antigas do Brasil e referência em programação cultural e acervo paranaense.",
    curations: ["historicas", "eventos"],
  },
  {
    name: "Biblioteca Central da UnB",
    city: "Brasília",
    country: "Brasil",
    lat: -15.7613,
    lon: -47.8678,
    kind: "Universitária",
    founded: 1962,
    books: 1_000_000,
    wiki: { title: "Biblioteca Central da Universidade de Brasília", lang: "pt" },
    description: "Coração acadêmico da Universidade de Brasília, com salas de estudo 24h em períodos de prova.",
    curations: ["universitarias", "estudar"],
    hours: "Mo-Fr 07:00-23:00; Sa 08:00-18:00",
  },
  {
    name: "New York Public Library",
    city: "Nova York",
    country: "Estados Unidos",
    lat: 40.7532,
    lon: -73.9822,
    kind: "Pública",
    founded: 1895,
    books: 55_000_000,
    wiki: { title: "New York Public Library Main Branch", lang: "en" },
    description: "O icônico edifício Stephen A. Schwarzman, com leões na escadaria e a lendária Rose Main Reading Room.",
    curations: ["historicas", "mais-visitadas", "estudar", "eventos"],
    hours: "Mo,Th,Fr,Sa 10:00-18:00; Tu,We 10:00-20:00; Su 13:00-17:00",
  },
  {
    name: "Library of Congress",
    city: "Washington",
    country: "Estados Unidos",
    lat: 38.8887,
    lon: -77.0047,
    kind: "Nacional",
    founded: 1800,
    books: 175_000_000,
    wiki: { title: "Library of Congress", lang: "en" },
    description: "A maior biblioteca do mundo em itens catalogados, com acervos digitais abertos a qualquer pessoa.",
    curations: ["historicas", "mais-visitadas", "digitais"],
    hours: "Mo-Sa 08:30-17:00",
  },
  {
    name: "British Library",
    city: "Londres",
    country: "Reino Unido",
    lat: 51.5299,
    lon: -0.1277,
    kind: "Nacional",
    founded: 1973,
    books: 170_000_000,
    wiki: { title: "British Library", lang: "en" },
    description: "Guarda a Magna Carta e os cadernos de Leonardo da Vinci; uma torre de vidro com a biblioteca do Rei George III.",
    curations: ["historicas", "mais-visitadas", "estudar"],
    hours: "Mo-Th 09:30-20:00; Fr 09:30-18:00; Sa 09:30-17:00; Su 11:00-17:00",
  },
  {
    name: "Bibliothèque nationale de France",
    city: "Paris",
    country: "França",
    lat: 48.8337,
    lon: 2.3757,
    kind: "Nacional",
    founded: 1461,
    books: 40_000_000,
    wiki: { title: "Bibliothèque nationale de France", lang: "en" },
    description: "Quatro torres em forma de livros abertos e o Gallica, um dos maiores acervos digitais gratuitos do mundo.",
    curations: ["historicas", "digitais"],
  },
  {
    name: "Biblioteca do Trinity College",
    slug: "trinity-college-dublin",
    city: "Dublin",
    country: "Irlanda",
    lat: 53.344,
    lon: -6.2567,
    kind: "Universitária",
    founded: 1592,
    books: 7_000_000,
    wiki: { title: "Library of Trinity College Dublin", lang: "en" },
    description: "A Long Room e o Livro de Kells: um corredor de 65 metros de madeira escura e 200 mil livros antigos.",
    curations: ["historicas", "universitarias", "mais-visitadas"],
  },
  {
    name: "Biblioteca Joanina",
    city: "Coimbra",
    country: "Portugal",
    lat: 40.2075,
    lon: -8.4256,
    kind: "Universitária",
    founded: 1728,
    books: 60_000,
    wiki: { title: "Joanina Library", lang: "en" },
    description: "Joia barroca da Universidade de Coimbra, protegida por uma colônia de morcegos que preserva os livros.",
    curations: ["historicas", "universitarias"],
  },
  {
    name: "Oodi — Biblioteca Central de Helsinque",
    slug: "oodi-helsinki",
    city: "Helsinque",
    country: "Finlândia",
    lat: 60.1739,
    lon: 24.938,
    kind: "Pública",
    founded: 2018,
    books: 100_000,
    wiki: { title: "Helsinki Central Library Oodi", lang: "en" },
    description: "Estúdios de gravação, impressoras 3D, máquinas de costura e um terraço de leitura: a biblioteca do futuro.",
    curations: ["maker", "estudar", "criancas", "eventos"],
    hours: "Mo-Fr 08:00-22:00; Sa,Su 10:00-20:00",
    amenities: { makerspace: true, cafe: true, wifi: true },
  },
  {
    name: "Biblioteca Pública de Estocolmo",
    slug: "stockholm-public-library",
    city: "Estocolmo",
    country: "Suécia",
    lat: 59.3434,
    lon: 18.0546,
    kind: "Pública",
    founded: 1928,
    books: 2_000_000,
    wiki: { title: "Stockholm Public Library", lang: "en" },
    description: "Rotunda cilíndrica de Gunnar Asplund, onde os livros envolvem o leitor em 360 graus.",
    curations: ["historicas", "mais-visitadas"],
  },
  {
    name: "Biblioteca da Cidade de Stuttgart",
    slug: "stuttgart-city-library",
    city: "Stuttgart",
    country: "Alemanha",
    lat: 48.7907,
    lon: 9.1835,
    kind: "Pública",
    founded: 2011,
    books: 500_000,
    wiki: { title: "Stuttgart City Library", lang: "en" },
    description: "Um cubo branco minimalista com um átrio central silencioso — paraíso para estudar.",
    curations: ["estudar", "maker"],
  },
  {
    name: "Biblioteca Binhai de Tianjin",
    slug: "tianjin-binhai-library",
    city: "Tianjin",
    country: "China",
    lat: 39.0038,
    lon: 117.6829,
    kind: "Pública",
    founded: 2017,
    books: 1_200_000,
    wiki: { title: "Tianjin Binhai Library", lang: "en" },
    description: "O famoso “Olho de Binhai”: estantes ondulantes do chão ao teto em torno de uma esfera luminosa.",
    curations: ["mais-visitadas"],
  },
  {
    name: "State Library Victoria",
    city: "Melbourne",
    country: "Austrália",
    lat: -37.8098,
    lon: 144.9652,
    kind: "Pública",
    founded: 1854,
    books: 2_000_000,
    wiki: { title: "State Library Victoria", lang: "en" },
    description: "A cúpula octogonal da La Trobe Reading Room é um dos espaços de estudo mais fotografados do planeta.",
    curations: ["historicas", "estudar", "eventos"],
  },
  {
    name: "Bibliotheca Alexandrina",
    city: "Alexandria",
    country: "Egito",
    lat: 31.2089,
    lon: 29.9092,
    kind: "Nacional",
    founded: 2002,
    books: 2_000_000,
    wiki: { title: "Bibliotheca Alexandrina", lang: "en" },
    description: "Homenagem à lendária Biblioteca de Alexandria, com um disco solar inclinado sobre o Mediterrâneo.",
    curations: ["historicas", "digitais", "mais-visitadas"],
  },
  {
    name: "Biblioteca Vasconcelos",
    city: "Cidade do México",
    country: "México",
    lat: 19.4472,
    lon: -99.1528,
    kind: "Pública",
    founded: 2006,
    books: 600_000,
    wiki: { title: "Biblioteca Vasconcelos", lang: "en" },
    description: "Uma “megabiblioteca” de estantes suspensas e um esqueleto de baleia flutuando no átrio.",
    curations: ["mais-visitadas", "estudar", "criancas"],
  },
  {
    name: "Internet Archive",
    city: "São Francisco",
    country: "Estados Unidos",
    lat: 37.7823,
    lon: -122.4715,
    kind: "Digital",
    founded: 1996,
    books: 44_000_000,
    wiki: { title: "Internet Archive", lang: "en" },
    website: "https://archive.org",
    description: "Biblioteca digital sem fins lucrativos com milhões de livros, áudios, vídeos e a Wayback Machine.",
    curations: ["digitais"],
    hours: "24/7",
  },
  {
    name: "Biblioteca Comunitária Caminhos da Leitura",
    slug: "caminhos-da-leitura",
    city: "São Paulo",
    country: "Brasil",
    lat: -23.6735,
    lon: -46.7623,
    kind: "Comunitária",
    founded: 2006,
    books: 12_000,
    description: "Biblioteca comunitária no extremo sul de São Paulo, mantida por voluntários e cheia de saraus e oficinas.",
    curations: ["criancas", "eventos"],
    hours: "Tu-Sa 09:00-18:00",
  },
];

export const FEATURED_LIBRARIES: Library[] = SEEDS.map(build);

export const getFeaturedLibrary = (slug: string) => FEATURED_LIBRARIES.find((l) => l.slug === slug);

/** Converte uma biblioteca real do OpenStreetMap em um perfil da plataforma. */
export function fromOsm(o: OsmLibrary): Library {
  const t = o.tags;
  const slug = `osm-${o.osmId}`;
  const curations: CurationKey[] = [];
  if (/universit|faculdade|college/i.test(o.name) || t["library"] === "academic") curations.push("universitarias");
  if (/infantil|children|kids|crian/i.test(o.name)) curations.push("criancas");
  if (/escola|school|escolar/i.test(o.name)) curations.push("criancas");
  const kind: LibraryKind = curations.includes("universitarias")
    ? "Universitária"
    : /escola|school/i.test(o.name)
      ? "Escolar"
      : /comunit/i.test(o.name)
        ? "Comunitária"
        : "Pública";
  const d = derive(slug, {
    curations,
    amenities: {
      ...(t.wheelchair ? { acessibilidade: t.wheelchair === "yes" || t.wheelchair === "limited" } : {}),
      ...(t.internet_access ? { wifi: t.internet_access !== "no" } : {}),
    },
  });
  const address = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ") || undefined;
  return {
    slug,
    osmId: o.osmId,
    name: o.name,
    city: t["addr:city"] ?? "",
    country: t["addr:country"] ?? "",
    lat: o.lat,
    lon: o.lon,
    kind,
    featured: false,
    address: address ? `${address}${t["addr:suburb"] ? ` — ${t["addr:suburb"]}` : ""}` : undefined,
    website: t.website ?? t["contact:website"],
    phone: t.phone ?? t["contact:phone"],
    email: t.email ?? t["contact:email"],
    hours: parseOpeningHours(t.opening_hours),
    description:
      t.description ??
      `${kind === "Pública" ? "Biblioteca pública" : `Biblioteca ${kind.toLowerCase()}`} mapeada pela comunidade do OpenStreetMap. Os dados de acervo, salas e eventos são estimativas até que a biblioteca conecte seu Provider.`,
    wiki: t.wikipedia
      ? { lang: (t.wikipedia.split(":")[0] === "en" ? "en" : "pt") as "pt" | "en", title: t.wikipedia.split(":").slice(1).join(":") }
      : undefined,
    curations,
    ...d,
  };
}

export const CURATIONS: {
  key: CurationKey;
  emoji: string;
  title: string;
  description: string;
  cover: string;
}[] = [
  { key: "historicas", emoji: "📚", title: "Bibliotecas históricas", description: "Séculos de história, salões barrocos e obras raras.", cover: "bg-cover-1" },
  { key: "mais-visitadas", emoji: "🏛", title: "Mais visitadas", description: "As bibliotecas que todo mundo quer conhecer.", cover: "bg-cover-2" },
  { key: "eventos", emoji: "🎨", title: "Eventos perto de você", description: "Saraus, oficinas, clubes e exposições acontecendo agora.", cover: "bg-cover-3" },
  { key: "estudar", emoji: "☕", title: "Melhores espaços para estudar", description: "Silêncio, tomadas, Wi-Fi rápido e café por perto.", cover: "bg-cover-5" },
  { key: "criancas", emoji: "👨‍👩‍👧", title: "Bibliotecas para crianças", description: "Contação de histórias, brinquedotecas e acervo infantil.", cover: "bg-cover-4" },
  { key: "maker", emoji: "💻", title: "Com laboratório maker", description: "Impressoras 3D, eletrônica, robótica e estúdios.", cover: "bg-cover-6" },
  { key: "universitarias", emoji: "🎓", title: "Bibliotecas universitárias", description: "Acervos acadêmicos e salas de estudo em grupo.", cover: "bg-cover-7" },
  { key: "digitais", emoji: "🌎", title: "Bibliotecas digitais", description: "Milhões de livros e documentos acessíveis de qualquer lugar.", cover: "bg-cover-8" },
];
