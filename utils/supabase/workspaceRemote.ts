import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalysisResultItem } from '../../components/AIAnalysisPage';
import type { Conversation, Todo, WorkspaceDoc } from '../../types';
import type { ProjectFocusMap, ProjectMeta } from '../projectStorage';

export type RemotePullResult =
  | { kind: 'empty' }
  | {
      kind: 'ok';
      projects: ProjectMeta[];
      activeProjectId: string;
      byProjectId: Map<
        string,
        {
          todos: Todo[];
          analysis: Record<string, AnalysisResultItem>;
          docs: WorkspaceDoc[];
          conversations: Conversation[];
          sopMarkdown: string;
          focusMap: ProjectFocusMap;
        }
      >;
    };

function asTodoArray(raw: unknown): Todo[] {
  return Array.isArray(raw) ? (raw as Todo[]) : [];
}

function asAnalysisMap(raw: unknown): Record<string, AnalysisResultItem> {
  return raw && typeof raw === 'object' ? (raw as Record<string, AnalysisResultItem>) : {};
}

function asDocArray(raw: unknown): WorkspaceDoc[] {
  return Array.isArray(raw) ? (raw as WorkspaceDoc[]) : [];
}

function asConversationArray(raw: unknown): Conversation[] {
  return Array.isArray(raw) ? (raw as Conversation[]) : [];
}

function rowToWorkspaceDoc(row: {
  id: string;
  name: string;
  kind: string;
  body: string;
  created_at_ms: number | string;
  is_skill: boolean | null;
  source_url: string | null;
}): WorkspaceDoc {
  const ms = typeof row.created_at_ms === 'string' ? Number(row.created_at_ms) : row.created_at_ms;
  const kind = row.kind === 'text' || row.kind === 'html' ? row.kind : 'markdown';
  return {
    id: row.id,
    name: row.name,
    kind,
    body: row.body ?? '',
    createdAt: Number.isFinite(ms) ? ms : Date.now(),
    isSkill: !!row.is_skill,
    sourceUrl: row.source_url ?? undefined,
  };
}

export async function pullWorkspace(client: SupabaseClient, userId: string): Promise<RemotePullResult> {
  const { data: projectRows, error: pErr } = await client
    .from('todoagent_projects')
    .select('id, name')
    .eq('user_id', userId)
    .order('updated_at', { ascending: true });

  if (pErr) throw pErr;
  if (!projectRows?.length) return { kind: 'empty' };

  const { data: stateRow, error: sErr } = await client
    .from('todoagent_workspace_state')
    .select('active_project_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (sErr) throw sErr;

  const { data: dataRows, error: dErr } = await client
    .from('todoagent_project_data')
    .select('project_id, todos, analysis, docs, conversations, sop_markdown, focus_map')
    .eq('user_id', userId);

  if (dErr) throw dErr;

  const { data: docRows, error: docErr } = await client
    .from('todoagent_documents')
    .select('id, project_id, name, kind, body, created_at_ms, is_skill, source_url')
    .eq('user_id', userId);

  if (docErr) throw docErr;

  const docsByProject = new Map<string, WorkspaceDoc[]>();
  for (const r of docRows ?? []) {
    const pid = r.project_id as string;
    const list = docsByProject.get(pid) ?? [];
    list.push(
      rowToWorkspaceDoc({
        id: r.id as string,
        name: r.name as string,
        kind: (r.kind as string) || 'markdown',
        body: (r.body as string) ?? '',
        created_at_ms: r.created_at_ms as number,
        is_skill: r.is_skill as boolean | null,
        source_url: r.source_url as string | null,
      })
    );
    docsByProject.set(pid, list);
  }

  const projects: ProjectMeta[] = projectRows.map((r) => ({ id: r.id, name: r.name }));
  const ids = new Set(projects.map((p) => p.id));
  let activeProjectId = stateRow?.active_project_id ?? projects[0].id;
  if (!ids.has(activeProjectId)) activeProjectId = projects[0].id;

  const byProjectId = new Map<
    string,
    {
      todos: Todo[];
      analysis: Record<string, AnalysisResultItem>;
      docs: WorkspaceDoc[];
      conversations: Conversation[];
      sopMarkdown: string;
      focusMap: ProjectFocusMap;
    }
  >();

  for (const p of projects) {
    byProjectId.set(p.id, {
      todos: [],
      analysis: {},
      docs: [],
      conversations: [],
      sopMarkdown: '',
      focusMap: {},
    });
  }

  for (const row of dataRows ?? []) {
    const pid = row.project_id as string;
    if (!byProjectId.has(pid)) continue;
    const fromTable = docsByProject.get(pid) ?? [];
    const legacyDocs = asDocArray(row.docs);
    const sopRaw = (row as { sop_markdown?: string }).sop_markdown;
    const focusRaw = (row as { focus_map?: ProjectFocusMap }).focus_map;
    byProjectId.set(pid, {
      todos: asTodoArray(row.todos),
      analysis: asAnalysisMap(row.analysis),
      docs: fromTable.length > 0 ? fromTable : legacyDocs,
      conversations: asConversationArray(row.conversations),
      sopMarkdown: typeof sopRaw === 'string' ? sopRaw : '',
      focusMap: focusRaw && typeof focusRaw === 'object' ? focusRaw : {},
    });
  }

  return { kind: 'ok', projects, activeProjectId, byProjectId };
}

export async function pushWorkspace(
  client: SupabaseClient,
  userId: string,
  projects: ProjectMeta[],
  activeProjectId: string,
  getPayload: (projectId: string) => {
    todos: Todo[];
    analysis: Record<string, AnalysisResultItem>;
    docs: WorkspaceDoc[];
    conversations: Conversation[];
    sopMarkdown: string;
    focusMap: ProjectFocusMap;
  }
): Promise<void> {
  if (!projects.length) return;

  const now = new Date().toISOString();

  const projectUpserts = projects.map((p) => ({
    id: p.id,
    user_id: userId,
    name: p.name,
    updated_at: now,
  }));

  const { error: puErr } = await client.from('todoagent_projects').upsert(projectUpserts, {
    onConflict: 'user_id,id',
  });
  if (puErr) throw puErr;

  const dataUpserts = projects.map((p) => {
    const payload = getPayload(p.id);
    return {
      user_id: userId,
      project_id: p.id,
      todos: payload.todos,
      analysis: payload.analysis,
      docs: payload.docs,
      conversations: payload.conversations,
      sop_markdown: payload.sopMarkdown ?? '',
      focus_map: payload.focusMap ?? {},
      updated_at: now,
    };
  });

  const { error: duErr } = await client.from('todoagent_project_data').upsert(dataUpserts, {
    onConflict: 'user_id,project_id',
  });
  if (duErr) throw duErr;

  for (const p of projects) {
    const payload = getPayload(p.id);
    const docs = payload.docs;
    const { data: existing } = await client
      .from('todoagent_documents')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', p.id);
    const keep = new Set(docs.map((d) => d.id));
    const toRemove = (existing ?? [])
      .map((r) => r.id as string)
      .filter((id) => !keep.has(id));
    if (toRemove.length) {
      const { error: delErr } = await client
        .from('todoagent_documents')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', p.id)
        .in('id', toRemove);
      if (delErr) throw delErr;
    }
    if (docs.length) {
      const rows = docs.map((d) => ({
        id: d.id,
        user_id: userId,
        project_id: p.id,
        name: d.name,
        kind: d.kind,
        body: d.body,
        created_at_ms: d.createdAt,
        is_skill: !!d.isSkill,
        source_url: d.sourceUrl ?? null,
        updated_at: now,
      }));
      const { error: docUpErr } = await client.from('todoagent_documents').upsert(rows, {
        onConflict: 'user_id,id',
      });
      if (docUpErr) throw docUpErr;
    }
  }

  const { error: suErr } = await client.from('todoagent_workspace_state').upsert(
    {
      user_id: userId,
      active_project_id: activeProjectId,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  );
  if (suErr) throw suErr;
}
