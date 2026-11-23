-- =============================================================
-- Biblioteca Viva — histórico do assistente "Peça uma indicação"
-- Rode no SQL Editor DEPOIS do 002. É idempotente.
--
-- Proteção em duas camadas:
--  1. RLS: cada conversa pertence a um usuário (user_id) e só o dono lê, cria, altera ou apaga.
--  2. Criptografia: título e mensagens chegam aqui JÁ CRIPTOGRAFADOS (AES-256-GCM) pelo servidor do app,
--     com uma chave por usuário derivada de um segredo guardado na Cloudflare (não no Supabase).
--     Quem tiver acesso ao banco (ou a um backup vazado) vê só texto embaralhado.
-- Ao excluir a conta, as conversas somem junto (on delete cascade).
-- =============================================================

create table if not exists public.assistant_conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title_enc     text not null check (length(title_enc) < 2000),
  messages_enc  text not null check (length(messages_enc) < 300000),
  message_count integer not null default 0 check (message_count between 0 and 400),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists assistant_conversations_user_idx
  on public.assistant_conversations (user_id, updated_at desc);

alter table public.assistant_conversations enable row level security;

drop policy if exists "conversa: dono lê" on public.assistant_conversations;
create policy "conversa: dono lê" on public.assistant_conversations
  for select using (auth.uid() = user_id);

drop policy if exists "conversa: dono cria" on public.assistant_conversations;
create policy "conversa: dono cria" on public.assistant_conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "conversa: dono altera" on public.assistant_conversations;
create policy "conversa: dono altera" on public.assistant_conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "conversa: dono apaga" on public.assistant_conversations;
create policy "conversa: dono apaga" on public.assistant_conversations
  for delete using (auth.uid() = user_id);

-- Visitantes (sem login) não têm acesso nenhum; usuários logados só pelas políticas acima.
revoke all on public.assistant_conversations from anon;
grant select, insert, update, delete on public.assistant_conversations to authenticated;

-- Limite de conversas guardadas por pessoa (evita abuso de espaço): mantém as 200 mais recentes.
create or replace function public.trim_assistant_conversations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.assistant_conversations
  where user_id = new.user_id
    and id in (
      select id from public.assistant_conversations
      where user_id = new.user_id
      order by updated_at desc
      offset 200
    );
  return new;
end;
$$;

drop trigger if exists assistant_conversations_trim on public.assistant_conversations;
create trigger assistant_conversations_trim
  after insert on public.assistant_conversations
  for each row execute function public.trim_assistant_conversations();
