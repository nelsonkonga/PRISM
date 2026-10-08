-- À exécuter une fois dans Supabase → SQL Editor.
-- Crée le profil, les réglages, les sessions et le stockage privé des copies.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  establishment text not null default '',
  role text not null default 'Enseignant'
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  model text not null default 'gemini-2.5-flash',
  temperature text not null default '0.1',
  local_mode boolean not null default false,
  anonymize boolean not null default true,
  connection text not null default 'a_verifier',
  last_check text not null default ''
);

create table if not exists public.sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "settings_select_own" on public.settings;
drop policy if exists "settings_update_own" on public.settings;
drop policy if exists "settings_insert_own" on public.settings;
create policy "settings_select_own" on public.settings for select to authenticated using (user_id = auth.uid());
create policy "settings_update_own" on public.settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "settings_insert_own" on public.settings for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "sessions_all_own" on public.sessions;
create policy "sessions_all_own" on public.sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, establishment, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'establishment', ''),
    'Enseignant'
  )
  on conflict (id) do nothing;
  insert into public.settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.sessions where user_id = auth.uid();
  delete from public.settings where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

insert into storage.buckets (id, name, public)
values ('prism', 'prism', false)
on conflict (id) do nothing;

drop policy if exists "prism_read_own" on storage.objects;
drop policy if exists "prism_insert_own" on storage.objects;
drop policy if exists "prism_update_own" on storage.objects;
drop policy if exists "prism_delete_own" on storage.objects;
create policy "prism_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'prism' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "prism_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'prism' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "prism_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'prism' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "prism_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'prism' and (storage.foldername(name))[1] = auth.uid()::text);
