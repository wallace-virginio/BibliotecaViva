-- =============================================================
-- Biblioteca Viva — schema do Supabase
-- Rode este arquivo inteiro em: Dashboard → SQL Editor → New query → Run
-- (é idempotente: pode rodar de novo sem quebrar nada)
-- =============================================================

-- ---------- Perfis ----------
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text,
  account_type   text not null default 'leitor' check (account_type in ('leitor', 'biblioteca')),
  developer_mode boolean not null default false,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfil: dono lê" on public.profiles;
create policy "perfil: dono lê" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "perfil: dono atualiza" on public.profiles;
create policy "perfil: dono atualiza" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- Estado do app por usuário (favoritos, reservas, leitura…) ----------
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "estado: dono lê" on public.user_state;
create policy "estado: dono lê" on public.user_state
  for select using (auth.uid() = user_id);

drop policy if exists "estado: dono cria" on public.user_state;
create policy "estado: dono cria" on public.user_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "estado: dono atualiza" on public.user_state;
create policy "estado: dono atualiza" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Cria o perfil automaticamente no cadastro ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, account_type, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when new.raw_user_meta_data ->> 'account_type' = 'biblioteca' then 'biblioteca' else 'leitor' end,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfis para contas que já existiam antes deste script
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
from auth.users
on conflict (id) do nothing;
