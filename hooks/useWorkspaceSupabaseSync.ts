import { useCallback, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import type { AnalysisResultItem } from '../components/AIAnalysisPage';
import { useAuth } from '../contexts/AuthContext';
import type { Todo } from '../types';
import { createClerkSupabaseClient, isSupabaseConfigured } from '../utils/supabase/client';
import { pullWorkspace, pushWorkspace } from '../utils/supabase/workspaceRemote';
import {
  loadManifest,
  loadProjectAnalysis,
  loadProjectConversations,
  loadProjectDocs,
  loadProjectFocusMap,
  loadProjectSop,
  loadProjectTodos,
  saveManifest,
  saveProjectAnalysis,
  saveProjectConversations,
  saveProjectDocs,
  saveProjectFocusMap,
  saveProjectSop,
  saveProjectTodos,
  type ProjectFocusMap,
  type ProjectMeta,
} from '../utils/projectStorage';

const DEBOUNCE_MS = 900;

type SyncParams = {
  projects: ProjectMeta[];
  activeProjectId: string;
  todos: Todo[];
  analysisByTodoId: Record<string, AnalysisResultItem>;
  setProjects: Dispatch<SetStateAction<ProjectMeta[]>>;
  setActiveProjectId: Dispatch<SetStateAction<string>>;
  setTodos: Dispatch<SetStateAction<Todo[]>>;
  setAnalysisByTodoId: Dispatch<SetStateAction<Record<string, AnalysisResultItem>>>;
  sopMarkdown: string;
  setSopMarkdown: Dispatch<SetStateAction<string>>;
  focusMap: ProjectFocusMap;
  setFocusMap: Dispatch<SetStateAction<ProjectFocusMap>>;
};

export function useWorkspaceSupabaseSync(params: SyncParams): { bumpRemotePush: () => void } {
  const { user, getClerkToken, isLoggedIn } = useAuth();
  const userId = user?.id ?? null;

  const getToken = useCallback(() => getClerkToken({ template: 'supabase' }), [getClerkToken]);

  const client = useMemo(() => {
    if (!isSupabaseConfigured() || !isLoggedIn) return null;
    return createClerkSupabaseClient(getToken);
  }, [getToken, isLoggedIn]);

  const hydratedRef = useRef(false);
  const hydrateRunningRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projectsRef = useRef(params.projects);
  const activeRef = useRef(params.activeProjectId);
  const todosRef = useRef(params.todos);
  const analysisRef = useRef(params.analysisByTodoId);
  const sopRef = useRef(params.sopMarkdown);
  const focusMapRef = useRef(params.focusMap);
  projectsRef.current = params.projects;
  activeRef.current = params.activeProjectId;
  todosRef.current = params.todos;
  analysisRef.current = params.analysisByTodoId;
  sopRef.current = params.sopMarkdown;
  focusMapRef.current = params.focusMap;

  const runPush = useCallback(() => {
    if (!client || !userId) return;
    const projects = projectsRef.current;
    const active = activeRef.current;
    if (!projects.length) return;
    void pushWorkspace(client, userId, projects, active, (pid) => {
      const isActive = pid === active;
      return {
        todos: isActive ? todosRef.current : loadProjectTodos(pid),
        analysis: isActive ? analysisRef.current : loadProjectAnalysis(pid),
        docs: loadProjectDocs(pid),
        conversations: loadProjectConversations(pid),
        sopMarkdown: isActive ? sopRef.current : loadProjectSop(pid),
        focusMap: isActive ? focusMapRef.current : loadProjectFocusMap(pid),
      };
    }).catch((e) => console.error('[Supabase] push failed', e));
  }, [client, userId]);

  const schedulePush = useCallback(() => {
    if (!client || !userId) return;
    if (!hydratedRef.current || hydrateRunningRef.current) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      runPush();
    }, DEBOUNCE_MS);
  }, [client, userId, runPush]);

  const bumpRemotePush = useCallback(() => {
    schedulePush();
  }, [schedulePush]);

  useEffect(() => {
    if (!client || !userId) {
      hydratedRef.current = false;
      return;
    }

    let cancelled = false;
    hydrateRunningRef.current = true;
    hydratedRef.current = false;

    (async () => {
      try {
        const pulled = await pullWorkspace(client, userId);
        if (cancelled) return;

        if (pulled.kind === 'empty') {
          const m = loadManifest();
          if (m?.projects?.length) {
            if (cancelled) return;
            await pushWorkspace(client, userId, m.projects, m.activeProjectId, (pid) => ({
              todos: loadProjectTodos(pid),
              analysis: loadProjectAnalysis(pid),
              docs: loadProjectDocs(pid),
              conversations: loadProjectConversations(pid),
              sopMarkdown: loadProjectSop(pid),
              focusMap: loadProjectFocusMap(pid),
            }));
          }
        } else {
          const { projects, activeProjectId, byProjectId } = pulled;
          for (const p of projects) {
            const pack = byProjectId.get(p.id)!;
            saveProjectTodos(p.id, pack.todos);
            saveProjectAnalysis(p.id, pack.analysis);
            saveProjectDocs(p.id, pack.docs);
            saveProjectConversations(p.id, pack.conversations);
            saveProjectSop(p.id, pack.sopMarkdown ?? '');
            saveProjectFocusMap(p.id, pack.focusMap ?? {});
          }
          saveManifest({ projects, activeProjectId });
          if (cancelled) return;
          params.setProjects(projects);
          params.setActiveProjectId(activeProjectId);
          params.setTodos(byProjectId.get(activeProjectId)?.todos ?? []);
          params.setAnalysisByTodoId(byProjectId.get(activeProjectId)?.analysis ?? {});
          params.setSopMarkdown(loadProjectSop(activeProjectId));
          params.setFocusMap(loadProjectFocusMap(activeProjectId));
        }
      } catch (e) {
        console.error('[Supabase] hydrate failed', e);
      } finally {
        hydrateRunningRef.current = false;
        if (!cancelled) {
          hydratedRef.current = true;
          schedulePush();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only rehydrate on auth/supabase client change
  }, [client, userId, schedulePush]);

  useEffect(() => {
    schedulePush();
  }, [
    params.projects,
    params.activeProjectId,
    params.todos,
    params.analysisByTodoId,
    params.sopMarkdown,
    params.focusMap,
    schedulePush,
  ]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    },
    []
  );

  return { bumpRemotePush };
}
