import type { AnalysisResultItem } from '../components/AIAnalysisPage';
import type { AgentHomeAiSnapshot } from './agentHomeSummary';
import type { Conversation, Todo, WorkspaceDoc } from '../types';

const PROJECTS_MANIFEST_KEY = 'todoagent_projects_v1';

const LEGACY_TODOS = 'swiss_todos';
const LEGACY_ANALYSIS = 'todo_task_ai_analysis';
const LEGACY_DOCS = 'todo_workspace_documents';
const LEGACY_CONVERSATIONS = 'swiss_conversations';

export const MIGRATED_DEFAULT_PROJECT_ID = 'proj_default';

export interface ProjectMeta {
  id: string;
  name: string;
}

export interface ProjectsManifest {
  projects: ProjectMeta[];
  activeProjectId: string;
}

export type ProjectFocusMap = Record<string, number>;

function todosKey(projectId: string) {
  return `todoagent_p_${projectId}_todos`;
}

function analysisKey(projectId: string) {
  return `todoagent_p_${projectId}_analysis`;
}

function docsKey(projectId: string) {
  return `todoagent_p_${projectId}_docs`;
}

function docPromptRefsKey(projectId: string) {
  return `todoagent_p_${projectId}_doc_prompt_refs`;
}

function sopKey(projectId: string) {
  return `todoagent_p_${projectId}_sop`;
}

function conversationsKey(projectId: string) {
  return `todoagent_p_${projectId}_conversations`;
}

function agentHomeAiKey(projectId: string) {
  return `todoagent_p_${projectId}_agent_home_ai_v1`;
}

function focusMapKey(projectId: string) {
  return `todoagent_p_${projectId}_focus_map_v1`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadProjectTodos(projectId: string): Todo[] {
  const list = safeParse<Todo[]>(localStorage.getItem(todosKey(projectId)), []);
  return Array.isArray(list) ? list : [];
}

export function saveProjectTodos(projectId: string, todos: Todo[]): void {
  localStorage.setItem(todosKey(projectId), JSON.stringify(todos));
}

export function loadProjectAnalysis(projectId: string): Record<string, AnalysisResultItem> {
  const obj = safeParse<Record<string, AnalysisResultItem>>(
    localStorage.getItem(analysisKey(projectId)),
    {}
  );
  return obj && typeof obj === 'object' ? obj : {};
}

export function saveProjectAnalysis(projectId: string, analysis: Record<string, AnalysisResultItem>): void {
  localStorage.setItem(analysisKey(projectId), JSON.stringify(analysis));
}

export function loadProjectDocs(projectId: string): WorkspaceDoc[] {
  const raw = safeParse<WorkspaceDoc[]>(localStorage.getItem(docsKey(projectId)), []);
  const list0 = Array.isArray(raw) ? raw : [];
  const { next: deduped, changed, stableId, remappedRefIds } = dedupeProjectBackgroundDocs(projectId, list0);
  if (changed) {
    saveProjectDocs(projectId, deduped);
    if (remappedRefIds.size) {
      const refs = loadProjectDocPromptRefs(projectId);
      const nextRefs = [...new Set(refs.map((id) => (remappedRefIds.has(id) ? stableId : id)))];
      saveProjectDocPromptRefs(projectId, nextRefs);
    }
  }
  return ensureProjectBackgroundDoc(projectId, deduped);
}

export function saveProjectDocs(projectId: string, docs: WorkspaceDoc[]): void {
  localStorage.setItem(docsKey(projectId), JSON.stringify(docs));
}

const PROJECT_BACKGROUND_DOC_NAME = '项目背景.md';
const PROJECT_BACKGROUND_DOC_NAME_EN = 'project background.md';
const PROJECT_BACKGROUND_DOC_FALLBACK_BODY = `# 项目背景

请在这里维护项目背景信息。该文档会作为固定参考嵌入到每次 Agent 对话中。

建议包含：
- 项目目标
- 关键约束
- 术语说明
- 当前里程碑`;

/** Stable id so sync/ensure never spawns duplicate background rows. */
export function projectBackgroundStableDocId(projectId: string): string {
  return `project-bg-${projectId}`;
}

function isProjectBackgroundCandidate(d: WorkspaceDoc, projectId: string): boolean {
  if (d.isSkill) return false;
  const stable = projectBackgroundStableDocId(projectId);
  if (d.isProjectBackground) return true;
  if (d.id === stable || d.id.startsWith(`${stable}-`)) return true;
  const n = d.name.trim();
  if (n === PROJECT_BACKGROUND_DOC_NAME) return true;
  if (n.toLowerCase() === PROJECT_BACKGROUND_DOC_NAME_EN) return true;
  return false;
}

/**
 * Collapse multiple「项目背景」rows (flag, same filename, or legacy random ids) into exactly one.
 */
export function dedupeProjectBackgroundDocs(
  projectId: string,
  docs: WorkspaceDoc[]
): {
  next: WorkspaceDoc[];
  changed: boolean;
  stableId: string;
  remappedRefIds: Set<string>;
} {
  const list = Array.isArray(docs) ? [...docs] : [];
  const stable = projectBackgroundStableDocId(projectId);
  const candidates = list.filter((d) => isProjectBackgroundCandidate(d, projectId));
  const rest = list.filter((d) => !isProjectBackgroundCandidate(d, projectId));

  const remappedRefIds = new Set<string>();

  if (candidates.length === 0) {
    return { next: list, changed: false, stableId: stable, remappedRefIds };
  }

  const pick = [...candidates].sort((a, b) => {
    if (Number(!!b.isProjectBackground) !== Number(!!a.isProjectBackground)) {
      return Number(!!b.isProjectBackground) - Number(!!a.isProjectBackground);
    }
    const lb = (b.body || '').length;
    const la = (a.body || '').length;
    if (lb !== la) return lb - la;
    return (b.createdAt || 0) - (a.createdAt || 0);
  })[0];

  const createdAt = Math.min(...candidates.map((c) => Number(c.createdAt) || Date.now()));
  const canonical: WorkspaceDoc = {
    id: stable,
    name: PROJECT_BACKGROUND_DOC_NAME,
    kind: pick.kind === 'text' || pick.kind === 'html' ? pick.kind : 'markdown',
    body: pick.body || '',
    createdAt,
    isProjectBackground: true,
    ...(pick.sourceUrl ? { sourceUrl: pick.sourceUrl } : {}),
  };

  for (const c of candidates) {
    if (c.id !== stable) remappedRefIds.add(c.id);
  }

  if (
    candidates.length === 1 &&
    candidates[0].id === stable &&
    candidates[0].isProjectBackground === true &&
    candidates[0].name === PROJECT_BACKGROUND_DOC_NAME
  ) {
    return { next: list, changed: false, stableId: stable, remappedRefIds: new Set() };
  }

  return {
    next: [canonical, ...rest],
    changed: true,
    stableId: stable,
    remappedRefIds,
  };
}

export function ensureProjectBackgroundDoc(projectId: string, docs: WorkspaceDoc[]): WorkspaceDoc[] {
  const list = Array.isArray(docs) ? [...docs] : [];
  const stable = projectBackgroundStableDocId(projectId);
  const idx = list.findIndex((d) => d.id === stable);
  if (idx !== -1) {
    const cur = list[idx];
    if (cur.name === PROJECT_BACKGROUND_DOC_NAME && cur.isProjectBackground) return list;
    const next = [...list];
    next[idx] = { ...cur, name: PROJECT_BACKGROUND_DOC_NAME, isProjectBackground: true };
    localStorage.setItem(docsKey(projectId), JSON.stringify(next));
    return next;
  }

  const background: WorkspaceDoc = {
    id: stable,
    name: PROJECT_BACKGROUND_DOC_NAME,
    kind: 'markdown',
    body: PROJECT_BACKGROUND_DOC_FALLBACK_BODY,
    createdAt: Date.now(),
    isProjectBackground: true,
  };
  const next = [background, ...list];
  localStorage.setItem(docsKey(projectId), JSON.stringify(next));
  return next;
}

export function loadProjectDocPromptRefs(projectId: string): string[] {
  const ids = safeParse<string[]>(localStorage.getItem(docPromptRefsKey(projectId)), []);
  return Array.isArray(ids) ? ids.map((x) => String(x || '')).filter(Boolean) : [];
}

export function saveProjectDocPromptRefs(projectId: string, docIds: string[]): void {
  localStorage.setItem(docPromptRefsKey(projectId), JSON.stringify(Array.from(new Set(docIds))));
}

export function loadProjectSop(projectId: string): string {
  return localStorage.getItem(sopKey(projectId)) ?? '';
}

export function saveProjectSop(projectId: string, markdown: string): void {
  localStorage.setItem(sopKey(projectId), markdown);
}

export function loadProjectFocusMap(projectId: string): ProjectFocusMap {
  const obj = safeParse<ProjectFocusMap>(localStorage.getItem(focusMapKey(projectId)), {});
  return obj && typeof obj === 'object' ? obj : {};
}

export function saveProjectFocusMap(projectId: string, focusMap: ProjectFocusMap): void {
  localStorage.setItem(focusMapKey(projectId), JSON.stringify(focusMap));
}

/** Cross-panel refresh when another view writes docs (e.g. chat imports a skill). */
export const PROJECT_DOCS_UPDATED_EVENT = 'todoagent-project-docs-updated';
export const PROJECT_CONVERSATIONS_UPDATED_EVENT = 'todoagent-project-conversations-updated';

export function notifyProjectDocsUpdated(projectId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROJECT_DOCS_UPDATED_EVENT, { detail: { projectId } }));
}

export function notifyProjectConversationsUpdated(projectId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROJECT_CONVERSATIONS_UPDATED_EVENT, { detail: { projectId } }));
}

export function loadProjectConversations(projectId: string): Conversation[] {
  const list = safeParse<Conversation[]>(localStorage.getItem(conversationsKey(projectId)), []);
  return Array.isArray(list) ? list : [];
}

export function saveProjectConversations(projectId: string, conversations: Conversation[]): void {
  localStorage.setItem(conversationsKey(projectId), JSON.stringify(conversations));
  notifyProjectConversationsUpdated(projectId);
}

export function loadAgentHomeAiSnapshot(projectId: string): AgentHomeAiSnapshot | null {
  const raw = localStorage.getItem(agentHomeAiKey(projectId));
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as AgentHomeAiSnapshot;
    if (!o || typeof o !== 'object') return null;
    const fix = (v: unknown) =>
      Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
    return {
      userUnderstanding: fix(o.userUnderstanding),
      projectUnderstanding: fix(o.projectUnderstanding),
      preferencesAndNeeds: fix(o.preferencesAndNeeds),
      generatedAt: typeof o.generatedAt === 'number' ? o.generatedAt : 0,
    };
  } catch {
    return null;
  }
}

export function saveAgentHomeAiSnapshot(projectId: string, snapshot: AgentHomeAiSnapshot): void {
  localStorage.setItem(agentHomeAiKey(projectId), JSON.stringify(snapshot));
}

export function loadManifest(): ProjectsManifest | null {
  return safeParse<ProjectsManifest | null>(localStorage.getItem(PROJECTS_MANIFEST_KEY), null);
}

export function saveManifest(manifest: ProjectsManifest): void {
  localStorage.setItem(PROJECTS_MANIFEST_KEY, JSON.stringify(manifest));
}

function defaultMigratedProjectName(): string {
  return localStorage.getItem('todoagent_language') === 'zh' ? '默认项目' : 'Default project';
}

/**
 * One-time migration from legacy single-workspace keys to project-scoped storage.
 */
export function ensureProjectsWithMigration(defaultProjectName?: string): ProjectsManifest {
  const resolvedName = defaultProjectName ?? defaultMigratedProjectName();
  const existing = loadManifest();
  if (existing?.projects?.length && existing.activeProjectId) {
    const activeOk = existing.projects.some((p) => p.id === existing.activeProjectId);
    if (activeOk) return existing;
    return {
      ...existing,
      activeProjectId: existing.projects[0].id,
    };
  }

  const legacyTodos = safeParse<Todo[]>(localStorage.getItem(LEGACY_TODOS), []);
  const legacyAnalysis = safeParse<Record<string, AnalysisResultItem>>(
    localStorage.getItem(LEGACY_ANALYSIS),
    {}
  );
  const legacyDocs = safeParse<WorkspaceDoc[]>(localStorage.getItem(LEGACY_DOCS), []);
  const legacyConv = safeParse<Conversation[]>(localStorage.getItem(LEGACY_CONVERSATIONS), []);

  const hasLegacyData =
    localStorage.getItem(LEGACY_TODOS) !== null ||
    localStorage.getItem(LEGACY_ANALYSIS) !== null ||
    localStorage.getItem(LEGACY_DOCS) !== null ||
    localStorage.getItem(LEGACY_CONVERSATIONS) !== null;

  const id = MIGRATED_DEFAULT_PROJECT_ID;
  const manifest: ProjectsManifest = {
    projects: [{ id, name: resolvedName }],
    activeProjectId: id,
  };

  if (hasLegacyData) {
    saveProjectTodos(id, Array.isArray(legacyTodos) ? legacyTodos : []);
    saveProjectAnalysis(id, legacyAnalysis && typeof legacyAnalysis === 'object' ? legacyAnalysis : {});
    saveProjectDocs(id, Array.isArray(legacyDocs) ? legacyDocs : []);
    saveProjectConversations(id, Array.isArray(legacyConv) ? legacyConv : []);
    saveProjectFocusMap(id, {});
    localStorage.removeItem(LEGACY_TODOS);
    localStorage.removeItem(LEGACY_ANALYSIS);
    localStorage.removeItem(LEGACY_DOCS);
    localStorage.removeItem(LEGACY_CONVERSATIONS);
  } else {
    saveProjectTodos(id, []);
    saveProjectAnalysis(id, {});
    saveProjectDocs(id, []);
    saveProjectSop(id, '');
    saveProjectConversations(id, []);
    saveProjectFocusMap(id, {});
  }

  saveManifest(manifest);
  return manifest;
}

export function seedEmptyWorkspace(projectId: string): void {
  if (!localStorage.getItem(todosKey(projectId))) saveProjectTodos(projectId, []);
  if (!localStorage.getItem(analysisKey(projectId))) saveProjectAnalysis(projectId, {});
  if (!localStorage.getItem(docsKey(projectId))) saveProjectDocs(projectId, []);
  if (localStorage.getItem(sopKey(projectId)) === null) saveProjectSop(projectId, '');
  if (!localStorage.getItem(conversationsKey(projectId))) saveProjectConversations(projectId, []);
  if (!localStorage.getItem(focusMapKey(projectId))) saveProjectFocusMap(projectId, {});
}
