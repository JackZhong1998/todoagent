
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Trash2, CheckCircle, Circle, CalendarClock, Bot } from 'lucide-react';
import { htmlToMarkdown } from '../utils/htmlToMarkdown';
import {
  applyMarkdownLineTriggers,
  getPreviousOrderedListNextStart,
  handleTodoSubtaskBackspace,
  handleTodoSubtaskEnter,
  selectionHtmlInsideEditor,
} from '../utils/todoEditorMarkdown';
import {
  fetchTodoInlineCompletion,
  finalizeTodoInlineCompletion,
  getCaretClientRect,
  getPlainTextBeforeCaret,
  insertPlainTextAtCaret,
  shouldRequestTodoInlineCompletion,
  stripRedundantOverlap,
} from '../utils/todoInlineComplete';
import { TODO_INLINE_AI_EVENT, getTodoInlineAiEnabled } from '../utils/todoInlineCompleteSettings';
import { Todo, Priority } from '../types';
import { formatDuration, formatFullDateTimeShort, formatDeadlineShort, generateId } from '../utils';
import {
  TODO_AGENT_CARD_CLASS,
  TODO_AGENT_STATUS_TEXT_CLASS,
  setAgentCardLabelsInHtml,
  syncAgentCardStatesInEditor,
  wrapSelectionInAgentCard,
} from '../utils/todoAgentCard';
import { PriorityBadge } from './PriorityBadge';
import { useLanguage } from '../contexts/LanguageContext';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, updates: Partial<Todo>, meta?: { caretOffset?: number | null }) => void;
  onDelete: (id: string) => void;
  isHighlighted?: boolean;
  focusRequestToken?: number;
  historyApplyRequest?: {
    token: number;
    caretOffset: number | null;
  };
  onEditorFocus?: (id: string) => void;
  onOpenChat?: (payload?: {
    selectedText?: string;
    forceNewConversation?: boolean;
    autoSend?: boolean;
    conversationId?: string;
    focusConversationId?: string;
  }) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onUpdate,
  onDelete,
  isHighlighted = false,
  focusRequestToken = 0,
  historyApplyRequest,
  onEditorFocus,
  onOpenChat,
}) => {
  const { t } = useLanguage();
  const te = t.app.todoEditor;
  // 用 startTime + totalTime 派生展示，避免重渲染/同步导致“回退重置”
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imagePanelPos, setImagePanelPos] = useState<{ top: number; left: number } | null>(null);
  const [imageToast, setImageToast] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const imageToastTimerRef = useRef<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectionAgentAnchor, setSelectionAgentAnchor] = useState<{ top: number; left: number; text: string } | null>(null);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [deadlineTime, setDeadlineTime] = useState<string>('');
  const [orderListMenu, setOrderListMenu] = useState<{ top: number; left: number } | null>(null);
  const orderListTargetRef = useRef<HTMLOListElement | null>(null);
  const orderListMenuRef = useRef<HTMLDivElement>(null);
  const gutterHostRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const initRef = useRef(false);

  const [inlineAiEnabled, setInlineAiEnabled] = useState(() => getTodoInlineAiEnabled());
  const [inlineGhost, setInlineGhost] = useState<string | null>(null);
  const [inlineGhostPos, setInlineGhostPos] = useState<{
    left: number;
    top: number;
    maxW: number;
  } | null>(null);
  const inlineGhostRef = useRef<string | null>(null);
  /** 展示幽灵补全时对应的「从文档开头到光标」全文；光标移动后若不一致则清除，避免补全跟着跑 */
  const inlineGhostForPrefixRef = useRef<string | null>(null);
  const inlineDebounceRef = useRef<number | null>(null);
  const inlineAbortRef = useRef<AbortController | null>(null);
  const lastHistoryApplyTokenRef = useRef<number>(0);

  useEffect(() => {
    inlineGhostRef.current = inlineGhost;
  }, [inlineGhost]);

  useEffect(() => {
    const sync = () => setInlineAiEnabled(getTodoInlineAiEnabled());
    window.addEventListener(TODO_INLINE_AI_EVENT, sync);
    return () => window.removeEventListener(TODO_INLINE_AI_EVENT, sync);
  }, []);

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

  /** Agent 卡片状态由侧栏回调更新到 todo.content 时，即使编辑器在聚焦也要同步 data-agent-state（不误替换全文） */
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !todo.content) return;
    syncAgentCardStatesInEditor(ed, todo.content);
  }, [todo.content, todo.id]);

  useEffect(() => {
    if (!todo.content) return;
    const next = setAgentCardLabelsInHtml(todo.content, {
      thinking: te.agentThinking,
      answered: te.agentAnswered,
    });
    if (next !== todo.content) {
      onUpdate(todo.id, { content: next });
    } else if (editorRef.current) {
      syncAgentCardStatesInEditor(editorRef.current, next);
    }
  }, [te.agentThinking, te.agentAnswered, todo.id]);

  const getCaretTextOffset = useCallback((root: HTMLElement): number | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.endContainer)) return null;
    const pre = range.cloneRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.endContainer, range.endOffset);
    return pre.toString().length;
  }, []);

  const setCaretByTextOffset = useCallback((root: HTMLElement, offset: number | null) => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    if (offset == null || offset < 0) {
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let consumed = 0;
    let node = walker.nextNode();
    while (node) {
      const len = node.textContent?.length ?? 0;
      if (consumed + len >= offset) {
        range.setStart(node, Math.max(0, offset - consumed));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      consumed += len;
      node = walker.nextNode();
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const scrollCurrentCaretIntoView = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const marker = document.createElement('span');
    marker.setAttribute('data-caret-marker', '1');
    marker.style.cssText = 'display:inline-block;width:0;height:1em;vertical-align:baseline;';
    range.insertNode(marker);
    marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
    marker.remove();
  }, []);

  useEffect(() => {
    if (!focusRequestToken) return;
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    setCaretByTextOffset(ed, null);
  }, [focusRequestToken, todo.id]);

  useEffect(() => {
    const token = historyApplyRequest?.token ?? 0;
    if (!token || token === lastHistoryApplyTokenRef.current) return;
    lastHistoryApplyTokenRef.current = token;
    const ed = editorRef.current;
    if (!ed) return;
    const nextHtml = todo.content || (todo.title ? `<h1>${todo.title}</h1>` : '<h1><br></h1>');
    if (ed.innerHTML !== nextHtml) {
      ed.innerHTML = nextHtml;
    }
    ed.focus();
    setCaretByTextOffset(ed, historyApplyRequest?.caretOffset ?? null);
    requestAnimationFrame(() => scrollCurrentCaretIntoView());
  }, [historyApplyRequest?.token, setCaretByTextOffset, scrollCurrentCaretIntoView]);

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

  const showImageToast = useCallback((msg: string) => {
    if (imageToastTimerRef.current) window.clearTimeout(imageToastTimerRef.current);
    setImageToast(msg);
    imageToastTimerRef.current = window.setTimeout(() => setImageToast(null), 1600);
  }, []);

  useEffect(() => {
    return () => {
      if (imageToastTimerRef.current) window.clearTimeout(imageToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const host = gutterHostRef.current;
    const img = selectedImage;
    if (!host || !img) {
      setImagePanelPos(null);
      return;
    }

    const updatePos = () => {
      const hostRect = host.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      if (!Number.isFinite(hostRect.top) || !Number.isFinite(imgRect.top)) return;

      // 浮层放在图片右上角，略微上移，避免遮挡图片
      const top = Math.max(8, imgRect.top - hostRect.top - 44);
      const approxW = 160; // 控制面板近似宽度，用于避免越界
      const left = Math.max(8, Math.min(hostRect.width - approxW - 8, imgRect.right - hostRect.left - approxW));
      setImagePanelPos({ top, left });
    };

    updatePos();
    const onWin = () => requestAnimationFrame(updatePos);
    window.addEventListener('scroll', onWin, true);
    window.addEventListener('resize', onWin);
    return () => {
      window.removeEventListener('scroll', onWin, true);
      window.removeEventListener('resize', onWin);
    };
  }, [selectedImage]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !isEditing) {
      setSelectionAgentAnchor(null);
      return;
    }
    const updateSelectionAgentAnchor = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelectionAgentAnchor(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!ed.contains(range.commonAncestorContainer)) {
        setSelectionAgentAnchor(null);
        return;
      }
      const selectedText = sel.toString().replace(/\s+/g, ' ').trim();
      if (!selectedText) {
        setSelectionAgentAnchor(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const host = gutterHostRef.current;
      const hostRect = host?.getBoundingClientRect();
      if (!hostRect || !Number.isFinite(rect.top) || !Number.isFinite(rect.right)) {
        setSelectionAgentAnchor(null);
        return;
      }
      const top = Math.max(8, rect.top - hostRect.top - 30);
      const left = Math.max(8, rect.right - hostRect.left + 8);
      setSelectionAgentAnchor({ top, left, text: selectedText });
    };
    document.addEventListener('selectionchange', updateSelectionAgentAnchor);
    ed.addEventListener('mouseup', updateSelectionAgentAnchor);
    ed.addEventListener('keyup', updateSelectionAgentAnchor);
    return () => {
      document.removeEventListener('selectionchange', updateSelectionAgentAnchor);
      ed.removeEventListener('mouseup', updateSelectionAgentAnchor);
      ed.removeEventListener('keyup', updateSelectionAgentAnchor);
    };
  }, [isEditing, todo.id]);

  useEffect(() => {
    const onDocDown = (event: MouseEvent) => {
      if (!orderListMenu) return;
      const target = event.target as Node;
      if (orderListMenuRef.current?.contains(target)) return;
      setOrderListMenu(null);
      orderListTargetRef.current = null;
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [orderListMenu]);

  // 计时器 tick：仅用于触发 UI 每秒刷新；实际时间由 startTime/totalTime 计算
  useEffect(() => {
    if (todo.isRunning) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => setNowTick(Date.now()), 1000);
      setNowTick(Date.now());
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [todo.isRunning]);

  const currentTime =
    todo.isRunning && todo.startTime
      ? todo.totalTime + Math.max(0, Math.floor((nowTick - todo.startTime) / 1000))
      : todo.totalTime;

  const handleToggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (todo.isRunning) {
      const startedAt = todo.startTime ?? Date.now();
      const deltaSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      onUpdate(todo.id, {
        isRunning: false,
        startTime: null,
        totalTime: todo.totalTime + deltaSeconds,
      });
    } else {
      onUpdate(todo.id, { isRunning: true, startTime: Date.now() });
    }
  };

  const saveContent = useCallback((caretOffset?: number | null) => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      
      // 与侧栏标题一致：优先取首个 h1（避免 h1 与正文在 innerText 里无换行时被拼成一行）
      let newTitle = '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newContent;
      const h1 = tempDiv.querySelector('h1');
      const h1Text = (h1?.textContent || '').replace(/\s+/g, ' ').trim();
      if (h1Text) {
        newTitle = h1Text.substring(0, 50);
      } else {
        const textContent = tempDiv.innerText || tempDiv.textContent || '';
        const firstLine = textContent.split('\n').find((line) => line.trim() !== '');
        newTitle = firstLine ? firstLine.trim().substring(0, 50) : '';
      }

      if (newContent !== todo.content) {
        // If content is completely empty, we might want to keep the title?
        // But if user deleted everything, maybe title should be empty too?
        // Let's stick to the extracted title.
        onUpdate(todo.id, { content: newContent, title: newTitle }, { caretOffset: caretOffset ?? null });
      }
    }
  }, [todo.id, todo.content, todo.title, onUpdate]);

  const clearInlineSuggestion = useCallback(() => {
    if (inlineDebounceRef.current !== null) {
      window.clearTimeout(inlineDebounceRef.current);
      inlineDebounceRef.current = null;
    }
    inlineAbortRef.current?.abort();
    inlineAbortRef.current = null;
    inlineGhostForPrefixRef.current = null;
    setInlineGhost(null);
    setInlineGhostPos(null);
  }, []);

  const repositionInlineGhost = useCallback(() => {
    if (!inlineGhostRef.current) return;
    const ed = editorRef.current;
    const host = gutterHostRef.current;
    if (!ed || !host) return;
    const rect = getCaretClientRect(ed);
    if (!rect) {
      setInlineGhostPos(null);
      return;
    }
    const hostRect = host.getBoundingClientRect();
    setInlineGhostPos({
      left: rect.left - hostRect.left,
      top: rect.top - hostRect.top,
      maxW: Math.max(60, hostRect.width - (rect.left - hostRect.left) - 12),
    });
  }, []);

  const scheduleInlineComplete = useCallback(() => {
    if (!inlineAiEnabled) return;
    const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY || '';
    if (!apiKey) return;

    if (inlineDebounceRef.current !== null) {
      window.clearTimeout(inlineDebounceRef.current);
    }
    inlineDebounceRef.current = window.setTimeout(() => {
      inlineDebounceRef.current = null;
      const ed = editorRef.current;
      if (!ed || document.activeElement !== ed || isComposingRef.current) return;
      if (!shouldRequestTodoInlineCompletion(ed)) return;

      const prefix = getPlainTextBeforeCaret(ed);
      if (prefix === null || prefix.trim().length < 1) return;

      inlineAbortRef.current?.abort();
      const ac = new AbortController();
      inlineAbortRef.current = ac;
      const sentPrefix = prefix;

      void (async () => {
        try {
          const raw = await fetchTodoInlineCompletion(sentPrefix, { apiKey, signal: ac.signal });
          const merged = finalizeTodoInlineCompletion(stripRedundantOverlap(sentPrefix, raw));
          if (!merged) return;
          const ed2 = editorRef.current;
          if (!ed2 || document.activeElement !== ed2 || isComposingRef.current) return;
          if (!shouldRequestTodoInlineCompletion(ed2)) return;
          const nowPrefix = getPlainTextBeforeCaret(ed2);
          if (nowPrefix !== sentPrefix) return;
          inlineGhostForPrefixRef.current = sentPrefix;
          setInlineGhost(merged);
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      })();
    }, 480);
  }, [inlineAiEnabled]);

  useEffect(() => {
    if (!inlineAiEnabled) {
      clearInlineSuggestion();
    }
  }, [inlineAiEnabled, clearInlineSuggestion]);

  useEffect(() => {
    if (!isEditing) return;
    const onSel = () => {
      const ed = editorRef.current;
      if (!ed) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (!sel.anchorNode || !ed.contains(sel.anchorNode)) return;
      if (!sel.isCollapsed) {
        clearInlineSuggestion();
        return;
      }
      if (inlineGhostRef.current) {
        const caretPrefix = getPlainTextBeforeCaret(ed);
        if (caretPrefix !== inlineGhostForPrefixRef.current) {
          clearInlineSuggestion();
          return;
        }
        requestAnimationFrame(() => repositionInlineGhost());
      }
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [isEditing, clearInlineSuggestion, repositionInlineGhost]);

  useEffect(() => {
    if (!inlineGhost) {
      setInlineGhostPos(null);
      return;
    }
    const update = () => repositionInlineGhost();
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [inlineGhost, repositionInlineGhost]);

  const insertImageFromFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imgHtml = `<div class="my-4"><img src="${base64}" class="max-w-[400px] h-auto rounded-xl border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow" alt="image" /></div><p><br></p>`;
        document.execCommand('insertHTML', false, imgHtml);
        saveContent();
      };
      reader.readAsDataURL(file);
    },
    [saveContent]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            insertImageFromFile(file);
          }
          e.preventDefault();
        }
      }

      // 对文本粘贴：强制使用纯文本插入，避免外部样式导致不换行/超出编辑器宽度
      if (!e.defaultPrevented) {
        const text = e.clipboardData.getData('text/plain');
        if (text) {
          e.preventDefault();
          insertPlainTextAtCaret(text);
        }
      }
    },
    [insertImageFromFile]
  );

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

  const handleCopy = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const ed = editorRef.current;
    if (!ed) return;
    const partial = selectionHtmlInsideEditor(ed);
    if (partial !== null) {
      const md = htmlToMarkdown(partial);
      try {
        const tmp = document.createElement('div');
        tmp.innerHTML = partial;
        const img = tmp.querySelector('img');
        const src = img?.getAttribute('src') || '';
        if (src) {
          const hasText = (tmp.textContent ?? '').replace(/\s+/g, '').length > 0;
          if (hasText) {
            // 图文混合：plain 文本仅保留真实文字，避免出现 ![...](data:...) 大串内容
            const plainText = (tmp.textContent ?? '')
              .replace(/\u00a0/g, ' ')
              .replace(/[ \t]+\n/g, '\n')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
            e.clipboardData.setData('text/plain', plainText);
            e.clipboardData.setData('text/html', partial);
            e.preventDefault();
            return;
          }

          // 选区含图片时：不要在 text/plain 里放任何内容（否则飞书可能优先粘贴为文本/base64）
          e.clipboardData.setData('text/plain', '');
          e.clipboardData.setData('text/html', partial);
          e.preventDefault();

          const dataUrlToBlob = (dataUrl: string): Blob | null => {
            const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!m) return null;
            const mime = m[1];
            const b64 = m[2];
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            return new Blob([bytes], { type: mime });
          };

          const writeImage = async () => {
            let blob: Blob | null = null;
            if (src.startsWith('data:')) {
              blob = dataUrlToBlob(src);
            } else {
              try {
                const res = await fetch(src);
                blob = await res.blob();
              } catch {
                blob = null;
              }
            }
            if (!blob) return;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - ClipboardItem 可能未包含在当前 ts lib 配置里
            const item = new ClipboardItem({
              // 飞书桌面端很多时候更偏好读取 text/html 来粘贴富内容
              'text/html': new Blob([partial], { type: 'text/html' }),
              // 保持为空，避免被当作 base64 文本优先粘贴
              'text/plain': new Blob([''], { type: 'text/plain' }),
              [blob.type || 'image/png']: blob,
            });
            try {
              await navigator.clipboard.write([item]);
            } catch {
              // ignore
            }
          };

          void writeImage();
          return;
        }
      } catch {
        // ignore
      }
      e.clipboardData.setData('text/plain', md);
      e.clipboardData.setData('text/html', partial);
      e.preventDefault();
      return;
    }
    const html = ed.innerHTML;
    const md = htmlToMarkdown(html);
    // 整体复制时也清理 data-url 图片 markdown，避免外部应用粘贴成大串文本
    const plain = md
      .replace(/!\[[^\]]*]\s*\((?:data:[^)]+|[^)]*)\)/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    e.clipboardData.setData('text/plain', plain);
    e.clipboardData.setData('text/html', html);
    e.preventDefault();
  }, []);

  const copySelectedImage = useCallback(async () => {
    const img = selectedImage;
    if (!img) return;
    const src = img.getAttribute('src') || '';
    if (!src) return;

    const dataUrlToBlob = (dataUrl: string): Blob | null => {
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return null;
      const mime = m[1];
      const b64 = m[2];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    };

    let blob: Blob | null = null;
    if (src.startsWith('data:')) {
      blob = dataUrlToBlob(src);
    } else {
      try {
        const res = await fetch(src);
        blob = await res.blob();
      } catch {
        blob = null;
      }
    }
    if (!blob) return;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - ClipboardItem 可能未包含在当前 ts lib 配置里
    const item = new ClipboardItem({
      'text/html': new Blob([`<img src="${src}" />`], { type: 'text/html' }),
      'text/plain': new Blob([''], { type: 'text/plain' }),
      [blob.type || 'image/png']: blob,
    });
    try {
      await navigator.clipboard.write([item]);
      showImageToast('复制成功');
    } catch {
      showImageToast('复制失败，可用下载');
    }
  }, [selectedImage, showImageToast]);

  const downloadSelectedImage = useCallback(async () => {
    const img = selectedImage;
    if (!img) return;
    const src = img.getAttribute('src') || '';
    if (!src) return;

    const dataUrlToBlob = (dataUrl: string): Blob | null => {
      const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return null;
      const mime = m[1];
      const b64 = m[2];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    };

    let blob: Blob | null = null;
    let ext = 'png';
    if (src.startsWith('data:')) {
      blob = dataUrlToBlob(src);
      const mime = blob?.type || '';
      if (mime.includes('jpeg')) ext = 'jpg';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('png')) ext = 'png';
    } else {
      try {
        const res = await fetch(src);
        blob = await res.blob();
        const mime = blob.type || '';
        if (mime.includes('jpeg')) ext = 'jpg';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('png')) ext = 'png';
      } catch {
        blob = null;
      }
    }
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-image.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showImageToast('已开始下载');
  }, [selectedImage, showImageToast]);

  const handleCut = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const ed = editorRef.current;
    if (!ed) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ed.contains(sel.anchorNode)) return;

    const partial = selectionHtmlInsideEditor(ed);
    if (partial === null) return;

    const md = htmlToMarkdown(partial);
    e.clipboardData.setData('text/plain', md);
    e.clipboardData.setData('text/html', partial);
    e.preventDefault();
    sel.deleteFromDocument();
    saveContent();
  }, [saveContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && inlineGhostRef.current) {
      e.preventDefault();
      clearInlineSuggestion();
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && inlineGhostRef.current) {
      e.preventDefault();
      const text = inlineGhostRef.current;
      const ed = editorRef.current;
      if (ed && insertPlainTextAtCaret(text)) {
        clearInlineSuggestion();
        applyMarkdownLineTriggers(ed);
        saveContent();
      }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      document.execCommand('bold');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      const ed = editorRef.current;
      if (ed && handleTodoSubtaskEnter(ed)) {
        e.preventDefault();
        saveContent();
        return;
      }
    }
    if (e.key === 'Backspace' && !isComposingRef.current) {
      const ed = editorRef.current;
      if (ed && handleTodoSubtaskBackspace(ed)) {
        e.preventDefault();
        saveContent();
        return;
      }
    }
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      const anchorNode = selection?.anchorNode;
      const h1 = anchorNode?.nodeName === 'H1' ? anchorNode : anchorNode?.parentElement?.closest('h1');

      if (h1) {
        setTimeout(() => {
          document.execCommand('formatBlock', false, 'div');
        }, 0);
      }
    }
  };

  const handleInput = () => {
    const ed = editorRef.current;
    if (!ed || isComposingRef.current) return;
    clearInlineSuggestion();
    applyMarkdownLineTriggers(ed);
    const caretOffset = getCaretTextOffset(ed);
    saveContent(caretOffset);
    scheduleInlineComplete();
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    const ed = editorRef.current;
    if (!ed) return;
    clearInlineSuggestion();
    applyMarkdownLineTriggers(ed);
    saveContent(getCaretTextOffset(ed));
    scheduleInlineComplete();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const li = target.closest('li');
    if (li && li.parentElement?.tagName === 'OL') {
      const liRect = li.getBoundingClientRect();
      const markerHit = e.clientX <= liRect.left + 14;
      if (markerHit) {
        e.preventDefault();
        e.stopPropagation();
        const hostRect = gutterHostRef.current?.getBoundingClientRect();
        const ol = li.parentElement as HTMLOListElement;
        orderListTargetRef.current = ol;
        if (hostRect) {
          setOrderListMenu({
            top: Math.max(8, liRect.top - hostRect.top - 6),
            left: Math.max(8, liRect.left - hostRect.left + 12),
          });
        } else {
          setOrderListMenu({ top: 8, left: 8 });
        }
        return;
      }
    }
    const agentDot =
      (target.closest(`.${TODO_AGENT_STATUS_TEXT_CLASS}`) as HTMLElement | null) ||
      (target.closest(`.${TODO_AGENT_CARD_CLASS}`) as HTMLElement | null);
    if (agentDot && onOpenChat) {
      e.preventDefault();
      e.stopPropagation();
      const cid = agentDot.getAttribute('data-conversation-id');
      if (cid) {
        onOpenChat({ focusConversationId: cid });
      }
      return;
    }
    const todoCheck = target.closest('.todo-md-check') as HTMLElement | null;
    if (todoCheck) {
      e.preventDefault();
      e.stopPropagation();
      const nextChecked = todoCheck.dataset.todoChecked === '1' ? '0' : '1';
      todoCheck.dataset.todoChecked = nextChecked;
      todoCheck.textContent = nextChecked === '1' ? '✓' : '';
      const line = todoCheck.closest('p');
      if (line) line.classList.toggle('todo-md-done', nextChecked === '1');
      saveContent();
      return;
    }
    if (target.tagName === 'IMG') {
      setSelectedImage(target as HTMLImageElement);
    }
  };

  const applyOrderedListFollow = (restart: boolean) => {
    const ed = editorRef.current;
    const ol = orderListTargetRef.current;
    if (!ed || !ol) return;
    if (restart) {
      ol.removeAttribute('start');
    } else {
      const next = getPreviousOrderedListNextStart(ed, ol);
      if (next && next > 1) {
        ol.setAttribute('start', String(next));
      }
    }
    setOrderListMenu(null);
    orderListTargetRef.current = null;
    saveContent();
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
        todo-card group relative bg-white rounded-[24px] border border-gray-100 p-8 transition-all duration-300
        hover:shadow-xl hover:shadow-gray-100/50
        ${todo.isCompleted ? 'opacity-60 bg-gray-50/80' : ''}
        ${isHighlighted ? 'border-blue-500 ring-4 ring-blue-500/10' : ''}
      `}
    >
      {/* Combined Controls and Editor */}
      <div className="flex items-start gap-2 mb-2 relative">
        <button 
          onClick={toggleComplete}
          className="mt-1 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0 select-none"
        >
          {todo.isCompleted ? (
            <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-50" />
          ) : (
            <Circle className="w-6 h-6 hover:stroke-blue-500" />
          )}
        </button>

        <div ref={gutterHostRef} className="flex-1 min-w-0 relative">
          {isEditing && selectionAgentAnchor && onOpenChat ? (
            <button
              type="button"
              className="absolute z-50 w-8 h-8 rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm hover:bg-blue-50 transition-colors flex items-center justify-center"
              style={{ top: selectionAgentAnchor.top, left: selectionAgentAnchor.left }}
              title={te.askAgentFromSelection}
              aria-label={te.askAgentFromSelection}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const ed = editorRef.current;
                const cid = generateId();
                let wrapped = false;
                if (ed) {
                  wrapped = wrapSelectionInAgentCard(ed, cid, {
                    thinking: te.agentThinking,
                    answered: te.agentAnswered,
                  });
                  if (wrapped) saveContent();
                }
                onOpenChat({
                  selectedText: selectionAgentAnchor.text,
                  forceNewConversation: true,
                  autoSend: true,
                  conversationId: cid,
                });
                setSelectionAgentAnchor(null);
              }}
            >
              <Bot size={16} strokeWidth={1.8} />
            </button>
          ) : null}
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
            onCompositionStart={() => {
              isComposingRef.current = true;
              clearInlineSuggestion();
            }}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onCopy={handleCopy}
            onCut={handleCut}
            onClick={handleEditorClick}
            onFocus={() => {
              setIsEditing(true);
              onEditorFocus?.(todo.id);
            }}
            onBlur={() => {
              setIsEditing(false);
              setSelectionAgentAnchor(null);
              clearInlineSuggestion();
              saveContent();
            }}
            className={`
              w-full outline-none text-[15px] leading-7 font-normal text-[#37352f] select-text
              whitespace-pre-wrap break-words [overflow-wrap:anywhere]
              [&>h1:first-child]:pr-28
              
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-black [&_h1]:mt-0 [&_h1]:mb-4 [&_h1]:leading-tight
              [&_h1:empty]:before:content-['新任务'] [&_h1:empty]:before:text-gray-200
              [&_h1:has(br:only-child)]:before:content-['新任务'] [&_h1:has(br:only-child)]:before:text-gray-200
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-500 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:leading-snug
            [&_h2:empty]:before:content-['二级标题'] [&_h2:empty]:before:text-gray-200
            [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-gray-600 [&_h3]:mt-4 [&_h3]:mb-2
            [&_hr]:block [&_hr]:w-full [&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gray-200
            
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
            [&_.todo-md-check]:shrink-0 [&_.todo-md-check]:w-5 [&_.todo-md-check]:h-5 [&_.todo-md-check]:mt-1
            [&_.todo-md-check]:inline-flex [&_.todo-md-check]:items-center [&_.todo-md-check]:justify-center
            [&_.todo-md-check]:rounded-full [&_.todo-md-check]:border [&_.todo-md-check]:border-gray-300
            [&_.todo-md-check]:text-[11px] [&_.todo-md-check]:leading-none [&_.todo-md-check]:font-semibold
            [&_.todo-md-check]:text-transparent [&_.todo-md-check]:cursor-pointer [&_.todo-md-check]:select-none
            [&_.todo-md-check[data-todo-checked='1']]:bg-blue-500 [&_.todo-md-check[data-todo-checked='1']]:border-blue-500
            [&_.todo-md-check[data-todo-checked='1']]:text-white
            [&_.todo-md-done_.todo-md-content]:text-gray-400 [&_.todo-md-done_.todo-md-content]:line-through

            [&_.todo-agent-line]:inline
            [&_.todo-agent-line-text]:inline
            [&_.todo-agent-status-text]:shrink-0 [&_.todo-agent-status-text]:inline-flex [&_.todo-agent-status-text]:items-center [&_.todo-agent-status-text]:justify-center
            [&_.todo-agent-status-text]:h-6 [&_.todo-agent-status-text]:px-2 [&_.todo-agent-status-text]:ml-2 [&_.todo-agent-status-text]:rounded-md [&_.todo-agent-status-text]:cursor-pointer
            [&_.todo-agent-status-text]:select-none [&_.todo-agent-status-text]:text-[12px] [&_.todo-agent-status-text]:leading-none [&_.todo-agent-status-text]:font-medium
            [&_.todo-agent-status-text]:transition-colors [&_.todo-agent-status-text]:border [&_.todo-agent-status-text]:whitespace-nowrap [&_.todo-agent-status-text]:align-middle
            [&_.todo-agent-status-text[data-agent-state='loading']]:border-red-200 [&_.todo-agent-status-text[data-agent-state='loading']]:bg-red-50 [&_.todo-agent-status-text[data-agent-state='loading']]:text-red-700
            [&_.todo-agent-status-text[data-agent-state='loading']]:animate-pulse
            [&_.todo-agent-status-text[data-agent-state='answered']]:border-emerald-200 [&_.todo-agent-status-text[data-agent-state='answered']]:bg-emerald-50 [&_.todo-agent-status-text[data-agent-state='answered']]:text-emerald-700
            [&_.todo-agent-card]:my-1 [&_.todo-agent-card]:relative [&_.todo-agent-card]:min-w-0 [&_.todo-agent-card]:rounded-none [&_.todo-agent-card]:border-0
            [&_.todo-agent-card]:bg-transparent [&_.todo-agent-card]:p-0 [&_.todo-agent-card]:pr-4 [&_.todo-agent-card]:shadow-none
            [&_.todo-agent-card]:before:hidden [&_.todo-agent-card]:pl-0
            [&_.todo-agent-card[data-agent-state='loading']]:after:absolute [&_.todo-agent-card[data-agent-state='loading']]:after:right-0 [&_.todo-agent-card[data-agent-state='loading']]:after:top-1.5
            [&_.todo-agent-card[data-agent-state='loading']]:after:h-5 [&_.todo-agent-card[data-agent-state='loading']]:after:w-5 [&_.todo-agent-card[data-agent-state='loading']]:after:rounded-full
            [&_.todo-agent-card[data-agent-state='loading']]:after:bg-red-500 [&_.todo-agent-card[data-agent-state='loading']]:after:ring-1 [&_.todo-agent-card[data-agent-state='loading']]:after:ring-black/10
            [&_.todo-agent-card[data-agent-state='loading']]:after:content-[''] [&_.todo-agent-card[data-agent-state='loading']]:animate-pulse
            [&_.todo-agent-card[data-agent-state='answered']]:after:absolute [&_.todo-agent-card[data-agent-state='answered']]:after:right-0 [&_.todo-agent-card[data-agent-state='answered']]:after:top-1.5
            [&_.todo-agent-card[data-agent-state='answered']]:after:h-5 [&_.todo-agent-card[data-agent-state='answered']]:after:w-5 [&_.todo-agent-card[data-agent-state='answered']]:after:rounded-full
            [&_.todo-agent-card[data-agent-state='answered']]:after:bg-emerald-500 [&_.todo-agent-card[data-agent-state='answered']]:after:ring-1 [&_.todo-agent-card[data-agent-state='answered']]:after:ring-black/10
            [&_.todo-agent-card[data-agent-state='answered']]:after:content-['']
          `}
          data-placeholder="新任务"
          data-todo-editor="1"
          spellCheck={false}
        />

        {inlineGhost && inlineGhostPos ? (
          <div
            className="pointer-events-none absolute z-20 max-w-full whitespace-pre-wrap break-words text-[15px] leading-7 font-normal text-gray-400/90"
            style={{
              left: inlineGhostPos.left,
              top: inlineGhostPos.top,
              maxWidth: inlineGhostPos.maxW,
            }}
          >
            {inlineGhost}
          </div>
        ) : null}

        {orderListMenu ? (
          <div
            ref={orderListMenuRef}
            className="absolute z-50 rounded-lg border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-1 min-w-[140px]"
            style={{ top: orderListMenu.top, left: orderListMenu.left }}
          >
            <button
              type="button"
              className="w-full text-left px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyOrderedListFollow(false)}
            >
              跟随前面
            </button>
            <button
              type="button"
              className="w-full text-left px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyOrderedListFollow(true)}
            >
              重新开始
            </button>
          </div>
        ) : null}
        
        {/* Image Control Panel */}
        {selectedImage && imagePanelPos ? (
          <div 
            ref={controlPanelRef}
            className="absolute bg-white rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 p-1.5 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: imagePanelPos.top, left: imagePanelPos.left }}
          >
            <button
              onClick={() => {
                void copySelectedImage();
              }}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="复制"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button
              onClick={() => {
                void downloadSelectedImage();
              }}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="下载"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
            </button>
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
        ) : null}

        {imageToast && imagePanelPos ? (
          <div
            className="pointer-events-none absolute z-50 rounded-md bg-black/75 px-2 py-1 text-[12px] leading-none text-white shadow-sm"
            style={{ top: imagePanelPos.top + 44, left: imagePanelPos.left }}
          >
            {imageToast}
          </div>
        ) : null}
      </div>
      </div>

      {/* Bottom Controls */}

      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Bottom Left - AI Chat */}
        {onOpenChat && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat({ forceNewConversation: true });
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-stone-200/90 bg-white text-stone-500 transition-colors duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800"
            title={t.app.aiAssistant}
          >
            <Bot size={17} strokeWidth={1.5} aria-hidden />
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
      
      {/* Bottom right: DDL + created time (editing); DDL only when not editing */}
      {(todo.deadlineAt || isEditing) && (
        <div className="absolute right-8 bottom-6 flex flex-col items-end gap-0.5 text-[10px] font-mono tracking-tight">
          {todo.deadlineAt && (
            <span className="text-blue-600">{formatDeadlineShort(todo.deadlineAt)}</span>
          )}
          {isEditing && (
            <span className="text-gray-300">{formatFullDateTimeShort(todo.createdAt)}</span>
          )}
        </div>
      )}
    </div>
  );
};
