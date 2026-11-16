-- =============================================================
-- Biblioteca Viva — segurança + LGPD
-- Rode no SQL Editor DEPOIS do schema.sql. É idempotente.
-- =============================================================

-- ---------- 1. Usuário só altera campos seguros do próprio perfil ----------
-- account_type, id e created_at deixam de ser alteráveis pelo app (evita escalada de privilégio).
revoke update on public.profiles from anon, authenticated;
grant update (full_name, developer_mode, avatar_url, updated_at) on public.profiles to authenticated;

-- ---------- 2. Registro de consentimentos (LGPD art. 8º: o controlador deve provar o consentimento) ----------
create table if not exists public.consents (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  document    text not null check (document in ('termos', 'privacidade', 'idade')),
  version     text not null,
  accepted_at timestamptz not null default now(),
  user_agent  text
);
create index if not exists consents_user_idx on public.consents (user_id, document, version);

alter table public.consents enable row level security;

drop policy if exists "consentimento: dono lê" on public.consents;
create policy "consentimento: dono lê" on public.consents
  for select using (auth.uid() = user_id);

drop policy if exists "consentimento: dono registra" on public.consents;
create policy "consentimento: dono registra" on public.consents
  for insert with check (auth.uid() = user_id);
-- Sem update/delete: o histórico de aceites não pode ser editado pelo app.

-- Cadastro por e-mail: o app envia as versões aceitas nos metadados; o gatilho grava a prova
-- com o horário do servidor (o horário enviado pelo cliente não é confiável).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name, account_type, avatar_url)
  values (
    new.id,
    coalesce(meta ->> 'full_name', meta ->> 'name'),
    case when meta ->> 'account_type' = 'biblioteca' then 'biblioteca' else 'leitor' end,
    meta ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  if meta ? 'terms_version' then
    insert into public.consents (user_id, document, version, accepted_at, user_agent)
    values
      (new.id, 'termos',      meta ->> 'terms_version',   now(), meta ->> 'consent_ua'),
      (new.id, 'privacidade', meta ->> 'privacy_version', now(), meta ->> 'consent_ua'),
      (new.id, 'idade',       meta ->> 'terms_version',   now(), meta ->> 'consent_ua');
  end if;
  return new;
end;
$$;

-- ---------- 3. Excluir a própria conta (LGPD art. 18, VI) ----------
-- Apaga o usuário em auth.users; profiles, user_state e consents somem em cascata.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- A função do gatilho não deve ser chamável pela API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------- 4. user_state: dono também pode apagar os próprios dados ----------
drop policy if exists "estado: dono apaga" on public.user_state;
create policy "estado: dono apaga" on public.user_state
  for delete using (auth.uid() = user_id);
