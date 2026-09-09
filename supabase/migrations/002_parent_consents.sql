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
