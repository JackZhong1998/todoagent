import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, ChevronLeft, ChevronRight, Bot, ListTodo, BarChart3, House, Trees } from 'lucide-react';
import { Todo, Priority, FilterType } from '../types';
import { generateId, stripHtmlTags } from '../utils';
import { setAgentCardStateInHtml } from '../utils/todoAgentCard';
import {
  ensureProjectsWithMigration,
  loadProjectAnalysis,
  loadProjectSop,
  loadProjectTodos,
  saveManifest,
  saveProjectAnalysis,
  saveProjectFocusMap,
  saveProjectSop,
  saveProjectTodos,
  seedEmptyWorkspace,
  loadProjectFocusMap,
  type ProjectFocusMap,
  type ProjectMeta,
} from '../utils/projectStorage';
import { SOP_INCREMENTAL_SYSTEM_PROMPT, buildSopIncrementalUserPrompt } from '../utils/sopIncremental';
import {
  TASK_REPLACEABILITY_SYSTEM_PROMPT,
  buildSingleTaskReplaceabilityUserPrompt,
  normalizeStringArray,
} from '../utils/taskReplaceabilityAnalysis';
import { TodoItem } from './TodoItem';
import { ChatPanel } from './ChatPanel';
import { UserSettings } from './UserSettings';
import { AIAnalysisPage, AnalysisResultItem, Replaceability, ANALYSIS_FAILED_TASK_TYPE } from './AIAnalysisPage';
import { AgentHomePanel } from './AgentHomePanel';
import { ProjectSwitcher } from './ProjectSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { WorkspaceSyncProvider } from '../contexts/WorkspaceSyncContext';
import { useAgentEntitlement } from '../hooks/useAgentEntitlement';
import { PaywallModal } from './PaywallModal';
import {
  moonshotChatJson,
  moonshotDirectApiKey,
  moonshotProxyEnabled,
} from '../utils/moonshotClient';
import { useWorkspaceSupabaseSync } from '../hooks/useWorkspaceSupabaseSync';
import { usePageSeo } from '../utils/pageSeo';

type AppTab = 'todo' | 'stats' | 'docs' | 'focus';

type ActivityDay = {
  created: number;
  completed: number;
};

type ActivityMap = Record<string, ActivityDay>;
type FocusSessionMap = ProjectFocusMap;

type ToastPayload = {
  id: number;
  title: string;
  subtitle: string;
};

type TodoHistorySnapshot = {
  title: string;
  content: string;
  caretOffset: number | null;
};

type TodoHistoryState = {
  snapshots: TodoHistorySnapshot[];
  cursor: number;
};

type TodoUpdateMeta = {
  caretOffset?: number | null;
};

type HistoryApplyRequest = {
  token: number;
  caretOffset: number | null;
};

const ACTIVITY_STORAGE_KEY_PREFIX = 'todoagent_daily_activity_v1:project:';
const FOCUS_TIMER_STORAGE_KEY_PREFIX = 'todoagent_focus_timer_v1:project:';
const FOCUS_DURATION_SECONDS = 25 * 60;

const activityStorageKeyForProject = (projectId: string) => `${ACTIVITY_STORAGE_KEY_PREFIX}${projectId}`;
const focusTimerStorageKeyForProject = (projectId: string) => `${FOCUS_TIMER_STORAGE_KEY_PREFIX}${projectId}`;

const formatFocusCountdown = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${`${r}`.padStart(2, '0')}`;
};

const focusTreeEmojiByProgress = (progress: number) => {
  if (progress < 0.2) return '🌱';
  if (progress < 0.45) return '🌿';
  if (progress < 0.75) return '🪴';
  return '🌳';
};

const TYPING_TOAST_CANDIDATES = [
  { zh: '开工了，进入节奏。', en: 'You are in the zone.' },
  { zh: '先写一行，也是在前进。', en: 'One line is still progress.' },
  { zh: '专注此刻，事情会变简单。', en: 'Focus now, simplify later.' },
  { zh: '你的注意力正在复利。', en: 'Your focus compounds.' },
  { zh: '继续推进，别被打断。', en: 'Keep moving, stay unbroken.' },
  { zh: '你在把目标变成现实。', en: 'You are making it real.' },
  { zh: '节奏很好，继续。', en: 'Great rhythm. Keep going.' },
  { zh: '每次输入都在积累胜势。', en: 'Every keystroke builds momentum.' },
  { zh: '今天的你很稳。', en: 'You are steady today.' },
  { zh: '现在就把这件事做完。', en: 'Finish this one now.' },
] as const;

const COMPLETE_TOAST_CANDIDATES = [
  { zh: '完成一项，掌控感+1。', en: 'One done, one win.' },
  { zh: '非常好，继续连胜。', en: 'Excellent. Keep the streak.' },
  { zh: '你在兑现计划。', en: 'You are honoring your plan.' },
  { zh: '又完成一个，效率在线。', en: 'Another one complete. Strong pace.' },
  { zh: '状态很棒，继续清空列表。', en: 'Great state. Keep clearing.' },
  { zh: '执行力拉满。', en: 'Execution at full power.' },
  { zh: '清晰行动，稳定输出。', en: 'Clear actions, steady output.' },
  { zh: '任务落地，成就感拉满。', en: 'Task shipped, confidence up.' },
  { zh: '今天你非常高效。', en: 'You are highly effective today.' },
  { zh: '漂亮！继续下一个目标。', en: 'Beautiful. On to the next goal.' },
] as const;

function appPathFromTab(tab: AppTab): string {
  if (tab === 'stats') return '/app/stats';
  if (tab === 'docs') return '/app/docs';
  if (tab === 'focus') return '/app/focus';
  return '/app/todo';
}

function tabFromPathname(pathname: string): AppTab {
  if (pathname.startsWith('/app/stats')) return 'stats';
  if (pathname.startsWith('/app/docs')) return 'docs';
  if (pathname.startsWith('/app/focus')) return 'focus';
  return 'todo';
}

const APP_MAIN_STICKY_BAR =
  'sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-2 bg-[#fcfcfc]/95 backdrop-blur-md border-b border-gray-100/90';

const KIMI_SYSTEM_PROMPT = "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。";

const TASK_ANALYSIS_SYSTEM = `${KIMI_SYSTEM_PROMPT}

${TASK_REPLACEABILITY_SYSTEM_PROMPT}`;

const normalizeReplaceability = (value: string): Replaceability => {
  if (value.includes('不可替代')) return '不可替代';
  if (value.includes('可替代')) return '可替代';
  return '不清楚';
};

const dayKeyFromTs = (ts: number) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const loadActivityMap = (projectId: string): ActivityMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(activityStorageKeyForProject(projectId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ActivityMap;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
};

const parseSingleAnalysis = (raw: string): AnalysisResultItem | null => {
  const toResult = (parsed: any): AnalysisResultItem => ({
    todoId: String(parsed.todoId || ''),
    title: String(parsed.title || ''),
    taskType: String(parsed.taskType || '未分类任务'),
    taskAttributes: String(parsed.taskAttributes ?? '').trim() || undefined,
    humanAtomicCapabilities: normalizeStringArray(parsed.humanAtomicCapabilities),
    requiredUserContext: normalizeStringArray(parsed.requiredUserContext),
    currentFeasibility: String(parsed.currentFeasibility ?? '').trim() || undefined,
    futureImplementationPath: String(parsed.futureImplementationPath ?? '').trim() || undefined,
    agentAtomicCapabilities: normalizeStringArray(parsed.agentAtomicCapabilities),
    multimodalCapabilities: normalizeStringArray(parsed.multimodalCapabilities),
    replaceability: normalizeReplaceability(String(parsed.replaceability || '不清楚')),
    process: String(parsed.process || ''),
    reason: String(parsed.reason || ''),
  });

  try {
    return toResult(JSON.parse(raw));
  } catch {
    const fenceMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i) || raw.match(/```\s*([\s\S]*?)\s*```/i);
    if (fenceMatch?.[1]) {
      try {
        return toResult(JSON.parse(fenceMatch[1]));
      } catch {
        // continue to object extraction
      }
    }
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      return toResult(JSON.parse(objectMatch[0]));
    } catch {
      return null;
    }
  }
};

const AppShell: React.FC = () => {
  const { t, language } = useLanguage();
  const { getClerkToken, isLoggedIn } = useAuth();
  const { checkCanOpenAgent, startStripeCheckout } = useAgentEntitlement();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabFromPathname(location.pathname);
  const appSeo =
    activeTab === 'stats'
      ? t.seo.appStats
      : activeTab === 'docs'
        ? t.seo.appDocs
        : activeTab === 'focus'
          ? {
              title: language === 'zh' ? '专注力养成 · TodoAgent' : 'Focus Garden · TodoAgent',
              description:
                language === 'zh'
                  ? '查看今天与累计专注种树数据，以及任务完成情况。'
                  : 'Track focus trees and task completion trends.',
            }
          : t.seo.appWorkspace;
  const appPath = location.pathname.startsWith('/app') ? location.pathname : '/app/todo';
  usePageSeo({
    title: appSeo.title,
    description: appSeo.description,
    path: appPath,
    noindex: true,
  });

  const initialManifestRef = useRef<ReturnType<typeof ensureProjectsWithMigration> | null>(null);
  if (!initialManifestRef.current) {
    initialManifestRef.current = ensureProjectsWithMigration();
  }
  const initialManifest = initialManifestRef.current;

  const [projects, setProjects] = useState<ProjectMeta[]>(() => initialManifest.projects);
  const [activeProjectId, setActiveProjectId] = useState(() => initialManifest.activeProjectId);
  const [editingProjectNames, setEditingProjectNames] = useState(false);

  const [todos, setTodos] = useState<Todo[]>(() => loadProjectTodos(initialManifest.activeProjectId));
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [currentTodoForChat, setCurrentTodoForChat] = useState<Todo | undefined>(undefined);
  const [chatLaunchPayload, setChatLaunchPayload] = useState<{
    nonce: number;
    text?: string;
    autoSend?: boolean;
    forceNewConversation?: boolean;
    conversationId?: string;
    focusConversationId?: string;
  } | null>(null);
  const [analysisByTodoId, setAnalysisByTodoId] = useState<Record<string, AnalysisResultItem>>(() =>
    loadProjectAnalysis(initialManifest.activeProjectId)
  );
  const [analysisLoadingByTodoId, setAnalysisLoadingByTodoId] = useState<Record<string, boolean>>({});
  const [analysisRetryCountByTodoId, setAnalysisRetryCountByTodoId] = useState<Record<string, number>>({});
  const [sopMarkdown, setSopMarkdown] = useState(() => loadProjectSop(initialManifest.activeProjectId));
  const [sopLoading, setSopLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [activityMap, setActivityMap] = useState<ActivityMap>(() => loadActivityMap(initialManifest.activeProjectId));
  const [focusSessionMap, setFocusSessionMap] = useState<FocusSessionMap>(() =>
    loadProjectFocusMap(initialManifest.activeProjectId)
  );
  const [focusEndAt, setFocusEndAt] = useState<number | null>(null);
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState(FOCUS_DURATION_SECONDS);
  const [focusHover, setFocusHover] = useState(false);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [focusedTodoId, setFocusedTodoId] = useState<string | null>(null);
  const [highlightedTodoId, setHighlightedTodoId] = useState<string | null>(null);
  const [focusRequestByTodoId, setFocusRequestByTodoId] = useState<Record<string, number>>({});
  const [historyApplyByTodoId, setHistoryApplyByTodoId] = useState<Record<string, HistoryApplyRequest>>({});
  const useMoonshotProxy = moonshotProxyEnabled();
  const directMoonshotKey = moonshotDirectApiKey();
  const canMoonshot = useMoonshotProxy ? isLoggedIn : !!directMoonshotKey;
  const activeProjectIdRef = useRef(activeProjectId);
  activeProjectIdRef.current = activeProjectId;
  const sopTailRef = useRef(Promise.resolve());
  const toastTimerRef = useRef<number | null>(null);
  const focusTickTimerRef = useRef<number | null>(null);
  const focusCompletedEndAtRef = useRef<number | null>(null);
  const typingToastShownTodoIdsRef = useRef<Record<string, boolean>>({});
  const todoHistoriesRef = useRef<Record<string, TodoHistoryState>>({});
  const suppressHistoryForTodoIdRef = useRef<string | null>(null);
  const focusedTodoIdRef = useRef<string | null>(null);

  const showMotivationToast = useCallback(
    (kind: 'typing' | 'completed') => {
      const pool = kind === 'typing' ? TYPING_TOAST_CANDIDATES : COMPLETE_TOAST_CANDIDATES;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const title = language === 'zh' ? picked.zh : picked.en;
      const subtitle =
        language === 'zh'
          ? kind === 'completed'
            ? 'AI 正在分析你的完成轨迹。'
            : '保持专注，继续推进。'
          : kind === 'completed'
            ? 'AI is analyzing this completion now.'
            : 'Stay focused and keep shipping.';
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setToast({ id: Date.now(), title, subtitle });
      toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
    },
    [language]
  );

  const { bumpRemotePush } = useWorkspaceSupabaseSync({
    projects,
    activeProjectId,
    todos,
    analysisByTodoId,
    setProjects,
    setActiveProjectId,
    setTodos,
    setAnalysisByTodoId,
    sopMarkdown,
    setSopMarkdown,
    focusMap: focusSessionMap,
    setFocusMap: setFocusSessionMap,
  });

  const incrementFocusTree = useCallback((showToast: boolean) => {
    const key = dayKeyFromTs(Date.now());
    setFocusSessionMap((prev) => {
      const next = { ...prev, [key]: (prev[key] || 0) + 1 };
      return next;
    });
    bumpRemotePush();
    if (!showToast) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    const title = language === 'zh' ? '你已专注 25 分钟' : 'You focused for 25 minutes';
    const subtitle =
      language === 'zh'
        ? '太棒了！这棵树已经长大，继续保持这个节奏。'
        : 'Great work. Your tree has grown - keep your momentum.';
    setToast({ id: Date.now(), title, subtitle });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  }, [language, bumpRemotePush]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (focusTickTimerRef.current) window.clearInterval(focusTickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    focusedTodoIdRef.current = focusedTodoId;
  }, [focusedTodoId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(activityStorageKeyForProject(activeProjectId), JSON.stringify(activityMap));
  }, [activityMap, activeProjectId]);

  useEffect(() => {
    saveProjectFocusMap(activeProjectId, focusSessionMap);
  }, [focusSessionMap, activeProjectId]);

  useEffect(() => {
    setActivityMap(loadActivityMap(activeProjectId));
    setFocusSessionMap(loadProjectFocusMap(activeProjectId));
    typingToastShownTodoIdsRef.current = {};
    setFocusRemainingSeconds(FOCUS_DURATION_SECONDS);

    const raw = typeof window !== 'undefined' ? localStorage.getItem(focusTimerStorageKeyForProject(activeProjectId)) : null;
    if (!raw) {
      setFocusEndAt(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { endAt?: number };
      const endAt = typeof parsed.endAt === 'number' ? parsed.endAt : null;
      if (!endAt || endAt <= Date.now()) {
        if (endAt && endAt <= Date.now()) {
          // If the app was closed/suspended at finish, still count this tree once.
          incrementFocusTree(false);
        }
        localStorage.removeItem(focusTimerStorageKeyForProject(activeProjectId));
        setFocusEndAt(null);
        setFocusRemainingSeconds(FOCUS_DURATION_SECONDS);
        return;
      }
      setFocusEndAt(endAt);
    } catch {
      localStorage.removeItem(focusTimerStorageKeyForProject(activeProjectId));
      setFocusEndAt(null);
      setFocusRemainingSeconds(FOCUS_DURATION_SECONDS);
    }
  }, [activeProjectId, incrementFocusTree, bumpRemotePush]);

  const bumpDayActivity = useCallback((kind: 'created' | 'completed') => {
    const key = dayKeyFromTs(Date.now());
    setActivityMap((prev) => {
      const base = prev[key] || { created: 0, completed: 0 };
      const next: ActivityDay =
        kind === 'created'
          ? { ...base, created: base.created + 1 }
          : { ...base, completed: base.completed + 1 };
      return { ...prev, [key]: next };
    });
  }, []);

  useEffect(() => {
    saveProjectTodos(activeProjectId, todos);
  }, [todos, activeProjectId]);

  useEffect(() => {
    saveProjectAnalysis(activeProjectId, analysisByTodoId);
  }, [analysisByTodoId, activeProjectId]);

  useEffect(() => {
    saveProjectSop(activeProjectId, sopMarkdown);
  }, [sopMarkdown, activeProjectId]);

  const selectProject = (id: string) => {
    if (id === activeProjectId) return;
    saveProjectTodos(activeProjectId, todos);
    saveProjectAnalysis(activeProjectId, analysisByTodoId);
    setActiveProjectId(id);
    setTodos(loadProjectTodos(id));
    setAnalysisByTodoId(loadProjectAnalysis(id));
    setSopMarkdown(loadProjectSop(id));
    setAnalysisLoadingByTodoId({});
    setAnalysisRetryCountByTodoId({});
    saveManifest({ projects, activeProjectId: id });
  };

  const addProject = () => {
    saveProjectTodos(activeProjectId, todos);
    saveProjectAnalysis(activeProjectId, analysisByTodoId);
    const id = generateId();
    seedEmptyWorkspace(id);
    const name = t.projects.newProjectDefault;
    setProjects((prev) => {
      const nextProjects = [...prev, { id, name }];
      saveManifest({ projects: nextProjects, activeProjectId: id });
      return nextProjects;
    });
    setActiveProjectId(id);
    setTodos([]);
    setAnalysisByTodoId({});
    setSopMarkdown('');
    setAnalysisLoadingByTodoId({});
    setAnalysisRetryCountByTodoId({});
  };

  const renameProject = (id: string, name: string) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, name } : p));
      saveManifest({ projects: next, activeProjectId });
      return next;
    });
  };

  useEffect(() => {
    if (!isResizingChat) return;
    const handleMouseMove = (e: MouseEvent) => {
      const minWidth = 320;
      const maxWidth = Math.min(820, window.innerWidth - 360);
      const nextWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.max(minWidth, Math.min(maxWidth, nextWidth)));
    };
    const handleMouseUp = () => setIsResizingChat(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingChat]);

  useEffect(() => {
    if (!canMoonshot) return;
    const maxRetry = 2;
    const nextTodoToAnalyze = todos.find(todo => {
      if (!todo.isCompleted || analysisLoadingByTodoId[todo.id]) return false;
      const result = analysisByTodoId[todo.id];
      const retryCount = analysisRetryCountByTodoId[todo.id] || 0;
      if (!result) return true;
      return result.taskType === ANALYSIS_FAILED_TASK_TYPE && retryCount < maxRetry;
    });
    if (nextTodoToAnalyze) {
      void analyzeSingleCompletedTodo(nextTodoToAnalyze);
    }
  }, [todos, analysisByTodoId, analysisLoadingByTodoId, analysisRetryCountByTodoId, canMoonshot]);

  const addTodo = () => {
    const newTodo: Todo = {
      id: generateId(),
      title: '',
      content: '',
      priority: Priority.P2,
      createdAt: Date.now(),
      isRunning: false,
      startTime: null,
      totalTime: 0,
      isCompleted: false,
    };
    setTodos([newTodo, ...todos]);
    bumpDayActivity('created');
  };

  const recordTodoSnapshot = useCallback((todo: Todo, caretOffset?: number | null) => {
    const snapshot: TodoHistorySnapshot = {
      title: todo.title,
      content: todo.content,
      caretOffset: caretOffset ?? null,
    };
    const existing = todoHistoriesRef.current[todo.id];
    if (!existing) {
      todoHistoriesRef.current[todo.id] = {
        snapshots: [snapshot],
        cursor: 0,
      };
      return;
    }
    const current = existing.snapshots[existing.cursor];
    if (current && current.title === snapshot.title && current.content === snapshot.content) return;
    const nextSnapshots = existing.snapshots.slice(0, existing.cursor + 1);
    nextSnapshots.push(snapshot);
    const MAX_HISTORY = 100;
    const trimmed =
      nextSnapshots.length > MAX_HISTORY ? nextSnapshots.slice(nextSnapshots.length - MAX_HISTORY) : nextSnapshots;
    todoHistoriesRef.current[todo.id] = {
      snapshots: trimmed,
      cursor: trimmed.length - 1,
    };
  }, []);

  const moveTodoHistory = useCallback(
    (direction: 'undo' | 'redo') => {
      const focusedId = focusedTodoIdRef.current;
      const candidateIds = focusedId
        ? [focusedId, ...Object.keys(todoHistoriesRef.current).filter((id) => id !== focusedId)]
        : Object.keys(todoHistoriesRef.current);
      const todoId = candidateIds.find((id) => {
        const h = todoHistoriesRef.current[id];
        if (!h) return false;
        return direction === 'undo' ? h.cursor > 0 : h.cursor < h.snapshots.length - 1;
      });
      if (!todoId) return;
      const history = todoHistoriesRef.current[todoId];
      if (!history) return;
      const nextCursor = direction === 'undo' ? history.cursor - 1 : history.cursor + 1;
      const snapshot = history.snapshots[nextCursor];
      if (!snapshot) return;
      history.cursor = nextCursor;
      suppressHistoryForTodoIdRef.current = todoId;
      setTodos((prev) =>
        prev.map((t) => (t.id === todoId ? { ...t, title: snapshot.title, content: snapshot.content } : t))
      );
      setFocusedTodoId(todoId);
      setHighlightedTodoId(todoId);
      const now = Date.now();
      setFocusRequestByTodoId((prev) => ({ ...prev, [todoId]: now }));
      setHistoryApplyByTodoId((prev) => ({
        ...prev,
        [todoId]: { token: now, caretOffset: snapshot.caretOffset ?? null },
      }));
    },
    []
  );

  const analyzeSingleCompletedTodo = async (todo: Todo) => {
    if (!canMoonshot) return;
    setAnalysisLoadingByTodoId(prev => ({ ...prev, [todo.id]: true }));
    try {
      const taskPayload = {
        todoId: todo.id,
        title: todo.title || t.app.noTitle,
        content: stripHtmlTags(todo.content || ''),
        priority: todo.priority,
        totalTimeSeconds: todo.totalTime,
      };
      const prompt = buildSingleTaskReplaceabilityUserPrompt(taskPayload);

      const moonshotBody = {
        model: 'kimi-k2.5',
        temperature: 1,
        messages: [
          { role: 'system' as const, content: TASK_ANALYSIS_SYSTEM },
          { role: 'user' as const, content: prompt },
        ],
      };

      let data: { choices?: Array<{ message?: { content?: string } }> };
      if (useMoonshotProxy) {
        data = await moonshotChatJson(getClerkToken, { billingKind: 'sop', body: moonshotBody });
      } else {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${directMoonshotKey}`,
          },
          body: JSON.stringify(moonshotBody),
        });

        if (!response.ok) {
          let detail = '';
          try {
            const err = await response.json();
            detail = err?.error?.message || '';
          } catch {
            detail = await response.text();
          }
          throw new Error(`HTTP ${response.status}${detail ? ` - ${detail}` : ''}`);
        }
        data = await response.json();
      }
      const raw = data?.choices?.[0]?.message?.content || '';
      const parsed = parseSingleAnalysis(raw);
      if (!parsed) {
        throw new Error(t.analysis.invalidJsonError);
      }
      const normalized: AnalysisResultItem = {
        ...parsed,
        todoId: parsed.todoId || todo.id,
        title: parsed.title || todo.title || t.app.noTitle,
      };
      setAnalysisByTodoId(prev => ({ ...prev, [todo.id]: normalized }));
      setAnalysisRetryCountByTodoId(prev => ({ ...prev, [todo.id]: 0 }));
    } catch (error) {
      const message = error instanceof Error ? error.message : t.chat.errorUnknown;
      setAnalysisRetryCountByTodoId(prev => ({ ...prev, [todo.id]: (prev[todo.id] || 0) + 1 }));
      setAnalysisByTodoId(prev => ({
        ...prev,
        [todo.id]: {
          todoId: todo.id,
          title: todo.title || t.app.noTitle,
          taskType: ANALYSIS_FAILED_TASK_TYPE,
          humanAtomicCapabilities: [],
          requiredUserContext: [],
          agentAtomicCapabilities: [],
          multimodalCapabilities: [],
          replaceability: '不清楚',
          process: `${t.analysis.errorProcessLead}${message}`,
          reason: t.analysis.errorReasonAutoRetry,
        },
      }));
    } finally {
      setAnalysisLoadingByTodoId(prev => ({ ...prev, [todo.id]: false }));
    }
  };

  const scheduleSopUpdate = useCallback(
    (projectId: string, todo: Todo) => {
      if (!canMoonshot) return;
      sopTailRef.current = sopTailRef.current.then(async () => {
        setSopLoading(true);
        try {
          const prev = loadProjectSop(projectId);
          const userPrompt = buildSopIncrementalUserPrompt(prev, {
            title: todo.title || t.app.noTitle,
            contentPlain: stripHtmlTags(todo.content || ''),
            priority: todo.priority,
            totalTimeSeconds: todo.totalTime,
          });
          const moonshotBody = {
            model: 'kimi-k2.5',
            temperature: 0.5,
            messages: [
              {
                role: 'system' as const,
                content: `${KIMI_SYSTEM_PROMPT}\n\n${SOP_INCREMENTAL_SYSTEM_PROMPT}`,
              },
              { role: 'user' as const, content: userPrompt },
            ],
          };

          let data: { choices?: Array<{ message?: { content?: string } }> };
          if (useMoonshotProxy) {
            data = await moonshotChatJson(getClerkToken, { billingKind: 'sop', body: moonshotBody });
          } else {
            const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${directMoonshotKey}`,
              },
              body: JSON.stringify(moonshotBody),
            });
            if (!response.ok) {
              let detail = '';
              try {
                const err = await response.json();
                detail = err?.error?.message || '';
              } catch {
                detail = await response.text();
              }
              throw new Error(`HTTP ${response.status}${detail ? ` - ${detail}` : ''}`);
            }
            data = await response.json();
          }
          const raw = String(data?.choices?.[0]?.message?.content ?? '').trim();
          if (raw) {
            saveProjectSop(projectId, raw);
            if (projectId === activeProjectIdRef.current) setSopMarkdown(raw);
          }
        } catch (e) {
          console.error('[SOP incremental]', e);
        } finally {
          setSopLoading(false);
        }
      });
    },
    [canMoonshot, useMoonshotProxy, directMoonshotKey, getClerkToken, t.app.noTitle]
  );

  const updateTodo = (id: string, updates: Partial<Todo>, meta?: TodoUpdateMeta) => {
    let completedTodoForAnalysis: Todo | null = null;
    let didCompleteThisTurn = false;
    let shouldShowTypingToast = false;
    const projectId = activeProjectId;
    setTodos(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, ...updates };
      if (suppressHistoryForTodoIdRef.current === id) {
        suppressHistoryForTodoIdRef.current = null;
      } else if (typeof updates.content === 'string' || typeof updates.title === 'string') {
        recordTodoSnapshot(next, meta?.caretOffset ?? null);
      }
      if (!t.isCompleted && next.isCompleted) {
        completedTodoForAnalysis = next;
        didCompleteThisTurn = true;
      }
      const prevPlain = stripHtmlTags(t.content || '').trim();
      const nextPlain = stripHtmlTags(next.content || '').trim();
      const hadNoInput = !t.title.trim() && !prevPlain;
      const hasInputNow = !!next.title.trim() || !!nextPlain;
      if (
        !typingToastShownTodoIdsRef.current[t.id] &&
        hadNoInput &&
        hasInputNow &&
        !t.isCompleted &&
        !next.isCompleted
      ) {
        typingToastShownTodoIdsRef.current[t.id] = true;
        shouldShowTypingToast = true;
      }
      return next;
    }));
    if (shouldShowTypingToast) showMotivationToast('typing');
    if (didCompleteThisTurn) {
      bumpDayActivity('completed');
      showMotivationToast('completed');
    }
    if (completedTodoForAnalysis) {
      void analyzeSingleCompletedTodo(completedTodoForAnalysis);
      scheduleSopUpdate(projectId, completedTodoForAnalysis);
    }
  };

  const deleteTodo = (id: string) => {
    delete todoHistoriesRef.current[id];
    setTodos(prev => prev.filter(t => t.id !== id));
    if (focusedTodoIdRef.current === id) {
      setFocusedTodoId(null);
      focusedTodoIdRef.current = null;
    }
  };

  useEffect(() => {
    todos.forEach((todo) => {
      if (!todoHistoriesRef.current[todo.id]) {
        todoHistoriesRef.current[todo.id] = {
          snapshots: [{ title: todo.title, content: todo.content, caretOffset: null }],
          cursor: 0,
        };
      }
    });
  }, [todos]);

  useEffect(() => {
    if (!highlightedTodoId) return;
    const timer = window.setTimeout(() => setHighlightedTodoId(null), 1200);
    return () => window.clearTimeout(timer);
  }, [highlightedTodoId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMacLike = navigator.platform.toLowerCase().includes('mac');
      const primary = isMacLike ? e.metaKey : e.ctrlKey;
      if (!primary) return;
      const key = e.key.toLowerCase();
      const isUndo = key === 'z' && !e.shiftKey;
      const isRedo = (key === 'z' && e.shiftKey) || (!isMacLike && key === 'y');
      if (!isUndo && !isRedo) return;
      const activeEl = document.activeElement as HTMLElement | null;
      const inTodoEditor = !!activeEl?.closest('[data-todo-editor="1"]');
      if (!inTodoEditor && !focusedTodoIdRef.current) return;
      e.preventDefault();
      moveTodoHistory(isUndo ? 'undo' : 'redo');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moveTodoHistory]);

  const openGlobalChat = () => {
    setCurrentTodoForChat(undefined);
    setChatLaunchPayload(null);
    setIsChatOpen(true);
  };

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('billing') !== 'success') return;
    const sessionId = q.get('session_id');
    let cancelled = false;
    void (async () => {
      try {
        if (sessionId && useMoonshotProxy && isLoggedIn) {
          const token = await getClerkToken();
          if (token) {
            const r = await fetch('/api/stripe/confirm-checkout-session', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            });
            if (!r.ok) {
              const t = await r.text();
              console.warn('[billing confirm]', r.status, t.slice(0, 400));
            }
          }
        }
      } finally {
        if (cancelled) return;
        setPaywallOpen(false);
        if (location.pathname.startsWith('/app')) {
          navigate({ pathname: location.pathname, search: '' }, { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    location.search,
    location.pathname,
    navigate,
    getClerkToken,
    isLoggedIn,
    useMoonshotProxy,
  ]);

  const handleTodoAgentCardResolved = useCallback((todoId: string, conversationId: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t;
        const nextHtml = setAgentCardStateInHtml(t.content, conversationId, 'answered');
        if (nextHtml === t.content) return t;
        return { ...t, content: nextHtml };
      })
    );
  }, []);

  const handleTodoAgentCardStatusChange = useCallback(
    (todoId: string, conversationId: string, state: 'loading' | 'answered') => {
      setTodos((prev) =>
        prev.map((t) => {
          if (t.id !== todoId) return t;
          const nextHtml = setAgentCardStateInHtml(t.content, conversationId, state);
          if (nextHtml === t.content) return t;
          return { ...t, content: nextHtml };
        })
      );
    },
    []
  );

  const openTodoChat = (
    todo: Todo,
    payload?: {
      selectedText?: string;
      forceNewConversation?: boolean;
      autoSend?: boolean;
      conversationId?: string;
      focusConversationId?: string;
    }
  ) => {
    if (payload?.autoSend) {
      void (async () => {
        try {
          const ok = await checkCanOpenAgent();
          if (!ok) {
            setPaywallOpen(true);
            return;
          }
          setCurrentTodoForChat(todo);
          if (payload?.focusConversationId) {
            setChatLaunchPayload({
              nonce: Date.now(),
              focusConversationId: payload.focusConversationId,
            });
          } else {
            setChatLaunchPayload({
              nonce: Date.now(),
              text: payload.selectedText,
              autoSend: true,
              forceNewConversation: payload.forceNewConversation,
              conversationId: payload.conversationId,
            });
          }
          setIsChatOpen(true);
        } catch {
          // noop
        }
      })();
      return;
    }
    setCurrentTodoForChat(todo);
    if (payload?.focusConversationId) {
      setChatLaunchPayload({
        nonce: Date.now(),
        focusConversationId: payload.focusConversationId,
      });
    } else if (
      payload?.selectedText != null ||
      payload?.autoSend ||
      payload?.forceNewConversation ||
      payload?.conversationId
    ) {
      setChatLaunchPayload({
        nonce: Date.now(),
        text: payload.selectedText,
        autoSend: payload.autoSend,
        forceNewConversation: payload.forceNewConversation,
        conversationId: payload.conversationId,
      });
    } else {
      setChatLaunchPayload(null);
    }
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setCurrentTodoForChat(undefined);
    setChatLaunchPayload(null);
  };

  /** 与列表中的 Todo 同步，避免正文（如 Agent 卡片状态）更新后侧栏仍用旧 content */
  const currentTodoForChatLive = useMemo(() => {
    if (!currentTodoForChat) return undefined;
    return todos.find((t) => t.id === currentTodoForChat.id) ?? currentTodoForChat;
  }, [todos, currentTodoForChat]);

  const filteredAndSortedTodos = useMemo(() => {
    let list = [...todos];
    if (filter !== 'ALL') {
      list = list.filter(t => t.priority === filter);
    }
    const priorityScore = { [Priority.P0]: 3, [Priority.P1]: 2, [Priority.P2]: 1 };
    return list.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      const scoreA = priorityScore[a.priority];
      const scoreB = priorityScore[b.priority];
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.createdAt - a.createdAt;
    });
  }, [todos, filter]);

  const navItems: { id: AppTab; label: string; icon: typeof ListTodo }[] = [
    { id: 'todo', label: t.nav.todo, icon: ListTodo },
    { id: 'stats', label: t.nav.stats, icon: BarChart3 },
    { id: 'docs', label: t.nav.agentHome, icon: House },
  ];

  const exitProjectNameEditMode = useCallback(() => {
    setEditingProjectNames(false);
  }, []);

  const navToggle = (
    <button
      type="button"
      onClick={() => setNavCollapsed(!navCollapsed)}
      className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
      title={navCollapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
    >
      {navCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
    </button>
  );

  const activitySummary = useMemo(() => {
    const todayKey = dayKeyFromTs(Date.now());
    const today = activityMap[todayKey] || { created: 0, completed: 0 };
    let streak = 0;
    for (let i = 0; i < 30; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKeyFromTs(d.getTime());
      const day = activityMap[key];
      if (!day || day.completed <= 0) break;
      streak += 1;
    }
    const weeklyDone = Array.from({ length: 7 }).reduce((acc, _, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - idx);
      const key = dayKeyFromTs(d.getTime());
      return acc + (activityMap[key]?.completed || 0);
    }, 0);
    const streakGoal = 7;
    const streakProgress = Math.min(100, Math.round((streak / streakGoal) * 100));
    return {
      ...today,
      streak,
      weeklyDone,
      streakGoal,
      streakProgress,
    };
  }, [activityMap]);

  const todayFocusCount = useMemo(() => {
    const todayKey = dayKeyFromTs(Date.now());
    return focusSessionMap[todayKey] || 0;
  }, [focusSessionMap]);

  const totalFocusCount = useMemo(
    () => Object.values(focusSessionMap).reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0),
    [focusSessionMap]
  );

  const totalCompletedCount = useMemo(() => todos.filter((todo) => todo.isCompleted).length, [todos]);

  const focusProgress = Math.min(1, Math.max(0, (FOCUS_DURATION_SECONDS - focusRemainingSeconds) / FOCUS_DURATION_SECONDS));

  const completeFocusSession = useCallback(() => {
    incrementFocusTree(true);
  }, [incrementFocusTree]);

  const reconcileFocusTimer = useCallback(
    (endAt: number) => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setFocusRemainingSeconds(left);
      if (left <= 0) {
        if (focusCompletedEndAtRef.current === endAt) return;
        focusCompletedEndAtRef.current = endAt;
        setFocusEndAt(null);
        setFocusRemainingSeconds(FOCUS_DURATION_SECONDS);
        completeFocusSession();
      }
    },
    [completeFocusSession]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!focusEndAt) {
      localStorage.removeItem(focusTimerStorageKeyForProject(activeProjectId));
      if (focusTickTimerRef.current) window.clearInterval(focusTickTimerRef.current);
      focusTickTimerRef.current = null;
      focusCompletedEndAtRef.current = null;
      return;
    }
    localStorage.setItem(focusTimerStorageKeyForProject(activeProjectId), JSON.stringify({ endAt: focusEndAt }));
    reconcileFocusTimer(focusEndAt);
    focusTickTimerRef.current = window.setInterval(() => reconcileFocusTimer(focusEndAt), 1000);
    const onResume = () => reconcileFocusTimer(focusEndAt);
    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);
    return () => {
      if (focusTickTimerRef.current) window.clearInterval(focusTickTimerRef.current);
      focusTickTimerRef.current = null;
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
    };
  }, [focusEndAt, activeProjectId, reconcileFocusTimer]);

  const startFocusTimer = useCallback(() => {
    const nextEndAt = Date.now() + FOCUS_DURATION_SECONDS * 1000;
    setFocusEndAt((prev) => {
      if (prev != null) return prev;
      setFocusRemainingSeconds(FOCUS_DURATION_SECONDS);
      focusCompletedEndAtRef.current = null;
      return nextEndAt;
    });
  }, []);

  const focusTimerHeaderSlot = (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onMouseEnter={() => setFocusHover(true)}
        onMouseLeave={() => setFocusHover(false)}
        onClick={() => startFocusTimer()}
        className={`relative z-10 w-11 h-11 shrink-0 flex items-center justify-center rounded-full border transition-all duration-300 ${
          focusEndAt
            ? 'border-transparent bg-emerald-50/80 text-emerald-700'
            : 'border-emerald-200/90 bg-white text-emerald-600 hover:bg-emerald-50'
        }`}
        title={language === 'zh' ? '专注25分钟' : 'Focus for 25 minutes'}
        aria-label={
          focusEndAt
            ? language === 'zh'
              ? `专注进行中，剩余 ${formatFocusCountdown(focusRemainingSeconds)}`
              : `Focus in progress, ${formatFocusCountdown(focusRemainingSeconds)} left`
            : language === 'zh'
              ? '开始专注25分钟'
              : 'Start 25-minute focus'
        }
      >
        {focusEndAt ? (
          <span
            className="focus-dashed-orbit absolute inset-0 rounded-full border border-dashed border-emerald-400/55 pointer-events-none"
            aria-hidden
          />
        ) : null}
        <span className="relative z-10 flex h-8 w-8 items-center justify-center">
          <span
            aria-hidden
            className="text-[16px] leading-none transition-all duration-700"
            style={{
              transform: `scale(${0.92 + focusProgress * 0.18})`,
              filter: focusEndAt ? 'none' : 'grayscale(0.15)',
            }}
          >
            {focusTreeEmojiByProgress(focusProgress)}
          </span>
        </span>
        {focusHover ? (
          <span className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 shadow">
            {focusEndAt
              ? language === 'zh'
                ? `剩余 ${formatFocusCountdown(focusRemainingSeconds)} · 目标 25:00`
                : `${formatFocusCountdown(focusRemainingSeconds)} left · goal 25:00`
              : language === 'zh'
                ? '专注25分钟'
                : 'Focus 25 minutes'}
          </span>
        ) : null}
      </button>
    </div>
  );

  return (
    <WorkspaceSyncProvider bumpSync={bumpRemotePush}>
    <div className="min-h-screen bg-[#fcfcfc] flex">
      {toast ? (
        <div className="pointer-events-none fixed top-4 left-1/2 z-[80] -translate-x-1/2">
          <div
            key={toast.id}
            className="rounded-2xl border border-emerald-200/90 bg-white/95 px-5 py-3 shadow-xl shadow-emerald-100/70 backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-emerald-700">{toast.title}</p>
            <p className="text-xs text-emerald-600/90">{toast.subtitle}</p>
          </div>
        </div>
      ) : null}
      <aside
        className={`
          flex-shrink-0 h-screen bg-[#fafafa] border-r border-gray-100 transition-[width] duration-300 ease-out overflow-hidden
          ${navCollapsed ? 'w-0 border-r-0' : 'w-52'}
        `}
        aria-hidden={navCollapsed}
      >
        <nav className="h-full flex flex-col pt-8 px-3 pb-6 w-52 min-h-0">
          <div className="shrink-0 mb-3 w-full">
            <ProjectSwitcher
              activeProjectId={activeProjectId}
              projects={projects}
              onSelectProject={selectProject}
              onAddProject={addProject}
              editing={editingProjectNames}
              onToggleEditing={() => setEditingProjectNames((v) => !v)}
              onRenameProject={renameProject}
              onPopoverClose={exitProjectNameEditMode}
            />
          </div>
          <div className="space-y-1 min-h-0 flex-1 overflow-y-auto">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(appPathFromTab(id))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors text-left ${
                  activeTab === id
                    ? 'bg-white text-black shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
                }`}
              >
                <Icon size={20} strokeWidth={2} className="shrink-0 opacity-80" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/focus')}
            className="mt-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm text-left hover:border-emerald-200 hover:shadow-md transition-all"
            title={language === 'zh' ? '进入专注力养成页' : 'Open focus growth page'}
          >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
                  {language === 'zh' ? '今日专注' : 'Today Focus'}
                </p>
                <span className="text-[10px] font-medium text-emerald-600">
                  {language === 'zh' ? `连续 ${activitySummary.streak} 天` : `${activitySummary.streak}-day streak`}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 px-2 py-2">
                  <p className="text-[10px] text-gray-400">{language === 'zh' ? '已创建' : 'Created'}</p>
                  <p className="text-lg font-semibold text-gray-800">{activitySummary.created}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-2 py-2">
                  <p className="text-[10px] text-emerald-600/70">{language === 'zh' ? '已完成' : 'Done'}</p>
                  <p className="text-lg font-semibold text-emerald-700">{activitySummary.completed}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-2 py-2">
                <div className="flex items-center justify-between text-[10px] text-emerald-700/80 mb-1">
                  <span>{language === 'zh' ? '7天专注骑行' : '7-Day Focus Ride'}</span>
                  <span>{activitySummary.streak}/{activitySummary.streakGoal}</span>
                </div>
                <div className="relative h-8">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-emerald-100" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500 transition-all duration-700"
                    style={{ width: `${activitySummary.streakProgress}%` }}
                  />
                  <div
                    className="absolute top-1/2 text-base transition-all duration-700"
                    style={{
                      left: `calc(${activitySummary.streakProgress}% - 10px)`,
                      transform: 'translateY(-50%) scaleX(-1)',
                    }}
                    aria-hidden
                  >
                    🚴
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm" aria-hidden>
                    🏁
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700/70">
                  {language === 'zh' ? '连续完成 7 天，骑到终点。' : 'Stay focused for 7 days to reach the finish.'}
                </p>
              </div>
              <div className="mt-3 rounded-xl border border-emerald-100/80 bg-emerald-50/40 px-2 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-emerald-700/70">{language === 'zh' ? '今日种树' : 'Trees Today'}</p>
                  <p className="text-[10px] font-semibold text-emerald-700">
                    {language === 'zh' ? `${todayFocusCount} 棵` : `${todayFocusCount} trees`}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-1.5 min-h-5">
                  {todayFocusCount > 0 ? (
                    Array.from({ length: Math.min(todayFocusCount, 12) }).map((_, idx) => (
                      <Trees key={`focus-tree-${idx}`} size={14} className="text-emerald-600/90" strokeWidth={1.8} />
                    ))
                  ) : (
                    <span className="text-[10px] text-emerald-700/60">
                      {language === 'zh' ? '完成 25 分钟可种树' : 'Complete 25 minutes to plant a tree'}
                    </span>
                  )}
                  {todayFocusCount > 12 ? (
                    <span className="text-[10px] font-semibold text-emerald-700/80">+{todayFocusCount - 12}</span>
                  ) : null}
                </div>
              </div>
          </button>
        </nav>
      </aside>

      <div className="flex-1 h-screen overflow-hidden flex flex-col min-w-0">
        <div className="app-main-scroll flex-1 overflow-y-auto pt-0 pb-6 px-4 md:px-8">
          <div className="max-w-[1000px] mx-auto w-full">
            <main className="space-y-10">
              {activeTab === 'todo' && (
                <>
                  <div className={`${APP_MAIN_STICKY_BAR} flex items-center justify-between gap-3 flex-wrap`}>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {navToggle}
                      <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-full w-fit">
                        {(['ALL', Priority.P0, Priority.P1, Priority.P2] as FilterType[]).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all ${filter === f ? 'bg-white shadow-md text-black' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {f === 'ALL' ? t.app.all : f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {focusTimerHeaderSlot}
                      <button
                        type="button"
                        onClick={() => void openGlobalChat()}
                        className="w-11 h-11 flex items-center justify-center rounded-full border border-stone-200/90 bg-white text-stone-500 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800 active:scale-90"
                        title={t.app.aiAssistant}
                      >
                        <Bot size={19} strokeWidth={1.5} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={addTodo}
                        className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-90 shadow-2xl shadow-black/10"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {filteredAndSortedTodos.length > 0 ? (
                      filteredAndSortedTodos.map(todo => (
                        <div key={todo.id} id={`todo-${todo.id}`}>
                          <TodoItem
                            todo={todo}
                            onUpdate={updateTodo}
                            onDelete={deleteTodo}
                            isHighlighted={highlightedTodoId === todo.id}
                            focusRequestToken={focusRequestByTodoId[todo.id] ?? 0}
                            historyApplyRequest={historyApplyByTodoId[todo.id]}
                            onEditorFocus={(id) => setFocusedTodoId(id)}
                            onOpenChat={(payload) => void openTodoChat(todo, payload)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="py-40 text-center space-y-6 border-2 border-dashed border-gray-100 rounded-[48px]">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                          <LayoutGrid className="text-gray-200" size={40} />
                        </div>
                        <p className="text-gray-300 font-bold uppercase tracking-widest text-sm">{t.app.empty}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'stats' && (
                <AIAnalysisPage
                  embedded
                  embeddedHeaderLeading={navToggle}
                  todos={todos}
                  analysisByTodoId={analysisByTodoId}
                  analysisLoadingByTodoId={analysisLoadingByTodoId}
                  sopMarkdown={sopMarkdown}
                  sopLoading={sopLoading}
                />
              )}

              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <div className={`${APP_MAIN_STICKY_BAR} flex items-center gap-3 flex-wrap`}>
                    {navToggle}
                  </div>
                  <AgentHomePanel
                    projectId={activeProjectId}
                    todos={todos}
                    analysisByTodoId={analysisByTodoId}
                    sopMarkdown={sopMarkdown}
                  />
                </div>
              )}

              {activeTab === 'focus' && (
                <div className="space-y-4">
                  <div className={`${APP_MAIN_STICKY_BAR} flex items-center justify-between gap-3 flex-wrap`}>
                    <div className="flex items-center gap-3 min-w-0">
                      {navToggle}
                      <h2 className="text-base font-semibold text-gray-800">
                        {language === 'zh' ? '专注力养成' : 'Focus Garden'}
                      </h2>
                    </div>
                    {focusTimerHeaderSlot}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                      <p className="text-xs text-emerald-700/70">{language === 'zh' ? '今天种下的树' : 'Trees Planted Today'}</p>
                      <p className="mt-2 text-3xl font-semibold text-emerald-700">{todayFocusCount}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-5">
                      <p className="text-xs text-gray-500">{language === 'zh' ? '累计种下的树' : 'Total Trees Planted'}</p>
                      <p className="mt-2 text-3xl font-semibold text-gray-800">{totalFocusCount}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                      <p className="text-xs text-gray-500">{language === 'zh' ? '今日完成任务' : 'Tasks Completed Today'}</p>
                      <p className="mt-2 text-3xl font-semibold text-gray-800">{activitySummary.completed}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-5">
                      <p className="text-xs text-gray-500">{language === 'zh' ? '累计完成任务' : 'Total Tasks Completed'}</p>
                      <p className="mt-2 text-3xl font-semibold text-gray-800">{totalCompletedCount}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white p-5">
                    <p className="text-sm font-semibold text-gray-800">
                      {language === 'zh' ? '你的树林' : 'Your Forest'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {totalFocusCount > 0 ? (
                        Array.from({ length: Math.min(totalFocusCount, 80) }).map((_, idx) => (
                          <Trees key={`forest-tree-${idx}`} size={18} className="text-emerald-600" strokeWidth={1.8} />
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          {language === 'zh'
                            ? '先开启一次 25 分钟专注，种下你的第一棵树。'
                            : 'Start your first 25-minute focus session to plant a tree.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <button
          type="button"
          onMouseDown={() => setIsResizingChat(true)}
          className="w-px shrink-0 h-screen bg-gray-200/80 hover:bg-blue-400/90 active:bg-blue-500/90 transition-colors cursor-col-resize"
          title={t.chat.resizeHandleTooltip}
        />
      )}

      <ChatPanel
        key={activeProjectId}
        projectId={activeProjectId}
        isOpen={isChatOpen}
        width={chatWidth}
        onClose={closeChat}
        initialTodo={currentTodoForChatLive}
        launchPayload={chatLaunchPayload}
        onNewGlobalChat={() => void openGlobalChat()}
        onTodoAgentCardResolved={handleTodoAgentCardResolved}
        onTodoAgentCardStatusChange={handleTodoAgentCardStatusChange}
        onAgentQuotaExceeded={() => setPaywallOpen(true)}
        beforeSendMessage={async () => {
          try {
            const ok = await checkCanOpenAgent();
            if (!ok) setPaywallOpen(true);
            return ok;
          } catch {
            return true;
          }
        }}
      />

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUpgrade={startStripeCheckout}
      />

      <UserSettings />

      <div className="fixed inset-0 pointer-events-none -z-20 opacity-[0.03]">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>
    </div>
    </WorkspaceSyncProvider>
  );
};

export default AppShell;
