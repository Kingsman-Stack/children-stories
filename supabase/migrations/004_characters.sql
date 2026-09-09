create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  traits text not null default '',
  created_at timestamptz not null default now()
);

alter table public.characters enable row level security;
create policy "parents manage their characters" on public.characters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
