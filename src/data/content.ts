import { CalendarCheck, FileScan, GraduationCap, Landmark, Map as MapIcon, School, ScanEye, ScrollText, Users, Wallet } from "lucide-react";
import { FEATURED_LIBRARIES } from "./libraries";

/* ---------------- Eventos globais ---------------- */
export type PlatformEvent = {
  id: string;
  title: string;
  category: "Clube de leitura" | "Oficina" | "Curso" | "Cultura" | "Crianças" | "Exposição" | "Hackathon";
  librarySlug: string;
  date: Date;
  time: string;
  durationMin: number;
  spots: number;
  spotsLeft: number;
  online: boolean;
  bookSubject?: string;
  description: string;
};

function day(offset: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

const lib = (i: number) => FEATURED_LIBRARIES[i % FEATURED_LIBRARIES.length].slug;

export const EVENTS: PlatformEvent[] = [
  { id: "ev-1", title: "Clube de leitura: Dom Casmurro", category: "Clube de leitura", librarySlug: lib(1), date: day(0), time: "19:00", durationMin: 90, spots: 30, spotsLeft: 7, online: false, description: "Capitu traiu ou não traiu? Traga sua interpretação para uma conversa aberta sobre o clássico de Machado de Assis." },
  { id: "ev-2", title: "Introdução à Inteligência Artificial", category: "Curso", librarySlug: lib(13), date: day(1), time: "18:30", durationMin: 120, spots: 40, spotsLeft: 12, online: true, description: "Conceitos de IA, redes neurais e modelos de linguagem explicados sem matemática pesada." },
  { id: "ev-3", title: "Contação de histórias na praça", category: "Crianças", librarySlug: lib(3), date: day(1), time: "10:00", durationMin: 60, spots: 50, spotsLeft: 22, online: false, description: "Histórias, músicas e fantoches para crianças de 3 a 9 anos." },
  { id: "ev-4", title: "Oficina de impressão 3D", category: "Oficina", librarySlug: lib(13), date: day(2), time: "14:00", durationMin: 150, spots: 12, spotsLeft: 2, online: false, description: "Modele e imprima sua primeira peça no makerspace." },
  { id: "ev-5", title: "Exposição: Mapas do Brasil Colônia", category: "Exposição", librarySlug: lib(0), date: day(2), time: "10:00", durationMin: 420, spots: 200, spotsLeft: 140, online: false, description: "Cartografia rara dos séculos XVI a XVIII do acervo de obras raras." },
  { id: "ev-6", title: "Hackathon: Providers para bibliotecas", category: "Hackathon", librarySlug: lib(1), date: day(3), time: "09:00", durationMin: 600, spots: 80, spotsLeft: 31, online: true, description: "Crie um conector para a biblioteca da sua cidade com o SDK da Biblioteca Viva. Mentoria e prêmios." },
  { id: "ev-7", title: "Sarau de poesia periférica", category: "Cultura", librarySlug: lib(21), date: day(4), time: "19:30", durationMin: 120, spots: 60, spotsLeft: 18, online: false, description: "Microfone aberto para poetas, slammers e curiosos." },
  { id: "ev-8", title: "Escrita criativa: contos curtos", category: "Oficina", librarySlug: lib(7), date: day(5), time: "15:00", durationMin: 120, spots: 20, spotsLeft: 0, online: false, description: "Exercícios práticos para destravar a escrita e terminar seu primeiro conto." },
  { id: "ev-9", title: "Clube de ficção científica: Duna", category: "Clube de leitura", librarySlug: lib(9), date: day(6), time: "18:00", durationMin: 90, spots: 25, spotsLeft: 9, online: true, bookSubject: "science_fiction", description: "Política, ecologia e religião em Arrakis — leitura do primeiro livro." },
];

/* ---------------- Métricas da comunidade ---------------- */
export const COMMUNITY_STATS = [
  { label: "Bibliotecas conectadas", value: 12_480, suffix: "" },
  { label: "Conectores desenvolvidos", value: 386, suffix: "" },
  { label: "Contribuidores", value: 2_140, suffix: "" },
  { label: "Cidades participantes", value: 1_275, suffix: "" },
  { label: "Eventos cadastrados", value: 58_930, suffix: "" },
  { label: "Livros indexados", value: 41_000_000, suffix: "+" },
];

export const OPEN_SOURCE_STATS = [
  { label: "Contribuidores", value: 2_140 },
  { label: "Commits", value: 48_312 },
  { label: "Releases", value: 127 },
  { label: "Conectores publicados", value: 386 },
  { label: "Bibliotecas conectadas", value: 12_480 },
  { label: "Países participantes", value: 64 },
];

/* ---------------- Roadmap ---------------- */
export type RoadmapItem = {
  version: string;
  title: string;
  /** só quando houver data combinada; o roadmap não promete prazo que ainda não existe */
  period?: string;
  status: "lançado" | "em desenvolvimento" | "planejado";
  items: string[];
};

/**
 * Mantenha em dia com o que está no ar: o que está desligado em lib/features.ts é "em desenvolvimento"
 * (e mostra a tela do Ori); quando a flag for ligada, mova o item para "lançado".
 */
export const ROADMAP: RoadmapItem[] = [
  { version: "Mapa", title: "Bibliotecas reais perto de você", status: "lançado", items: ["Bibliotecas reais do OpenStreetMap, no Brasil e no mundo", "Horário de hoje, distância e fotos de cada biblioteca", "Localização só quando você pede, sem rastrear"] },
  { version: "Acervo", title: "Livros para buscar e ler de graça", status: "lançado", items: ["Busca em mais de 40 milhões de títulos, com filtro por gênero e por autor", "Sugestões enquanto você digita e ranking da semana", "Clássicos em domínio público para ler no próprio app"] },
  { version: "Conta", title: "Sua estante e suas conquistas", status: "lançado", items: ["Cadastro com e-mail e senha", "Minha estante, favoritos e progresso de leitura salvos na conta", "Conquistas de leitura e configurações que ficam salvas", "Baixar meus dados e excluir a conta, como manda a LGPD"] },
  { version: "Ori", title: "Ori, o assistente com IA", status: "lançado", items: ["Indicações de livros e bibliotecas conversando normalmente", "Histórico das suas conversas, criptografado"] },
  { version: "App", title: "Aplicativo para celular", status: "em desenvolvimento", items: ["Versão Android em testes", "Publicação na Play Store", "Versão para iPhone"] },
  { version: "Bibliotecas", title: "Agenda, salas e reservas", status: "em desenvolvimento", items: ["Agenda real de eventos, clubes de leitura e oficinas", "Salas de estudo e computadores livres", "Reserva de livros na biblioteca", "Painel para a biblioteca cuidar de tudo isso"] },
  { version: "Comunidade", title: "Leitores conversando", status: "em desenvolvimento", items: ["Avaliações de bibliotecas e livros", "Perfis e clubes de leitores"] },
  { version: "Depois", title: "O que vem em seguida", status: "planejado", items: ["Entrar com Google e Apple", "Notificações de eventos e reservas", "Versões em inglês e espanhol", "Check-in por QR Code e modo offline", "Integração com os sistemas das bibliotecas (Providers e SDKs)", "Digitalização colaborativa de acervos"] },
];

/* ---------------- Funcionalidades futuras ---------------- */
export const FUTURE_FEATURES = [
  { icon: ScanEye, title: "Realidade Aumentada", description: "Aponte a câmera e encontre o livro na estante." },
  { icon: MapIcon, title: "Indoor Maps", description: "Navegação dentro da biblioteca, andar por andar." },
  { icon: CalendarCheck, title: "Reserva automática de salas", description: "A sala certa, no horário certo, sem fila." },
  { icon: Wallet, title: "Carteira Digital", description: "Sua carteirinha de todas as bibliotecas no celular." },
  { icon: Users, title: "Leitura colaborativa", description: "Anotações e discussões compartilhadas por capítulo." },
  { icon: ScrollText, title: "Digitalização histórica", description: "Livros raros preservados e acessíveis a todos." },
  { icon: FileScan, title: "OCR de documentos antigos", description: "Manuscritos e jornais transformados em texto pesquisável." },
  { icon: School, title: "Integração com escolas", description: "Listas de leitura e projetos ligados ao currículo." },
  { icon: GraduationCap, title: "Integração com universidades", description: "Acervos acadêmicos e repositórios abertos." },
  { icon: Landmark, title: "Integração com museus", description: "Coleções, exposições e acervos conectados." },
];

export const STATUS_TONE = { lançado: "success", "em desenvolvimento": "primary", planejado: "neutral" } as const;

/* ---------------- Desenvolvedores ---------------- */
export const SDKS = [
  { name: ".NET", lang: "C#", install: "dotnet add package BibliotecaViva.Sdk", downloads: 182_400, color: "bg-cover-6" },
  { name: "Java", lang: "Java", install: 'implementation("org.bibliotecaviva:sdk:2.4.0")', downloads: 96_100, color: "bg-cover-1" },
  { name: "Node.js", lang: "TypeScript", install: "npm install @biblioteca-viva/sdk", downloads: 421_900, color: "bg-cover-4" },
  { name: "Python", lang: "Python", install: "pip install biblioteca-viva", downloads: 288_300, color: "bg-cover-2" },
  { name: "Go", lang: "Go", install: "go get github.com/biblioteca-viva/sdk-go", downloads: 54_700, color: "bg-cover-8" },
  { name: "Rust", lang: "Rust", install: "cargo add biblioteca-viva", downloads: 31_200, color: "bg-cover-3" },
];

export const CONNECTORS = [
  { name: "provider-pergamum", kind: "Provider", author: "ana-dev", stars: 1240, description: "Conecta bibliotecas que usam o sistema Pergamum.", verified: true },
  { name: "provider-koha", kind: "Provider", author: "koha-br", stars: 2310, description: "Integração completa com o Koha ILS (open source).", verified: true },
  { name: "provider-sophia", kind: "Provider", author: "rafa.codes", stars: 640, description: "Acervo e reservas para bibliotecas com Sophia.", verified: false },
  { name: "provider-openlibrary", kind: "Provider", author: "biblioteca-viva", stars: 3120, description: "Usa a Open Library como fonte de metadados de livros.", verified: true },
  { name: "provider-sp-municipal", kind: "Provider", author: "sampa-livre", stars: 880, description: "Bibliotecas municipais de São Paulo via dados abertos.", verified: true },
  { name: "util-isbn-normalizer", kind: "Utilitário", author: "lu-mendes", stars: 410, description: "Valida e normaliza ISBN-10 / ISBN-13.", verified: false },
  { name: "util-marc21-parser", kind: "Utilitário", author: "metadata-lab", stars: 1505, description: "Parser rápido de registros MARC21.", verified: true },
  { name: "util-opening-hours", kind: "Utilitário", author: "osm-brasil", stars: 720, description: "Interpreta horários no formato do OpenStreetMap.", verified: false },
];

export const CONTRIBUTORS = [
  { name: "Ana Ribeiro", handle: "ana-dev", commits: 1842, connectors: 12, city: "Recife" },
  { name: "Kenji Watanabe", handle: "kenjiw", commits: 1530, connectors: 8, city: "Osaka" },
  { name: "Lucas Mendes", handle: "lu-mendes", commits: 1288, connectors: 9, city: "Porto Alegre" },
  { name: "Amara Okafor", handle: "amara-o", commits: 1104, connectors: 6, city: "Lagos" },
  { name: "Sofía García", handle: "sofiag", commits: 987, connectors: 7, city: "Bogotá" },
  { name: "Rafael Costa", handle: "rafa.codes", commits: 902, connectors: 5, city: "Belo Horizonte" },
];

export const PROVIDER_EXAMPLE = `import { defineProvider } from "@biblioteca-viva/sdk";

export default defineProvider({
  id: "biblioteca-municipal-recife",
  name: "Biblioteca Municipal do Recife",
  location: { lat: -8.0631, lon: -34.8711 },

  async catalog({ query, page }) {
    const res = await fetch(\`https://acervo.recife.example/api?q=\${query}&p=\${page}\`);
    const data = await res.json();
    return data.items.map((item) => ({
      isbn: item.isbn,
      title: item.titulo,
      authors: item.autores,
      available: item.exemplares_disponiveis > 0,
      shelf: item.localizacao,
    }));
  },

  async events() {
    return fetchAgenda(); // 🎉 aparece no mapa automaticamente
  },
});`;

/* ---------------- Usuário (mock) ---------------- */
export const USER = {
  name: "Wallace",
  fullName: "Wallace Virgínio",
  handle: "wallace",
  city: "São Paulo",
  memberSince: "2025",
  stats: { read: 27, reserved: 3, events: 11, libraries: 6, hours: 184, streak: 12, rank: 142 },
  readingNow: [
    { id: "OL1003040W", title: "Dom Casmurro", author: "Machado de Assis", coverId: 647501, progress: 64 },
    { id: "OL1003134W", title: "O Alienista", author: "Machado de Assis", coverId: 647504, progress: 31 },
  ],
};

// As conquistas ficam em src/lib/badges.ts (todas reais, calculadas da atividade da pessoa).

export const RANKING = [
  { name: "Marina Alves", points: 9820 },
  { name: "Pedro Henrique", points: 9410 },
  { name: "Júlia Santos", points: 8870 },
  { name: "Wallace Virgínio", points: 8640, me: true },
  { name: "Carlos Eduardo", points: 8120 },
];

export const STUDY_GROUPS = [
  { name: "Vestibular 2027 — Exatas", members: 128, next: "Qui · 19h", library: "Biblioteca Mário de Andrade" },
  { name: "Clube de Ficção Científica", members: 342, next: "Sáb · 18h", library: "Online" },
  { name: "Python do zero", members: 211, next: "Ter · 20h", library: "Oodi — Helsinque (online)" },
  { name: "Leitura de clássicos brasileiros", members: 96, next: "Dom · 10h", library: "Biblioteca de São Paulo" },
];

export const FAQ = [
  { q: "Preciso de carteirinha para frequentar?", a: "Não. A entrada é livre; a carteirinha só é necessária para empréstimos domiciliares." },
  { q: "Posso reservar uma sala de estudo pela plataforma?", a: "Sim. Escolha a sala, o horário e confirme — você recebe a confirmação no dashboard." },
  { q: "Como doar livros?", a: "Use a seção de doações: a equipe avalia e agenda o recebimento." },
  { q: "A biblioteca tem acessibilidade?", a: "Os recursos de acessibilidade disponíveis estão listados nos serviços desta página." },
];

/* ---------------- Clássicos gratuitos (domínio público, leitura no app) ---------------- */
export const FREE_CLASSICS: { id: string; title: string; author: string; coverId?: number }[] = [
  { id: "OL1003040W", title: "Dom Casmurro", author: "Machado de Assis", coverId: 647501 },
  { id: "OL1003017W", title: "Memórias Póstumas de Brás Cubas", author: "Machado de Assis", coverId: 123152 },
  { id: "OL1003134W", title: "O Alienista", author: "Machado de Assis", coverId: 647504 },
  { id: "OL1525650W", title: "Iracema", author: "José de Alencar", coverId: 2664651 },
  { id: "OL10342454W", title: "O Cortiço", author: "Aluísio Azevedo", coverId: 8176059 },
  { id: "OL138052W", title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", coverId: 10527843 },
];
