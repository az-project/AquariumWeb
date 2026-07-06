create table if not exists public.app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  username_key text primary key,
  username text not null unique,
  password jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.app_state enable row level security;
alter table public.app_users enable row level security;

comment on table public.app_state is
  'AquariumWeb shared application state. Accessed by the Next.js server with a Supabase service role key.';

comment on table public.app_users is
  'AquariumWeb application users with existing pbkdf2 password hashes. Accessed by the Next.js server with a Supabase service role key.';
