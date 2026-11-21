create extension if not exists pgcrypto;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  meeting_date date not null,
  transcript text not null,
  analysis jsonb not null default '{}'::jsonb,
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  decision_text text not null,
  decision_status text not null default 'confirmed',
  evidence text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  title text not null,
  description text not null default '',
  assigned_to text not null default '',
  deadline date,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  evidence text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decision_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_decision_id uuid not null references public.decisions(id) on delete cascade,
  new_decision_id uuid not null references public.decisions(id) on delete cascade,
  explanation text not null default '',
  suggested_classification text not null default 'unrelated',
  review_status text not null default 'unreviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;
alter table public.decisions enable row level security;
alter table public.tasks enable row level security;
alter table public.decision_conflicts enable row level security;

create policy "Users manage their meetings" on public.meetings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their decisions" on public.decisions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their tasks" on public.tasks
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their conflicts" on public.decision_conflicts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
