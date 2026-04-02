

import React, { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { X, MessageSquare, History, Plus, Send, Loader2, ChevronRight } from 'lucide-react';
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
import { AGENT_TOOLS_SYSTEM_PROMPT, KIMI_AGENT_TOOLS } from '../utils/kimiToolDefinitions';
import { runKimiWithTools } from '../utils/kimiToolChat';
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
  onNewGlobalChat: () => void;
}

const KIMI_SYSTEM_PROMPT = "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。";

const MAX_SKILL_INJECT_CHARS = 80_000;
const MOONSHOT_MODEL = import.meta.env.VITE_MOONSHOT_MODEL || 'kimi-k2.5';

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
  onNewGlobalChat,
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
  const inputTextareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = inputTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const linePx = 22;
    const maxInner = linePx * 3;
    el.style.height = `${Math.min(el.scrollHeight, maxInner + 24)}px`;
  }, [inputText]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /** Tracks skill ids for the in-flight request (updates synchronously on import_skill). */
  const skillAttachRef = useRef<string[]>([]);
  const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY || '';

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

  const globalConversations = conversations.filter(c => !c.todoId);
  const todoConversations = conversations.filter(c => c.todoId);
  const getTodoInputText = (todo: Todo) => {
    const plainContent = stripHtmlTags(todo.content || '').trim();
    return plainContent || todo.title || '';
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTodo) {
        const existingTodoConversation = conversations.find(c => c.todoId === initialTodo.id);
        if (existingTodoConversation) {
          setCurrentConversationId(existingTodoConversation.id);
          setInputText(getTodoInputText(initialTodo));
        } else {
          const newConversation: Conversation = {
            id: generateId(),
            title: initialTodo.title || ct.newTodoTitle,
            messages: [],
            todoId: initialTodo.id,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          const updatedConversations = [newConversation, ...conversations];
          setConversations(updatedConversations);
          setCurrentConversationId(newConversation.id);
          
          setInputText(getTodoInputText(initialTodo));
        }
      } else {
        createNewGlobalConversation();
      }
    }
  }, [isOpen, initialTodo?.id]);

  useEffect(() => {
    saveProjectConversations(projectId, conversations);
    bumpRemoteSync();
  }, [conversations, projectId, bumpRemoteSync]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation, isLoading]);

  const createNewGlobalConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: ct.newGlobalTitle,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversationId(newConversation.id);
    setShowHistory(false);
    setInputText('');
  };

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
    (includeToolInstructions: boolean, skillDocIds: string[]) => {
      let s = `${KIMI_SYSTEM_PROMPT}\n\n${SYSTEM_PROMPT}`;
      if (includeToolInstructions) s += `\n\n${AGENT_TOOLS_SYSTEM_PROMPT}`;
      s += buildSkillInjectionBlock(projectId, skillDocIds);
      return s;
    },
    [projectId]
  );

  const callKimiAPIPlain = async (messages: Message[], skillDocIds: string[]): Promise<string> => {
    if (!apiKey) {
      throw new Error(ct.missingApiKey);
    }

    const apiMessages = [
      { role: 'system' as const, content: buildSystemPrompt(false, skillDocIds) },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MOONSHOT_MODEL,
        messages: apiMessages,
        temperature: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `${ct.apiFailedPrefix}${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentConversationId || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    const convId = currentConversationId;
    const convBefore = conversations.find((c) => c.id === convId);
    skillAttachRef.current = [...(convBefore?.attachedSkillDocIds ?? [])];

    addMessageToConversation(convId, userMessage);
    setInputText('');
    setIsLoading(true);

    if (!apiKey) {
      setIsLoading(false);
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

    try {
      let response: string;

      if (canUseRemoteTools && supabase) {
        const client = supabase;
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
          apiKey,
          model: MOONSHOT_MODEL,
          getSystemContent: () => buildSystemPrompt(true, skillAttachRef.current),
          history: messagesForApi,
          tools: [...KIMI_AGENT_TOOLS],
          executeTool,
        });
      } else {
        response = await callKimiAPIPlain(messagesForApi, skillAttachRef.current);
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
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `${ct.errorPrefix}${error instanceof Error ? error.message : ct.errorUnknown}`,
        timestamp: Date.now()
      };
      addMessageToConversation(convId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                  max-w-[86%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-tr-md'
                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                  }
                `}>
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-headings:my-2 prose-headings:font-semibold prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:text-[12px] prose-pre:my-2 prose-pre:bg-gray-900 prose-pre:text-gray-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
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
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className={`
              px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center
              ${inputText.trim() && !isLoading
                ? 'bg-black text-white hover:bg-zinc-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        {!canUseRemoteTools ? (
          <p className="text-[11px] text-amber-800/90 mt-2 leading-snug">{ct.agentToolsHint}</p>
        ) : null}
      </div>
    </div>
  );
};

