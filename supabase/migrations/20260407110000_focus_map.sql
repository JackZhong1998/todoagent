alter table public.todoagent_project_data
  add column if not exists focus_map jsonb not null default '{}'::jsonb;
