import type { AnalysisResultItem } from '../components/AIAnalysisPage';
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

function todosKey(projectId: string) {
  return `todoagent_p_${projectId}_todos`;
}

function analysisKey(projectId: string) {
  return `todoagent_p_${projectId}_analysis`;
}

function docsKey(projectId: string) {
  return `todoagent_p_${projectId}_docs`;
}

function sopKey(projectId: string) {
  return `todoagent_p_${projectId}_sop`;
}

function conversationsKey(projectId: string) {
  return `todoagent_p_${projectId}_conversations`;
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
  const list = safeParse<WorkspaceDoc[]>(localStorage.getItem(docsKey(projectId)), []);
  return Array.isArray(list) ? list : [];
}

export function saveProjectDocs(projectId: string, docs: WorkspaceDoc[]): void {
  localStorage.setItem(docsKey(projectId), JSON.stringify(docs));
}

export function loadProjectSop(projectId: string): string {
  return localStorage.getItem(sopKey(projectId)) ?? '';
}

export function saveProjectSop(projectId: string, markdown: string): void {
  localStorage.setItem(sopKey(projectId), markdown);
}

/** Cross-panel refresh when another view writes docs (e.g. chat imports a skill). */
export const PROJECT_DOCS_UPDATED_EVENT = 'todoagent-project-docs-updated';

export function notifyProjectDocsUpdated(projectId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROJECT_DOCS_UPDATED_EVENT, { detail: { projectId } }));
}

export function loadProjectConversations(projectId: string): Conversation[] {
  const list = safeParse<Conversation[]>(localStorage.getItem(conversationsKey(projectId)), []);
  return Array.isArray(list) ? list : [];
}

export function saveProjectConversations(projectId: string, conversations: Conversation[]): void {
  localStorage.setItem(conversationsKey(projectId), JSON.stringify(conversations));
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
}
