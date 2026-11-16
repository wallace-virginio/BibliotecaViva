# Biblioteca Viva

Plataforma aberta e colaborativa de descoberta de conhecimento — **app mobile-first** (PWA + iOS/Android via Capacitor) com versão desktop.

## Stack

- Hospedagem: **Cloudflare Workers** (plano grátis) — no ar em https://biblioteca-viva.biblioteca-viva.workers.dev — [docs/DEPLOY.md](docs/DEPLOY.md)

- **TanStack Start v1** (React 19 + Vite 8 + Tailwind CSS v4) — rotas em arquivo em `src/routes/`
  - A versão atual do TanStack Start exige Vite 8 (o Vite 7 não é mais suportado).
- **Leaflet** + tiles do OpenStreetMap
- **Capacitor 8** para os apps nativos (Android gerado em `android/`; iOS deve ser adicionado num Mac)
- Ícones Lucide, fontes Inter/Literata/JetBrains Mono hospedadas no próprio site (Fontsource), tokens de design em `src/styles.css` (claro/escuro)

## APIs gratuitas usadas (sem chave)

| Uso | API |
| --- | --- |
| Livros, capas, avaliações, assuntos | [Open Library](https://openlibrary.org/developers/api) |
| Bibliotecas reais perto de você | [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) e [Nominatim](https://nominatim.org) em paralelo (usa o que responder primeiro) |
| Busca de cidades / geocodificação | Nominatim |
| Localização | GPS do navegador ou do Capacitor, **só** quando a pessoa toca em "Perto de mim" (nada automático) |
| Fotos das bibliotecas | Wikipédia (REST summary) + Wikimedia Commons (geosearch) |
| Leitura de livros em domínio público | Wikisource (pt/en) e Internet Archive |
| Mapa | Tiles do OpenStreetMap |

Dados que nenhuma API aberta fornece (salas e computadores livres, eventos, avaliações da comunidade, disponibilidade física dos livros) são **simulados de forma determinística** e marcados no código. Eles passariam a vir dos *Providers* de cada biblioteca.

## Estrutura de app mobile

- Barra de abas inferior (Início · Mapa · Acervo · Eventos · Perfil) e app bar compacta abaixo de `lg`
- `/mapa` em tela cheia com bottom sheets (lista e painel da biblioteca)
- Safe areas (`env(safe-area-inset-*)`), alvos de toque ≥ 44px, sem zoom automático em inputs no iOS
- PWA: `public/manifest.webmanifest`, ícones em `public/icons`, service worker `public/sw.js` (offline básico)
- Nativo: `capacitor.config.ts`, `src/lib/native.ts` (status bar, splash, geolocalização nativa)

## Scripts

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # build SSR (dist/client + dist/server)
npm run start          # preview do build no runtime da Cloudflare (workerd)
npm run deploy         # publica na Cloudflare (grátis) — veja docs/DEPLOY.md
```

Deploy automático: cada push na branch `main` do GitHub publica uma nova versão (Cloudflare Workers Builds).

```bash
npm run build:mobile   # bundle SPA estático em dist/mobile
npm run cap:android    # build mobile + sync + abre o Android Studio
npm run cap:ios        # (macOS) depois de `npx cap add ios`
npm run icons          # regenera os ícones
```

## Rotas

`/` · `/mapa` · `/descobrir` · `/biblioteca/:slug` (curadas ou `osm-<tipo>-<id>`) · `/acervo` · `/livro/:id` · `/eventos` · `/salas` · `/comunidade` · `/sobre` · `/entrar` · `/assistente` · `/roadmap` · `/app` (+ `livros`, `favoritos`, `reservas`, `eventos`, `salas`, `comunidade`, `configuracoes`, `perfil`, `admin`, `desenvolvedor`)

**Área do desenvolvedor:** não aparece nas telas públicas. O usuário cria a conta e ativa em *Configurações → Desenvolvedor* (`/app/configuracoes?aba=desenvolvedor`). Só então `/app/desenvolvedor` (SDKs, API Playground, marketplace de conectores) entra no menu.

## Login (Supabase)

E-mail e senha, Google e Apple via Supabase Auth (PKCE), com recuperação de senha e deep link para o app nativo. `/app/*` exige sessão. Favoritos, reservas, histórico, progresso de leitura e modo desenvolvedor são salvos no aparelho e sincronizados na tabela `user_state`.

Passo a passo (SQL, URLs de redirecionamento, Google e Apple): [docs/SUPABASE.md](docs/SUPABASE.md). Sem `.env.local` o app roda em modo demonstração.

## Leitura de livros gratuitos

`/ler/:id` abre livros em domínio público: texto limpo por capítulo via **Wikisource** (com tamanho de fonte, temas claro/sépia/escuro e progresso salvo) ou páginas digitalizadas do **Internet Archive**. Livros protegidos mostram onde retirar o exemplar físico. Reservas em *Minha biblioteca* abrem direto no leitor.

## Privacidade e LGPD

- **Isolamento:** RLS em todas as tabelas — cada usuário só lê/escreve os próprios dados. Nenhuma chave secreta no app.
- **Consentimento:** aceite obrigatório no cadastro (com declaração de idade/responsável) e tela de aceite para quem entra com Google/Apple ou quando os documentos mudam de versão (`src/lib/legal.ts`). A prova fica na tabela `consents`.
- **Direitos do titular:** *Configurações → Privacidade* tem "Baixar meus dados" (JSON) e "Excluir minha conta".
- **Minimização:** localização só sob demanda, fontes locais (sem Google Fonts), sem analytics nem publicidade; dados de uso sem login não são misturados à conta.
- **Documentos:** [/privacidade](src/routes/privacidade.tsx) e [/termos](src/routes/termos.tsx) — minutas para revisão jurídica. Preencha os dados do controlador e do encarregado em `src/lib/legal.ts`.
