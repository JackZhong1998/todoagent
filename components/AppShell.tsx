import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutGrid, ChevronLeft, ChevronRight, Bot, BrainCircuit } from 'lucide-react';
import { Todo, Priority, FilterType } from '../types';
import { generateId, loadTodos, saveTodos, stripHtmlTags } from '../utils';
import { TodoItem } from './TodoItem';
import { ChatPanel } from './ChatPanel';
import { UserSettings } from './UserSettings';
import { AIAnalysisPage, AnalysisResultItem, Replaceability } from './AIAnalysisPage';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface AppShellProps {
  initialPage?: 'todo' | 'analysis';
}

const ANALYSIS_STORAGE_KEY = 'todo_task_ai_analysis';
const KIMI_SYSTEM_PROMPT = "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。";

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
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [highlightedTodoId, setHighlightedTodoId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [currentTodoForChat, setCurrentTodoForChat] = useState<Todo | undefined>(undefined);
  const [analysisByTodoId, setAnalysisByTodoId] = useState<Record<string, AnalysisResultItem>>(() => {
    const saved = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  });
  const [analysisLoadingByTodoId, setAnalysisLoadingByTodoId] = useState<Record<string, boolean>>({});
  const [analysisRetryCountByTodoId, setAnalysisRetryCountByTodoId] = useState<Record<string, number>>({});
  const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY || '';

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analysisByTodoId));
  }, [analysisByTodoId]);

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
      return result.taskType === '分析失败' && retryCount < maxRetry;
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
        title: todo.title || '无标题',
        content: stripHtmlTags(todo.content || ''),
        priority: todo.priority,
        totalTimeSeconds: todo.totalTime,
      };
      const prompt = `请分析以下这个已完成任务，判断它未来是否可由 AI 替代执行。

返回格式必须是严格 JSON 对象，不要输出任何额外文字。字段：
- todoId: string
- title: string
- taskType: string（任务类型）
- replaceability: string（只能是"可替代"、"不可替代"、"不清楚"）
- process: string（分析过程，1-3句）
- reason: string（结论原因，1-2句）

任务：
${JSON.stringify(taskPayload, null, 2)}`;

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
            { role: 'system', content: KIMI_SYSTEM_PROMPT },
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
        throw new Error('AI 返回格式不是有效 JSON。');
      }
      const normalized: AnalysisResultItem = {
        ...parsed,
        todoId: parsed.todoId || todo.id,
        title: parsed.title || todo.title || '无标题',
      };
      setAnalysisByTodoId(prev => ({ ...prev, [todo.id]: normalized }));
      setAnalysisRetryCountByTodoId(prev => ({ ...prev, [todo.id]: 0 }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      setAnalysisRetryCountByTodoId(prev => ({ ...prev, [todo.id]: (prev[todo.id] || 0) + 1 }));
      setAnalysisByTodoId(prev => ({
        ...prev,
        [todo.id]: {
          todoId: todo.id,
          title: todo.title || '无标题',
          taskType: '分析失败',
          replaceability: '不清楚',
          process: `AI 分析调用失败：${message}`,
          reason: '系统会自动重试最多 2 次；若仍失败，请检查 API Key、余额或网络连接。',
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

  const sidebarTodos = useMemo(() => {
    return todos.sort((a, b) => b.createdAt - a.createdAt);
  }, [todos]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex">
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="fixed left-6 top-6 z-20 w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors rounded-full"
      >
        {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <aside
        className={`
          flex-shrink-0 h-screen bg-[#fcfcfc] transition-all duration-300 ease-out
          ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-36 opacity-100'}
        `}
      >
        <div className="h-full flex flex-col pt-16 px-2">
          <div className="flex-1 overflow-y-auto">
            {sidebarTodos.length > 0 ? (
              <div className="space-y-1">
                {sidebarTodos.map(todo => (
                  <button
                    key={todo.id}
                    onClick={() => {
                      setHighlightedTodoId(todo.id);
                      const element = document.getElementById(`todo-${todo.id}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => setHighlightedTodoId(null), 2000);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${highlightedTodoId === todo.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    <span className={`text-sm font-medium truncate block ${todo.title ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                      {todo.title || '新任务'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <LayoutGrid className="text-gray-200" size={20} />
                </div>
                <p className="text-xs text-gray-300 font-bold uppercase tracking-widest">暂无标题</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 h-screen overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto pl-16 pr-2 py-6 md:pl-16 md:pr-4 lg:pl-16 lg:pr-6">
          <div className="max-w-[1000px] mr-auto">
            <main className="space-y-10">
              {initialPage === 'todo' ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-full w-fit">
                      {(['ALL', Priority.P0, Priority.P1, Priority.P2] as FilterType[]).map(f => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all ${filter === f ? 'bg-white shadow-md text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {f === 'ALL' ? t.app.all : f}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/app/analysis')}
                        className="w-11 h-11 bg-white border border-gray-200 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all active:scale-90 shadow-lg shadow-gray-200/40"
                        title="任务可替代性分析"
                      >
                        <BrainCircuit size={20} strokeWidth={2.4} />
                      </button>
                      <button
                        onClick={openGlobalChat}
                        className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all active:scale-90 shadow-2xl shadow-blue-500/20"
                        title={t.app.aiAssistant}
                      >
                        <Bot size={20} strokeWidth={2.5} />
                      </button>
                      <button
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
              ) : (
                <AIAnalysisPage
                  todos={todos}
                  analysisByTodoId={analysisByTodoId}
                  analysisLoadingByTodoId={analysisLoadingByTodoId}
                  onBack={() => navigate('/app')}
                />
              )}
            </main>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <button
          onMouseDown={() => setIsResizingChat(true)}
          className="w-1 h-screen bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize"
          title="拖拽调整对话框宽度"
        />
      )}

      <ChatPanel
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
  );
};

export default AppShell;
