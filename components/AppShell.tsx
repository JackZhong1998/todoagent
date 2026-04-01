import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, LayoutGrid, ChevronLeft, ChevronRight, Bot, ListTodo, BarChart3, FileText } from 'lucide-react';
import { Todo, Priority, FilterType } from '../types';
import { generateId, stripHtmlTags } from '../utils';
import {
  ensureProjectsWithMigration,
  loadProjectAnalysis,
  loadProjectTodos,
  saveManifest,
  saveProjectAnalysis,
  saveProjectTodos,
  seedEmptyWorkspace,
  type ProjectMeta,
} from '../utils/projectStorage';
import {
  TASK_REPLACEABILITY_SYSTEM_PROMPT,
  buildSingleTaskReplaceabilityUserPrompt,
  normalizeStringArray,
} from '../utils/taskReplaceabilityAnalysis';
import { TodoItem } from './TodoItem';
import { ChatPanel } from './ChatPanel';
import { UserSettings } from './UserSettings';
import { AIAnalysisPage, AnalysisResultItem, Replaceability, ANALYSIS_FAILED_TASK_TYPE } from './AIAnalysisPage';
import { DocumentsPanel } from './DocumentsPanel';
import { ProjectSwitcher } from './ProjectSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { WorkspaceSyncProvider } from '../contexts/WorkspaceSyncContext';
import { useWorkspaceSupabaseSync } from '../hooks/useWorkspaceSupabaseSync';
import { usePageSeo } from '../utils/pageSeo';

type AppTab = 'todo' | 'stats' | 'docs';

interface AppShellProps {
  initialPage?: 'todo' | 'analysis';
}

const KIMI_SYSTEM_PROMPT = "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。";

const TASK_ANALYSIS_SYSTEM = `${KIMI_SYSTEM_PROMPT}

${TASK_REPLACEABILITY_SYSTEM_PROMPT}`;

const normalizeReplaceability = (value: string): Replaceability => {
  if (value.includes('不可替代')) return '不可替代';
  if (value.includes('可替代')) return '可替代';
  return '不清楚';
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

const AppShell: React.FC<AppShellProps> = ({ initialPage = 'todo' }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const isAnalysisPath = location.pathname === '/app/analysis';
  const appSeo = isAnalysisPath ? t.seo.appAnalysis : t.seo.appWorkspace;
  const appPath = isAnalysisPath ? '/app/analysis' : '/app';
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
  const [activeTab, setActiveTab] = useState<AppTab>(() => (initialPage === 'analysis' ? 'stats' : 'todo'));
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [currentTodoForChat, setCurrentTodoForChat] = useState<Todo | undefined>(undefined);
  const [analysisByTodoId, setAnalysisByTodoId] = useState<Record<string, AnalysisResultItem>>(() =>
    loadProjectAnalysis(initialManifest.activeProjectId)
  );
  const [analysisLoadingByTodoId, setAnalysisLoadingByTodoId] = useState<Record<string, boolean>>({});
  const [analysisRetryCountByTodoId, setAnalysisRetryCountByTodoId] = useState<Record<string, number>>({});
  const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY || '';

  const { bumpRemotePush } = useWorkspaceSupabaseSync({
    projects,
    activeProjectId,
    todos,
    analysisByTodoId,
    setProjects,
    setActiveProjectId,
    setTodos,
    setAnalysisByTodoId,
  });

  useEffect(() => {
    saveProjectTodos(activeProjectId, todos);
  }, [todos, activeProjectId]);

  useEffect(() => {
    saveProjectAnalysis(activeProjectId, analysisByTodoId);
  }, [analysisByTodoId, activeProjectId]);

  const selectProject = (id: string) => {
    if (id === activeProjectId) return;
    saveProjectTodos(activeProjectId, todos);
    saveProjectAnalysis(activeProjectId, analysisByTodoId);
    setActiveProjectId(id);
    setTodos(loadProjectTodos(id));
    setAnalysisByTodoId(loadProjectAnalysis(id));
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
    if (!apiKey) return;
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
  }, [todos, analysisByTodoId, analysisLoadingByTodoId, analysisRetryCountByTodoId, apiKey]);

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
  };

  const analyzeSingleCompletedTodo = async (todo: Todo) => {
    if (!apiKey) return;
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

      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'kimi-k2.5',
          temperature: 1,
          messages: [
            { role: 'system', content: TASK_ANALYSIS_SYSTEM },
            { role: 'user', content: prompt },
          ],
        }),
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
      const data = await response.json();
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

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    let completedTodoForAnalysis: Todo | null = null;
    setTodos(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, ...updates };
      if (!t.isCompleted && next.isCompleted) {
        completedTodoForAnalysis = next;
      }
      return next;
    }));
    if (completedTodoForAnalysis) {
      void analyzeSingleCompletedTodo(completedTodoForAnalysis);
    }
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const openGlobalChat = () => {
    setCurrentTodoForChat(undefined);
    setIsChatOpen(true);
  };

  const openTodoChat = (todo: Todo) => {
    setCurrentTodoForChat(todo);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setCurrentTodoForChat(undefined);
  };

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
    { id: 'docs', label: t.nav.docs, icon: FileText },
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

  return (
    <WorkspaceSyncProvider bumpSync={bumpRemotePush}>
    <div className="min-h-screen bg-[#fcfcfc] flex">
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
                onClick={() => setActiveTab(id)}
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
        </nav>
      </aside>

      <div className="flex-1 h-screen overflow-hidden flex flex-col min-w-0">
        <div className="app-main-scroll flex-1 overflow-y-auto py-6 px-4 md:px-8">
          <div className="max-w-[1000px] mx-auto w-full">
            <main className="space-y-10">
              {activeTab === 'todo' && (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
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
                      <button
                        type="button"
                        onClick={openGlobalChat}
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
                            onOpenChat={() => openTodoChat(todo)}
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
                <div className="space-y-6">
                  <div className="flex items-center gap-2">{navToggle}</div>
                  <AIAnalysisPage
                    embedded
                    todos={todos}
                    analysisByTodoId={analysisByTodoId}
                    analysisLoadingByTodoId={analysisLoadingByTodoId}
                  />
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">{navToggle}</div>
                  <DocumentsPanel key={activeProjectId} projectId={activeProjectId} />
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
        initialTodo={currentTodoForChat}
        onNewGlobalChat={openGlobalChat}
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
