# Configurando o Supabase (login e sincronização)

Projeto: o seu, em https://supabase.com/dashboard (troque `<id-do-projeto>` abaixo pelo ID dele).

> **Segurança:** o app usa só a **publishable key** (`.env.local`). A **secret key** nunca vai para o código, para o app ou para o repositório. Se ela foi compartilhada em algum lugar, revogue-a e gere outra em *Project Settings → API Keys*.

## 1. Variáveis de ambiente

`.env.local` (já criado, fora do git):

```
VITE_SUPABASE_URL=https://<id-do-projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Reinicie o `npm run dev` depois de alterar este arquivo.

## 2. Banco de dados

*SQL Editor → New query* → cole o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.

Cria as tabelas `profiles` e `user_state`, as políticas de segurança (RLS — cada usuário só lê e escreve os próprios dados) e o gatilho que cria o perfil no cadastro.

Depois rode também [`supabase/migrations/002_lgpd_seguranca.sql`](../supabase/migrations/002_lgpd_seguranca.sql) (segurança + LGPD):

- trava `account_type`, `id` e `created_at` contra alteração pelo app;
- cria a tabela `consents` (prova dos aceites de Termos/Privacidade, sem edição);
- cria `delete_my_account()` — o botão "Excluir minha conta" apaga tudo em cascata;
- permite ao usuário apagar o próprio `user_state`.

### Configurações de segurança recomendadas

- *Authentication → Sign In / Providers → Email*: **Minimum password length = 8** (o app já exige 8).
- *Authentication → Attack Protection*: ative **Leaked password protection** se o seu plano permitir, e o CAPTCHA (hCaptcha/Turnstile) quando abrir o cadastro ao público.
- *Advisors → Security Advisor*: rode e confirme que não há tabelas sem RLS.
- *Project Settings → General*: confira a **região** do projeto. Se não for `sa-east-1` (São Paulo), há transferência internacional de dados — já prevista na Política de Privacidade.
- *Project Settings → API Keys*: revogue a secret key que foi compartilhada e gere outra.

## 3. URLs de redirecionamento

*Authentication → URL Configuration*:

- **Site URL:** `http://localhost:3000` (troque pelo domínio de produção quando publicar)
- **Redirect URLs** (adicione todas):
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/redefinir-senha`
  - `http://192.168.15.7:3000/**` (teste no celular pela rede local)
  - `org.bibliotecaviva.app://login-callback` (app nativo iOS/Android)
  - o site publicado na Cloudflare: `https://<seu-site>/**` (veja [DEPLOY.md](DEPLOY.md))
  - um domínio próprio, se tiver: `https://bibliotecaviva.org/**`

## 4. E-mail e senha

*Authentication → Sign In / Providers → Email*: já vem ativo. Mantenha **Confirm email** ligado (o app mostra a tela "Confirme seu e-mail").

O servidor de e-mail padrão do Supabase envia poucas mensagens por hora. Para produção, configure um SMTP próprio em *Authentication → Emails → SMTP Settings* (Resend, SendGrid, Amazon SES…).

## 5. Google

1. Em https://console.cloud.google.com crie um projeto → *APIs & Services → OAuth consent screen* (tipo External, preencha nome e e-mail).
2. *Credentials → Create credentials → OAuth client ID* → tipo **Web application**.
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `https://<id-do-projeto>.supabase.co/auth/v1/callback`
3. Copie *Client ID* e *Client secret* para *Supabase → Authentication → Sign In / Providers → Google* e ative.

## 6. Apple

Exige conta **Apple Developer** (US$ 99/ano).

1. https://developer.apple.com/account → *Identifiers*:
   - **App ID** `org.bibliotecaviva.app` com a capability *Sign in with Apple*.
   - **Services ID** (ex.: `org.bibliotecaviva.web`) com *Sign in with Apple* → *Configure*:
     - Domains: `<id-do-projeto>.supabase.co`
     - Return URL: `https://<id-do-projeto>.supabase.co/auth/v1/callback`
2. *Keys* → crie uma chave com *Sign in with Apple* e baixe o `.p8`.
3. *Supabase → Authentication → Sign In / Providers → Apple*: informe o Services ID, Team ID, Key ID e o conteúdo do `.p8` (o painel gera o client secret). Ative.

> A App Store exige "Entrar com Apple" quando o app oferece outro login social (Google). Por isso os dois botões estão no app.

## 7. App nativo

- **Android:** o deep link `org.bibliotecaviva.app://login-callback` já está no `AndroidManifest.xml`.
- **iOS** (num Mac, depois de `npx cap add ios`): em `ios/App/App/Info.plist`, adicione em *URL Types* o esquema `org.bibliotecaviva.app`. No Xcode, ative a capability *Sign in with Apple*.

## Como funciona no código

| Arquivo | Papel |
| --- | --- |
| `src/lib/supabase.ts` | cliente (PKCE, sessão no aparelho) |
| `src/lib/auth.tsx` | `AuthProvider` / `useAuth`: login, cadastro, Google/Apple, recuperação de senha, logout |
| `src/lib/sync.ts` | mescla e sincroniza favoritos, reservas, leitura e modo desenvolvedor com a tabela `user_state` |
| `src/routes/entrar.tsx` | login e cadastro |
| `src/routes/recuperar-senha.tsx`, `redefinir-senha.tsx` | recuperação de senha |
| `src/routes/auth.callback.tsx` | retorno do OAuth e da confirmação de e-mail |
| `src/routes/app.tsx` | protege `/app/*`: sem sessão, redireciona para `/entrar?redirect=…` |
