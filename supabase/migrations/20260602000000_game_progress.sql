create table if not exists public.game_progress (
  session_id text primary key,
  hero_x double precision not null default 18,
  mounted boolean not null default true,
  inside_castle boolean not null default false,
  gold integer not null default 350,
  destination text,
  state_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_progress enable row level security;

create policy "allow all for game progress"
  on public.game_progress for all
  using (true)
  with check (true);
