-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  scheduled_at timestamptz,                         -- null = posted immediately
  draft        jsonb not null,                      -- { text, mediaKind, mediaUrl }
  platforms    text[] not null,
  status       text not null check (status in ('scheduled','publishing','published','partial','failed','cancelled')),
  results      jsonb not null default '[]'::jsonb
);

-- Lets the scheduler find due posts quickly.
create index if not exists posts_due_idx on public.posts (scheduled_at) where status = 'scheduled';

-- Lock the table: with RLS on and no policies, the public "anon" key can't read
-- or write it. The app's server uses the service-role key, which bypasses RLS.
alter table public.posts enable row level security;
