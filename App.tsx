
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, LayoutGrid, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { Todo, Priority, FilterType } from './types';
import { generateId, loadTodos, saveTodos } from './utils';
import { TodoItem } from './components/TodoItem';
import { ChatPanel } from './components/ChatPanel';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [highlightedTodoId, setHighlightedTodoId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentTodoForChat, setCurrentTodoForChat] = useState<Todo | undefined>(undefined);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

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

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
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
      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="fixed left-6 top-6 z-20 w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors rounded-full"
      >
        {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`
          flex-shrink-0 h-screen bg-[#fcfcfc] transition-all duration-300 ease-out
          ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-72 opacity-100'}
        `}
      >
        <div className="h-full flex flex-col pt-16 px-6">
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

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12 lg:px-24">
          <div className="max-w-[1000px] mx-auto">
            <main className="space-y-10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-full w-fit">
                  {(['ALL', Priority.P0, Priority.P1, Priority.P2] as FilterType[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-8 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all ${filter === f ? 'bg-white shadow-md text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {f === 'ALL' ? '全部' : f}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openGlobalChat}
                    className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all active:scale-90 shadow-2xl shadow-blue-500/20"
                    title="AI 助手"
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
                    <p className="text-gray-300 font-bold uppercase tracking-widest text-sm">空无一物 / 期待你的灵感</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Chat Panel - 同层级布局 */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={closeChat}
        initialTodo={currentTodoForChat}
        onNewGlobalChat={openGlobalChat}
      />
      
      <div className="fixed inset-0 pointer-events-none -z-20 opacity-[0.03]">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>
    </div>
  );
};

export default App;
