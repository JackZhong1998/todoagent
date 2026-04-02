-- Standalone documents (not embedded in todos). Legacy jsonb `docs` on project_data may remain empty after clients migrate.

create table if not exists public.todoagent_documents (
  id text not null,
  user_id text not null,
  project_id text not null,
  name text not null,
  kind text not null default 'markdown',
  body text not null default '',
  created_at_ms bigint not null,
  is_skill boolean not null default false,
  source_url text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint todoagent_documents_project_fk
    foreign key (user_id, project_id)
    references public.todoagent_projects (user_id, id)
    on delete cascade
);

alter table public.todoagent_documents enable row level security;

create policy "todoagent_documents_owner"
  on public.todoagent_documents
  for all
  using (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

create index if not exists todoagent_documents_project_idx
  on public.todoagent_documents (user_id, project_id);

-- Incremental SOP markdown per project (stats tab).
alter table public.todoagent_project_data
  add column if not exists sop_markdown text not null default '';
