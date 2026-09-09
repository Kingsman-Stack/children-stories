create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  age_band text not null check (age_band in ('toddler', 'early-reader', 'middle-grade')),
  created_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete set null,
  title text not null,
  language text not null,
  status text not null default 'queued' check (status in ('queued', 'generating', 'ready', 'failed', 'blocked')),
  story_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.child_profiles enable row level security;
alter table public.stories enable row level security;

create policy "parents manage their child profiles" on public.child_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "parents manage their stories" on public.stories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.parent_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.parent_consents enable row level security;
create policy "parents manage their own consent" on public.parent_consents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
