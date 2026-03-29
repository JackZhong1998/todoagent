
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Trash2, CheckCircle, Circle, CalendarClock, Bot } from 'lucide-react';
import { Todo, Priority } from '../types';
import { formatDuration, formatFullDateTimeShort, formatDeadlineShort } from '../utils';
import { PriorityBadge } from './PriorityBadge';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  isHighlighted?: boolean;
  onOpenChat?: () => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onDelete, isHighlighted = false, onOpenChat }) => {
  const [currentTime, setCurrentTime] = useState(todo.totalTime);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [deadlineTime, setDeadlineTime] = useState<string>('');
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      if (!todo.title && !todo.content && todo.priority !== Priority.P0) {
        onUpdate(todo.id, { priority: Priority.P0 });
      }
    }
  }, [todo.id]);

  // 仅在非专注状态且内容确实不同时同步 state 到 innerHTML，避免输入时光标跳动
  useEffect(() => {
    if (editorRef.current && 
        document.activeElement !== editorRef.current) {
      
      let contentToDisplay = todo.content;
      // 如果 content 为空，初始化显示 H1
      if (!contentToDisplay) {
          contentToDisplay = todo.title ? `<h1>${todo.title}</h1>` : '<h1><br></h1>';
      }
      
      if (editorRef.current.innerHTML !== (contentToDisplay || '')) {
        editorRef.current.innerHTML = contentToDisplay || '';
      }
    }
  }, [todo.content, todo.title, todo.id]);

  // 点击编辑器外部时关闭图片控制面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlPanelRef.current && !controlPanelRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.tagName !== 'IMG') {
          setSelectedImage(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 计时器逻辑
  useEffect(() => {
    if (todo.isRunning) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      onUpdate(todo.id, { totalTime: currentTime });
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [todo.isRunning, todo.id]);

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(todo.id, { isRunning: !todo.isRunning });
  };

  const saveContent = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      
      // Extract title from content logic
      let newTitle = '无标题';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newContent;
      const textContent = tempDiv.innerText || tempDiv.textContent || '';
      const firstLine = textContent.split('\n').find(line => line.trim() !== '');
      if (firstLine) {
        newTitle = firstLine.trim().substring(0, 50);
      } else {
        // Fallback to empty title if content is empty
        newTitle = '';
      }

      if (newContent !== todo.content) {
        // If content is completely empty, we might want to keep the title?
        // But if user deleted everything, maybe title should be empty too?
        // Let's stick to the extracted title.
        onUpdate(todo.id, { content: newContent, title: newTitle });
      }
    }
  }, [todo.id, todo.content, todo.title, onUpdate]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const imgHtml = `<div class="my-4"><img src="${base64}" class="max-w-[400px] h-auto rounded-xl border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow" alt="image" /></div><p><br></p>`;
            document.execCommand('insertHTML', false, imgHtml);
            saveContent();
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
      }
    }
  }, [saveContent]);

  const toggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(todo.id, { isCompleted: !todo.isCompleted });
  };

  const changePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priorities = [Priority.P2, Priority.P1, Priority.P0];
    const currentIndex = priorities.indexOf(todo.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    onUpdate(todo.id, { priority: nextPriority });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      const anchorNode = selection?.anchorNode;
      const h1 = anchorNode?.nodeName === 'H1' ? anchorNode : anchorNode?.parentElement?.closest('h1');
      
      if (h1) {
        // 让浏览器处理换行，然后强制转换为普通段落
        setTimeout(() => {
          document.execCommand('formatBlock', false, 'div');
        }, 0);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || !selection.focusNode) return;
    
    const node = selection.focusNode;
    const text = node.textContent || '';
    
    if (text.endsWith('\u00A0') || text.endsWith(' ')) {
      const trimmedText = text.trim();
      
      if (trimmedText === '#') {
        // H1
        node.textContent = '';
        document.execCommand('formatBlock', false, 'H1');
        const selection = window.getSelection();
        const focusNode = selection?.focusNode;
        const h1 = (focusNode?.nodeName === 'H1' ? focusNode : focusNode?.parentElement?.closest('h1')) as HTMLElement;
        if (h1) {
          h1.className = 'text-3xl font-bold text-black mt-6 mb-4 leading-tight';
        }
      } else if (trimmedText === '##') {
        // H2
        node.textContent = '';
        document.execCommand('formatBlock', false, 'H2');
        const selection = window.getSelection();
        const focusNode = selection?.focusNode;
        const h2 = (focusNode?.nodeName === 'H2' ? focusNode : focusNode?.parentElement?.closest('h2')) as HTMLElement;
        if (h2) {
          h2.className = 'text-2xl font-semibold text-gray-500 mt-5 mb-3 leading-snug';
        }
      } else if (trimmedText === '-') {
        node.textContent = '';
        document.execCommand('insertUnorderedList');
      } else if (trimmedText === '1.') {
        node.textContent = '';
        document.execCommand('insertOrderedList');
      } else if (trimmedText === '```') {
        node.textContent = '';
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.innerHTML = '<br>';
        pre.appendChild(code);
        pre.className = 'bg-gray-50 text-gray-800 p-4 rounded-lg my-3 font-mono text-sm border border-gray-100 overflow-x-auto block';
        document.execCommand('insertHTML', false, pre.outerHTML);
      }
    }
    saveContent();
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImage(target as HTMLImageElement);
    }
  };

  const deleteImage = () => {
    if (selectedImage) {
      selectedImage.remove();
      setSelectedImage(null);
      saveContent();
    }
  };

  const resizeImage = (scale: number) => {
    if (selectedImage) {
      const currentWidth = selectedImage.offsetWidth;
      const newWidth = Math.max(100, Math.min(800, currentWidth * scale));
      selectedImage.style.maxWidth = `${newWidth}px`;
      saveContent();
    }
  };

  const toggleFloat = () => {
    if (selectedImage) {
      if (selectedImage.classList.contains('float-left')) {
        selectedImage.classList.remove('float-left', 'mr-6', 'mb-2');
      } else {
        selectedImage.classList.add('float-left', 'mr-6', 'mb-2');
      }
      saveContent();
    }
  };

  return (
    <div 
      className={`
        group relative bg-white rounded-[24px] border border-gray-100 p-8 transition-all duration-300
        hover:shadow-xl hover:shadow-gray-100/50
        ${todo.isCompleted ? 'opacity-60 bg-gray-50/80' : ''}
        ${isHighlighted ? 'border-blue-500 ring-4 ring-blue-500/10' : ''}
      `}
    >
      {/* Combined Controls and Editor */}
      <div className="flex items-start gap-4 select-none mb-2 relative">
        <button 
          onClick={toggleComplete}
          className="mt-1 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
        >
          {todo.isCompleted ? (
            <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-50" />
          ) : (
            <Circle className="w-6 h-6 hover:stroke-blue-500" />
          )}
        </button>

        <div className="flex-1 min-w-0 relative">
          <div className="absolute top-0 right-0 flex items-center gap-3 z-10 bg-white/50 backdrop-blur-sm pl-2 rounded-bl-lg">
            <PriorityBadge 
              priority={todo.priority} 
              onClick={changePriority}
            />

            <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-gray-400 font-medium">
              <span className={todo.isRunning ? "text-blue-600 font-bold" : ""}>
                {formatDuration(currentTime)}
              </span>
            </div>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onClick={handleImageClick}
            onFocus={() => setIsEditing(true)}
            onBlur={() => { setIsEditing(false); saveContent(); }}
            className={`
              w-full outline-none text-[15px] leading-7 font-normal text-[#37352f] pr-36
              
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-black [&_h1]:mt-0 [&_h1]:mb-4 [&_h1]:leading-tight
              [&_h1:empty]:before:content-['新任务'] [&_h1:empty]:before:text-gray-200
              [&_h1:has(br:only-child)]:before:content-['新任务'] [&_h1:has(br:only-child)]:before:text-gray-200
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-500 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:leading-snug
            [&_h2:empty]:before:content-['二级标题'] [&_h2:empty]:before:text-gray-200
            [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-gray-600 [&_h3]:mt-4 [&_h3]:mb-2
            
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:marker:text-blue-500
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:marker:text-blue-500 [&_ol]:marker:font-medium
            
            [&_li]:pl-1 [&_li]:mb-1
            
            [&_pre]:bg-gray-50 [&_pre]:text-gray-800 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:my-4 [&_pre]:border [&_pre]:border-gray-100 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6
            [&_code]:bg-gray-100 [&_code]:text-[#eb5757] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[13px]
            [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_pre_code]:text-sm
            
            [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-4 [&_blockquote]:text-gray-500 [&_blockquote]:italic
            
            [&_img]:block [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:shadow-sm [&_img]:transition-all
            [&_img]:cursor-pointer [&_img]:hover:shadow-md [&_img]:border [&_img]:border-transparent [&_img]:hover:border-blue-200
            [&_.float-left]:float-left [&_.float-left]:mr-6 [&_.float-left]:mb-2
          `}
          data-placeholder="新任务"
          spellCheck={false}
        />
        
        {/* Image Control Panel */}
        {selectedImage && (
          <div 
            ref={controlPanelRef}
            className="absolute top-[-40px] right-0 bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-1.5 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => resizeImage(0.9)}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="缩小"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>
            </button>
            <button
              onClick={() => resizeImage(1.1)}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="放大"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            </button>
            <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
            <button
              onClick={toggleFloat}
              className={`p-1.5 rounded-md transition-colors ${selectedImage.classList.contains('float-left') ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              title="文字环绕 (分栏)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
            </button>
            <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
            <button
              onClick={deleteImage}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="删除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Bottom Left Created Time (only while editing) */}
      {isEditing && (
        <div className="absolute left-8 bottom-6 text-[10px] text-gray-300 font-mono tracking-tight">
          {formatFullDateTimeShort(todo.createdAt)}
        </div>
      )}

      {/* Bottom Controls */}

      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Bottom Left - AI Chat */}
        {onOpenChat && (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenChat(); }}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20"
            title="AI 助手"
          >
            <Bot size={18} />
          </button>
        )}
        
        {/* Bottom Right Controls */}
        <div className="flex items-center gap-2">
        <button
          onClick={handleToggleTimer}
          className={`
            w-10 h-10 flex items-center justify-center rounded-full transition-all
            ${todo.isRunning 
              ? 'bg-red-50 text-red-500 hover:bg-red-100 shadow-sm' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          {todo.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        
        {/* Deadline (DDL) */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setIsDeadlineOpen(v => !v); }}
            className={`${todo.deadlineAt ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'} w-10 h-10 flex items-center justify-center rounded-full transition-all`}
            title="设置DDL"
          >
            <CalendarClock size={18} />
          </button>
          {isDeadlineOpen && (
            <div className="absolute bottom-12 right-0 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-3 w-72 z-50">
              <div className="space-y-3">
                <div className="text-xs text-gray-500 font-medium">设置截止时间（年月日时）</div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-300 min-w-0"
                  />
                  <select
                    value={deadlineTime.split(':')[0]}
                    onChange={(e) => setDeadlineTime(`${e.target.value}:00`)}
                    className="w-24 text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-300 bg-white"
                  >
                    <option value="" disabled>时</option>
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsDeadlineOpen(false); }}
                    className="text-xs px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deadlineDate && deadlineTime) {
                        const ts = new Date(`${deadlineDate}T${deadlineTime}`).getTime();
                        onUpdate(todo.id, { deadlineAt: ts });
                        setIsDeadlineOpen(false);
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-md bg-black text-white hover:bg-zinc-800 transition-colors"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
        >
          <Trash2 size={18} />
        </button>
        </div>
      </div>
      
      {/* Deadline display (month-day hour) */}
      {todo.deadlineAt && (
        <div className="absolute right-8 bottom-6 text-[10px] text-blue-600 font-mono tracking-tight">
          {formatDeadlineShort(todo.deadlineAt)}
        </div>
      )}
    </div>
  );
};
