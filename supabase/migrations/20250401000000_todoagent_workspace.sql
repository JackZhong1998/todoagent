-- TodoAgent workspace tables + RLS for Clerk JWT (subject = Clerk user id).
--
-- Dashboard setup (do once per project):
-- 1) Clerk: JWT Templates → use Supabase template (name often "supabase") so tokens include
--    aud compatible with Supabase third-party auth.
-- 2) Supabase: Authentication → Sign In / Providers → add Clerk (or Third-party auth per current docs).
--
-- RLS uses auth.jwt() ->> 'sub' which must match Clerk's user id on each row's user_id column.

create table if not exists public.todoagent_projects (
  id text not null,
  user_id text not null,
  name text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.todoagent_project_data (
  user_id text not null,
  project_id text not null,
  todos jsonb not null default '[]'::jsonb,
  analysis jsonb not null default '{}'::jsonb,
  docs jsonb not null default '[]'::jsonb,
  conversations jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, project_id),
  constraint todoagent_project_data_project_fk
    foreign key (user_id, project_id)
    references public.todoagent_projects (user_id, id)
    on delete cascade
);

create table if not exists public.todoagent_workspace_state (
  user_id text primary key,
  active_project_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.todoagent_projects enable row level security;
alter table public.todoagent_project_data enable row level security;
alter table public.todoagent_workspace_state enable row level security;

create policy "todoagent_projects_owner"
  on public.todoagent_projects
  for all
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy "todoagent_project_data_owner"
  on public.todoagent_project_data
  for all
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create policy "todoagent_workspace_state_owner"
  on public.todoagent_workspace_state
  for all
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));
