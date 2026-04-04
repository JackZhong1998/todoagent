

import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { X, MessageSquare, History, Plus, Send, Loader2, ChevronRight, Copy, Check, ImagePlus, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { WorkspaceDoc } from '../types';
import { Conversation, Message, Todo } from '../types';
import { translations } from '../i18n/locales';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaceSyncBump } from '../contexts/WorkspaceSyncContext';
import {
  generateId,
  skillDocumentNameFromUrl,
  stripHtmlTags,
  SYSTEM_PROMPT,
} from '../utils';
import {
  buildAgentToolsSystemPrompt,
  KIMI_AGENT_TOOLS,
  KIMI_AGENT_TOOLS_WITHOUT_WEB_SEARCH,
} from '../utils/kimiToolDefinitions';
import { runKimiWithTools, kimiUserMessageContent } from '../utils/kimiToolChat';
import {
  AgentQuotaExceededError,
  MOONSHOT_MODEL_DEFAULT,
  moonshotDirectApiKey,
  moonshotFetchCompletion,
  moonshotParseCompletionJson,
  moonshotProxyEnabled,
} from '../utils/moonshotClient';
import { createClerkSupabaseClient, isSupabaseConfigured } from '../utils/supabase/client';
import {
  loadProjectConversations,
  loadProjectDocs,
  notifyProjectDocsUpdated,
  saveProjectConversations,
  saveProjectDocs,
} from '../utils/projectStorage';

function isDefaultChatTitle(title: string): boolean {
  return (
    title === translations.en.chat.newGlobalTitle ||
    title === translations.zh.chat.newGlobalTitle ||
    title === translations.en.chat.newTodoTitle ||
    title === translations.zh.chat.newTodoTitle
  );
}

interface ChatPanelProps {
  projectId: string;
  isOpen: boolean;
  width: number;
  onClose: () => void;
  initialTodo?: Todo;
  launchPayload?: {
    nonce: number;
    text?: string;
    autoSend?: boolean;
    forceNewConversation?: boolean;
    conversationId?: string;
    focusConversationId?: string;
  } | null;
  onNewGlobalChat: () => void;
  onTodoAgentCardResolved?: (todoId: string, conversationId: string) => void;
  onTodoAgentCardStatusChange?: (
    todoId: string,
    conversationId: string,
    state: 'loading' | 'answered'
  ) => void;
  /** 服务端返回今日免费额度用尽时（打开付费引导） */
  onAgentQuotaExceeded?: () => void;
}

const KIMI_SYSTEM_PROMPT = "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。";

const MAX_SKILL_INJECT_CHARS = 80_000;
const MOONSHOT_MODEL = MOONSHOT_MODEL_DEFAULT;

const MAX_CHAT_ATTACH_IMAGES = 4;
const MAX_CHAT_IMAGE_FILE_BYTES = 5 * 1024 * 1024;

function formatWebSearchToolPayload(data: unknown, invokeError: { message: string } | null): string {
  if (invokeError) {
    return JSON.stringify({ ok: false, error: invokeError.message });
  }
  if (data == null || typeof data !== 'object') {
    return JSON.stringify({
      ok: false,
      error: 'agent-tools 返回为空或非对象',
    });
  }
  const p = data as { ok?: boolean; error?: string; results?: unknown };
  if (p.ok === false) {
    return JSON.stringify(p);
  }
  const results = Array.isArray(p.results) ? p.results : [];
  return JSON.stringify({
    ok: true,
    search_completed: true,
    items: results.length,
    results,
    reply_instruction:
      '这是真实检索结果。若 items>0：用中文归纳要点并列出标题与链接。若 items=0：说明未找到匹配网页。不要声称搜索功能故障。',
  });
}

function buildSkillInjectionBlock(projectId: string, skillDocIds: string[]): string {
  if (!skillDocIds.length) return '';
  const docs = loadProjectDocs(projectId);
  const skillDocs = skillDocIds
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is WorkspaceDoc => !!d);
  if (!skillDocs.length) return '';
  const text = skillDocs.map((s) => `### Skill: ${s.name}\n${s.body}`).join('\n\n---\n\n');
  const trimmed =
    text.length > MAX_SKILL_INJECT_CHARS
      ? `${text.slice(0, MAX_SKILL_INJECT_CHARS)}\n\n[Skill 内容已截断]`
      : text;
  return `\n\n## 本对话已挂载的 Skill（须遵守）\n${trimmed}`;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  projectId,
  isOpen,
  width,
  onClose,
  initialTodo,
  launchPayload,
  onNewGlobalChat,
  onTodoAgentCardResolved,
  onTodoAgentCardStatusChange,
  onAgentQuotaExceeded,
}) => {
  const { t, language } = useLanguage();
  const { isLoggedIn, getClerkToken } = useAuth();
  const bumpRemoteSync = useWorkspaceSyncBump();
  const ct = t.chat;
  const dateLocale = language === 'zh' ? 'zh-CN' : 'en-US';
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadProjectConversations(projectId)
  );
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [pendingImageDataUrls, setPendingImageDataUrls] = useState<string[]>([]);
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = inputTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const linePx = 22;
    const maxInner = linePx * 3;
    el.style.height = `${Math.min(el.scrollHeight, maxInner + 24)}px`;
  }, [inputText]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingConversationIds, setLoadingConversationIds] = useState<string[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastLaunchNonceRef = useRef<number | null>(null);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const autoSendDoneForNonceRef = useRef<number | null>(null);
  /** Tracks skill ids for the in-flight request (updates synchronously on import_skill). */
  const skillAttachRef = useRef<string[]>([]);
  const useMoonshotProxy = moonshotProxyEnabled();
  const directApiKey = moonshotDirectApiKey();

  const supabase = useMemo(() => {
    if (!isSupabaseConfigured() || !isLoggedIn) return null;
    return createClerkSupabaseClient(getClerkToken);
  }, [isLoggedIn, getClerkToken]);

  const canUseRemoteTools = !!supabase;

  const currentConversation = useMemo(() => {
    return currentConversationId 
      ? conversations.find(c => c.id === currentConversationId) 
      : null;
  }, [currentConversationId, conversations]);
  const isCurrentConversationLoading = !!currentConversationId && loadingConversationIds.includes(currentConversationId);

  const globalConversations = conversations.filter(c => !c.todoId);
  const todoConversations = conversations.filter(c => c.todoId);
  const getTodoInputText = (todo: Todo) => {
    const plainContent = stripHtmlTags(todo.content || '').trim();
    return plainContent || todo.title || '';
  };

  const buildTodoQuote = useCallback((todo: Todo, userLine?: string) => {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
    const titleRaw = (todo.title || t.app.noTitle).trim();
    const title = titleRaw;
    const u = userLine !== undefined ? norm(userLine) : '';
    const plain = stripHtmlTags(todo.content || '').trim();
    const lines = plain.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    const titleN = norm(titleRaw);
    const isTitleLine = (l: string) => {
      const ln = norm(l);
      return ln === titleN || ln.startsWith(titleN);
    };

    let bodyHint = lines.find((l) => l && !isTitleLine(l)) || '';
    if (!bodyHint && lines[0] && lines[0].startsWith(titleRaw) && lines[0].length > titleRaw.length) {
      bodyHint = lines[0].slice(titleRaw.length).trim();
    }

    let firstLine = bodyHint.slice(0, 120);
    const b = norm(bodyHint);
    if (u && b && (b === u || u.includes(b) || b.includes(u))) {
      firstLine = '';
    }

    return { title, firstLine };
  }, [t.app.noTitle]);

  const buildTodoContextPrompt = useCallback((todo: Todo) => {
    const plain = stripHtmlTags(todo.content || '').trim();
    const title = (todo.title || t.app.noTitle).trim();
    return [
      '',
      '---',
      'Todo Background:',
      `Title: ${title}`,
      'Body:',
      plain || '(empty)',
      '---',
      '',
      'Use the Todo background as context for this turn.',
    ].join('\n');
  }, [t.app.noTitle]);

  const createNewGlobalConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: generateId(),
      title: ct.newGlobalTitle,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setShowHistory(false);
    setInputText('');
  }, [ct.newGlobalTitle]);

  useEffect(() => {
    if (!isOpen) return;

    if (!initialTodo) {
      createNewGlobalConversation();
      return;
    }

    const lp = launchPayload ?? undefined;
    const convs = conversationsRef.current;

    if (lp?.focusConversationId) {
      if (convs.some((c) => c.id === lp.focusConversationId)) {
        setCurrentConversationId(lp.focusConversationId);
        setInputText('');
      }
      lastLaunchNonceRef.current = lp.nonce;
      return;
    }

    const shouldForceNew =
      Boolean(lp?.forceNewConversation) && lp.nonce !== lastLaunchNonceRef.current;

    if (shouldForceNew) {
      const newId = lp?.conversationId || generateId();
      setConversations((prev) => {
        if (prev.some((c) => c.id === newId)) return prev;
        const newConversation: Conversation = {
          id: newId,
          title: initialTodo.title || ct.newTodoTitle,
          messages: [],
          todoId: initialTodo.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return [newConversation, ...prev];
      });
      setCurrentConversationId(newId);
      setInputText(lp?.autoSend ? '' : typeof lp?.text === 'string' ? lp.text : '');
      lastLaunchNonceRef.current = lp.nonce;
      return;
    }

    const forTodo = convs
      .filter((c) => c.todoId === initialTodo.id)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    if (forTodo[0]) {
      setCurrentConversationId(forTodo[0].id);
      setInputText(lp?.text ?? getTodoInputText(initialTodo));
    } else {
      const newId = generateId();
      const newConversation: Conversation = {
        id: newId,
        title: initialTodo.title || ct.newTodoTitle,
        messages: [],
        todoId: initialTodo.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newId);
      setInputText(lp?.text ?? getTodoInputText(initialTodo));
    }
    if (lp?.nonce) lastLaunchNonceRef.current = lp.nonce;
  }, [isOpen, initialTodo?.id, launchPayload, createNewGlobalConversation]);

  useEffect(() => {
    saveProjectConversations(projectId, conversations);
    bumpRemoteSync();
  }, [conversations, projectId, bumpRemoteSync]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation, isCurrentConversationLoading]);

  const addMessageToConversation = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        const updatedMessages = [...c.messages, message];
        let newTitle = c.title;
        if (isDefaultChatTitle(c.title)) {
          const firstUserMessage = updatedMessages.find(m => m.role === 'user');
          if (firstUserMessage) {
            newTitle = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
          }
        }
        return {
          ...c,
          messages: updatedMessages,
          title: newTitle,
          updatedAt: Date.now()
        };
      }
      return c;
    }));
  };

  const buildSystemPrompt = useCallback(
    (includeToolInstructions: boolean, skillDocIds: string[], webSearch: boolean) => {
      let s = `${KIMI_SYSTEM_PROMPT}\n\n${SYSTEM_PROMPT}`;
      if (includeToolInstructions) s += `\n\n${buildAgentToolsSystemPrompt({ webSearch })}`;
      s += buildSkillInjectionBlock(projectId, skillDocIds);
      return s;
    },
    [projectId]
  );

  const callKimiAPIPlain = async (
    messages: Message[],
    skillDocIds: string[],
    dedupeKey: string
  ): Promise<string> => {
    const apiMessages = [
      { role: 'system' as const, content: buildSystemPrompt(false, skillDocIds, false) },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.role === 'user' ? kimiUserMessageContent(m) : m.content,
      })),
    ];

    const moonshotBody = {
      model: MOONSHOT_MODEL,
      messages: apiMessages,
      temperature: 1,
    };

    if (useMoonshotProxy) {
      const res = await moonshotFetchCompletion(getClerkToken, {
        billingKind: 'agent',
        dedupeKey,
        body: moonshotBody,
      });
      const data = await moonshotParseCompletionJson(res);
      return String(data.choices?.[0]?.message?.content ?? '');
    }

    if (!directApiKey) {
      throw new Error(ct.missingApiKey);
    }

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${directApiKey}`,
      },
      body: JSON.stringify(moonshotBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `${ct.apiFailedPrefix}${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handlePickChatImages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const fileList = Array.from(files);
    e.target.value = '';

    void (async () => {
      const readFile = (file: File) =>
        new Promise<string>((resolve, reject) => {
          if (!file.type.startsWith('image/')) {
            resolve('');
            return;
          }
          if (file.size > MAX_CHAT_IMAGE_FILE_BYTES) {
            resolve('');
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

      const additions: string[] = [];
      for (const file of fileList) {
        if (additions.length >= MAX_CHAT_ATTACH_IMAGES) break;
        try {
          const dataUrl = await readFile(file);
          if (dataUrl) additions.push(dataUrl);
        } catch {
          /* skip broken read */
        }
      }
      if (!additions.length) return;
      setPendingImageDataUrls((prev) => {
        const room = MAX_CHAT_ATTACH_IMAGES - prev.length;
        if (room <= 0) return prev;
        return [...prev, ...additions.slice(0, room)];
      });
    })();
  }, []);

  const handleSendMessage = async (textOverride?: string) => {
    const rawText = (textOverride ?? inputText).trim();
    const imageUrls = [...pendingImageDataUrls];
    if (
      (!rawText && !imageUrls.length) ||
      !currentConversationId ||
      loadingConversationIds.includes(currentConversationId)
    )
      return;
    const convBefore = conversations.find((c) => c.id === currentConversationId);
    const todoContext = initialTodo && convBefore?.todoId === initialTodo.id ? initialTodo : undefined;
    let todoQuote = todoContext ? buildTodoQuote(todoContext, rawText) : undefined;
    if (todoQuote) {
      const t = todoQuote.title.trim();
      const f = todoQuote.firstLine.trim();
      const r = rawText.trim();
      if ((!f && r === t) || (f && r === f)) {
        todoQuote = undefined;
      }
    }
    const userLine = rawText || (imageUrls.length ? ct.userBubbleImageLabel : '');
    const apiContent = todoContext ? `${userLine}\n${buildTodoContextPrompt(todoContext)}` : userLine;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: userLine,
      apiContent,
      imageDataUrls: imageUrls.length ? imageUrls : undefined,
      todoQuote,
      timestamp: Date.now()
    };

    const convId = currentConversationId;
    const agentDedupeKey = `${convId}:${userMessage.id}`;
    skillAttachRef.current = [...(convBefore?.attachedSkillDocIds ?? [])];
    const todoIdForCard = convBefore?.todoId || initialTodo?.id;

    addMessageToConversation(convId, userMessage);
    setInputText('');
    setPendingImageDataUrls([]);
    setLoadingConversationIds((prev) => (prev.includes(convId) ? prev : [...prev, convId]));
    if (todoIdForCard && onTodoAgentCardStatusChange) {
      onTodoAgentCardStatusChange(todoIdForCard, convId, 'loading');
    }

    const finishAgentCard = () => {
      if (todoIdForCard && onTodoAgentCardStatusChange) {
        onTodoAgentCardStatusChange(todoIdForCard, convId, 'answered');
      }
      if (todoIdForCard && onTodoAgentCardResolved) {
        onTodoAgentCardResolved(todoIdForCard, convId);
      }
    };

    try {
      if (useMoonshotProxy) {
        const tok = await getClerkToken();
        if (!tok) {
          const err: Message = {
            id: generateId(),
            role: 'assistant',
            content: ct.proxyAuthRequired,
            timestamp: Date.now(),
          };
          addMessageToConversation(convId, err);
          return;
        }
      } else if (!directApiKey) {
        const err: Message = {
          id: generateId(),
          role: 'assistant',
          content: ct.missingApiKey,
          timestamp: Date.now(),
        };
        addMessageToConversation(convId, err);
        return;
      }

      const messagesForApi = [...(convBefore?.messages ?? []), userMessage];
      const messagesForModel = messagesForApi;

      let response: string;

      if (canUseRemoteTools && supabase) {
        const client = supabase;
        const allowWebSearch = webSearchEnabled;
        const executeTool = async (name: string, argsJson: string): Promise<string> => {
          let args: Record<string, unknown>;
          try {
            args = JSON.parse(argsJson || '{}') as Record<string, unknown>;
          } catch {
            return JSON.stringify({ error: 'Invalid JSON arguments' });
          }

          if (name === 'web_search') {
            const query = String(args.query ?? '');
            const { data, error } = await client.functions.invoke('agent-tools', {
              body: { action: 'web_search', query },
            });
            return formatWebSearchToolPayload(data, error);
          }

          if (name === 'fetch_url') {
            const url = String(args.url ?? '');
            const { data, error } = await client.functions.invoke('agent-tools', {
              body: { action: 'fetch_url', url },
            });
            if (error) return JSON.stringify({ error: error.message });
            const payload = data as { ok?: boolean; error?: string; markdown?: string };
            if (payload && payload.ok === false) return JSON.stringify(payload);
            return JSON.stringify(data);
          }

          if (name === 'import_skill_from_url') {
            const url = String(args.url ?? '');
            const { data, error } = await client.functions.invoke('agent-tools', {
              body: { action: 'fetch_url', url },
            });
            if (error) return JSON.stringify({ error: error.message });
            const payload = data as { ok?: boolean; error?: string; markdown?: string };
            if (payload && payload.ok === false) return JSON.stringify(payload);
            const body = String(payload.markdown ?? '');
            if (!body.trim()) return JSON.stringify({ error: 'Empty document body' });

            const doc: WorkspaceDoc = {
              id: generateId(),
              name: skillDocumentNameFromUrl(url),
              kind: 'markdown',
              body,
              createdAt: Date.now(),
              sourceUrl: url,
              isSkill: true,
            };
            const existing = loadProjectDocs(projectId);
            saveProjectDocs(projectId, [doc, ...existing]);
            notifyProjectDocsUpdated(projectId);
            bumpRemoteSync();

            skillAttachRef.current = [...skillAttachRef.current, doc.id];
            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== convId) return c;
                const nextIds = [...(c.attachedSkillDocIds ?? []), doc.id];
                return { ...c, attachedSkillDocIds: nextIds, updatedAt: Date.now() };
              })
            );

            return JSON.stringify({
              ok: true,
              docId: doc.id,
              name: doc.name,
              message: 'Skill 已保存到项目文档，并已挂载到本对话。',
            });
          }

          return JSON.stringify({ error: `Unknown tool: ${name}` });
        };

        response = await runKimiWithTools({
          ...(useMoonshotProxy
            ? {
                moonshotCompletions: (moonshotBody: Record<string, unknown>) =>
                  moonshotFetchCompletion(getClerkToken, {
                    billingKind: 'agent',
                    dedupeKey: agentDedupeKey,
                    body: moonshotBody,
                  }),
              }
            : { apiKey: directApiKey }),
          model: MOONSHOT_MODEL,
          getSystemContent: () => buildSystemPrompt(true, skillAttachRef.current, allowWebSearch),
          history: messagesForModel,
          tools: allowWebSearch ? [...KIMI_AGENT_TOOLS] : [...KIMI_AGENT_TOOLS_WITHOUT_WEB_SEARCH],
          executeTool,
        });
      } else {
        response = await callKimiAPIPlain(messagesForModel, skillAttachRef.current, agentDedupeKey);
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      addMessageToConversation(convId, assistantMessage);
    } catch (error) {
      console.error('Error getting response:', error);
      if (error instanceof AgentQuotaExceededError) {
        onAgentQuotaExceeded?.();
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: ct.quotaExceededInChat,
          timestamp: Date.now(),
        };
        addMessageToConversation(convId, errorMessage);
      } else {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `${ct.errorPrefix}${error instanceof Error ? error.message : ct.errorUnknown}`,
          timestamp: Date.now(),
        };
        addMessageToConversation(convId, errorMessage);
      }
    } finally {
      setLoadingConversationIds((prev) => prev.filter((id) => id !== convId));
      finishAgentCard();
    }
  };

  useEffect(() => {
    if (!isOpen || !launchPayload?.autoSend || !launchPayload.text) return;
    if (launchPayload.focusConversationId) return;
    if (!launchPayload.conversationId || !launchPayload.forceNewConversation) return;
    if (autoSendDoneForNonceRef.current === launchPayload.nonce) return;
    if (currentConversationId !== launchPayload.conversationId) return;
    if (loadingConversationIds.includes(launchPayload.conversationId)) return;
    autoSendDoneForNonceRef.current = launchPayload.nonce;
    void handleSendMessage(launchPayload.text);
  }, [isOpen, launchPayload, currentConversationId, loadingConversationIds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyAssistantMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId((prev) => (prev === messageId ? null : prev));
      }, 1600);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="h-screen bg-white flex flex-col transition-all duration-300 ease-out"
      style={{ width: isOpen ? width : 0, overflow: isOpen ? 'visible' : 'hidden' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-800">
            {currentConversation?.title || t.app.aiAssistant}
          </h2>
          <p className="text-xs text-gray-400">
            {initialTodo ? ct.scopeTodo : ct.scopeGlobal}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {!initialTodo && (
            <button
              onClick={createNewGlobalConversation}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={ct.newChatTooltip}
            >
              <Plus size={18} />
            </button>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${
              showHistory ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={ct.historyTooltip}
          >
            <History size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={ct.closeTooltip}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {showHistory && (
          <div className="absolute inset-0 bg-white z-20 border-b border-gray-100">
            <div className="p-4 h-full overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {initialTodo ? ct.historySectionTodo : ct.historySectionGlobal}
              </h3>
              <div className="space-y-1">
                {(initialTodo ? todoConversations.filter(c => c.todoId === initialTodo.id) : globalConversations).map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setCurrentConversationId(conv.id);
                      setShowHistory(false);
                      setInputText('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm flex items-center justify-between ${
                      currentConversationId === conv.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{conv.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(conv.updatedAt).toLocaleDateString(dateLocale)}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
              
              {!initialTodo && (
                <>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3">
                    {ct.historySectionTodo}
                  </h3>
                  <div className="space-y-1">
                    {todoConversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setCurrentConversationId(conv.id);
                          setShowHistory(false);
                          setInputText('');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm flex items-center justify-between ${
                          currentConversationId === conv.id
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{conv.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(conv.updatedAt).toLocaleDateString(dateLocale)}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="h-full overflow-y-auto p-4 space-y-4">
          {currentConversation?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-gray-300" />
              </div>
              <h3 className="text-gray-700 font-semibold mb-2">{ct.emptyHeading}</h3>
              <p className="text-gray-400 text-sm">{ct.emptyHint}</p>
            </div>
          ) : (
            currentConversation?.messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[90%] min-w-0 overflow-hidden px-4 py-3 rounded-2xl text-sm
                  ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-tr-md'
                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                  }
                `}>
                  {message.role === 'assistant' ? (
                    <div className="space-y-3">
                      <div className="min-w-0 overflow-hidden text-[14px] leading-7 text-gray-800 break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="mt-2 mb-3 text-[19px] font-bold leading-8 text-gray-900">{children}</h1>,
                            h2: ({ children }) => <h2 className="mt-2 mb-2 text-[17px] font-semibold leading-7 text-gray-900">{children}</h2>,
                            h3: ({ children }) => <h3 className="mt-2 mb-2 text-[15px] font-semibold leading-7 text-gray-900">{children}</h3>,
                            p: ({ children }) => <p className="my-2 leading-7 text-gray-800 break-words">{children}</p>,
                            ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-gray-500">{children}</ul>,
                            ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-gray-500">{children}</ol>,
                            li: ({ children }) => <li className="leading-7">{children}</li>,
                            blockquote: ({ children }) => (
                              <blockquote className="my-3 border-l-4 border-gray-300 pl-3 text-gray-700">{children}</blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="my-3 w-full overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full border-collapse text-left text-[13px] leading-6">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                            th: ({ children }) => <th className="border-b border-gray-200 px-3 py-2 font-semibold text-gray-800">{children}</th>,
                            td: ({ children }) => <td className="border-b border-gray-100 px-3 py-2 align-top text-gray-700">{children}</td>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline decoration-blue-300 underline-offset-2">
                                {children}
                              </a>
                            ),
                            code: ({ className, children }) => {
                              const text = String(children ?? '').replace(/\n$/, '');
                              const isBlock = Boolean(className?.includes('language-'));
                              if (isBlock) {
                                return (
                                  <code className="block whitespace-pre text-[12px] leading-6 text-gray-100">
                                    {text}
                                  </code>
                                );
                              }
                              return (
                                <code className="rounded bg-gray-200 px-1.5 py-0.5 text-[12px] text-gray-800">
                                  {text}
                                </code>
                              );
                            },
                            pre: ({ children }) => (
                              <pre className="my-3 w-full overflow-x-auto rounded-lg bg-gray-900 p-3">
                                {children}
                              </pre>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            void handleCopyAssistantMessage(message.id, message.content);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                          title={copiedMessageId === message.id ? '已复制' : '复制全部内容'}
                        >
                          {copiedMessageId === message.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedMessageId === message.id ? '已复制' : '复制'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {message.imageDataUrls?.length ? (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {message.imageDataUrls.map((src, idx) => (
                            <img
                              key={idx}
                              src={src}
                              alt=""
                              className="max-h-28 max-w-[140px] rounded-lg object-cover border border-white/35"
                            />
                          ))}
                        </div>
                      ) : null}
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      {message.todoQuote ? (
                        <div className="mt-2 border-l-2 border-white/60 pl-2 text-[11px] leading-snug text-white/90">
                          <div className="font-semibold truncate">{message.todoQuote.title}</div>
                          {message.todoQuote.firstLine ? (
                            <div className="truncate opacity-90">{message.todoQuote.firstLine}</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isCurrentConversationLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-md">
                <Loader2 size={16} className="animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
        {pendingImageDataUrls.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingImageDataUrls.map((src, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={src}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-white opacity-90 shadow hover:bg-black"
                  aria-label="Remove"
                  onClick={() =>
                    setPendingImageDataUrls((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2">
          <textarea
            ref={inputTextareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ct.inputPlaceholder}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm leading-[22px] focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none overflow-y-auto min-h-[46px] max-h-[90px]"
            rows={1}
          />
          <button
            onClick={() => {
              void handleSendMessage();
            }}
            disabled={
              (!inputText.trim() && !pendingImageDataUrls.length) || isCurrentConversationLoading
            }
            className={`
              px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center
              ${(inputText.trim() || pendingImageDataUrls.length) && !isCurrentConversationLoading
                ? 'bg-black text-white hover:bg-zinc-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isCurrentConversationLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <input
            ref={chatImageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePickChatImages}
          />
          <button
            type="button"
            className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100 ${
              pendingImageDataUrls.length >= MAX_CHAT_ATTACH_IMAGES ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            disabled={pendingImageDataUrls.length >= MAX_CHAT_ATTACH_IMAGES}
            title={ct.attachImageTooltip}
            aria-label={ct.attachImageTooltip}
            onClick={() => chatImageInputRef.current?.click()}
          >
            <ImagePlus size={18} />
          </button>
          <button
            type="button"
            disabled={!canUseRemoteTools}
            className={`p-2 rounded-lg transition-colors ${
              !canUseRemoteTools
                ? 'cursor-not-allowed text-gray-200'
                : webSearchEnabled
                  ? 'text-black bg-gray-100'
                  : 'text-gray-300 hover:bg-gray-50 hover:text-gray-500'
            }`}
            title={
              !canUseRemoteTools
                ? ct.agentToolsHint
                : webSearchEnabled
                  ? ct.webSearchOn
                  : ct.webSearchOff
            }
            aria-pressed={canUseRemoteTools ? webSearchEnabled : undefined}
            aria-label={
              !canUseRemoteTools ? ct.agentToolsHint : webSearchEnabled ? ct.webSearchOn : ct.webSearchOff
            }
            onClick={() => {
              if (canUseRemoteTools) setWebSearchEnabled((v) => !v);
            }}
          >
            <Search size={18} strokeWidth={webSearchEnabled && canUseRemoteTools ? 2.25 : 1.65} />
          </button>
        </div>
        {!canUseRemoteTools ? (
          <p className="text-[11px] text-amber-800/90 mt-2 leading-snug">{ct.agentToolsHint}</p>
        ) : null}
      </div>
    </div>
  );
};

