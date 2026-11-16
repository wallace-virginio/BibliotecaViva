# Publicando na Cloudflare (grátis)

O site roda como um **Cloudflare Worker** (SSR do TanStack Start) e os arquivos estáticos ficam no armazenamento de assets da Cloudflare. Tudo no plano gratuito:

- 100 mil requisições por dia ao Worker (páginas renderizadas no servidor);
- arquivos estáticos (JS, CSS, imagens, ícones) ilimitados e sem custo;
- HTTPS automático e CDN global (inclusive São Paulo).

Endereço gerado: `https://biblioteca-viva.biblioteca-viva.workers.dev`. O subdomínio é escolhido no primeiro deploy e o domínio próprio pode ser ligado depois.

Bundle atual: ~500 KB comprimidos (o limite do plano grátis é 3 MB).

---

## Opção A — Publicar do seu computador (mais rápido)

1. Crie a conta grátis em https://dash.cloudflare.com/sign-up
2. No terminal, na pasta do projeto:

```bash
npx wrangler login
```

```bash
npm run deploy
```

O `npm run deploy` faz o build (lendo o `.env.local` com a URL e a publishable key do Supabase) e envia para a Cloudflare. No primeiro deploy, a Wrangler pede para registrar o seu subdomínio `*.workers.dev`.

Para atualizar o site depois, basta rodar `npm run deploy` de novo.

## Opção B — Deploy automático a cada push no GitHub

1. Suba o projeto para um repositório no GitHub (o `.env.local` fica de fora pelo `.gitignore`).
2. No painel da Cloudflare: **Workers & Pages → Create → Import a repository** e escolha o repositório.
3. Configuração do build:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
4. Não é preciso cadastrar variáveis: a URL e a publishable key do Supabase (públicas por natureza) estão em `.env.production`, versionado no repositório.
5. Salve e rode o primeiro deploy. Cada push na branch principal publica de novo; outras branches geram URLs de prévia.

> Nunca cadastre a **secret key** do Supabase na Cloudflare nem em lugar nenhum do app.

---

## Depois do primeiro deploy

**Supabase** (*Authentication → URL Configuration*):

- **Site URL:** `https://biblioteca-viva.biblioteca-viva.workers.dev`
- **Redirect URLs:** adicione `https://biblioteca-viva.biblioteca-viva.workers.dev/**` (mantenha as de `localhost` para desenvolver)

**Google OAuth** (se for ativar): em *Authorized JavaScript origins*, adicione o mesmo endereço `https://…workers.dev`.

**iPhone/Android:** abra o endereço no navegador, toque em Compartilhar → *Adicionar à Tela de Início*. Com HTTPS, GPS, instalação e modo offline funcionam.

## Domínio próprio (opcional, pago)

Com um domínio (ex.: `bibliotecaviva.org`, ~R$ 40–80/ano): *Workers & Pages → biblioteca-viva → Settings → Domains & Routes → Add → Custom domain*. Depois, troque a Site URL e as Redirect URLs no Supabase.

## Testar localmente no mesmo runtime da Cloudflare

```bash
npm run build && npm run start
```

Abre o build de produção em `http://localhost:3000` rodando no `workerd` (o mesmo motor da Cloudflare).
