

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, MessageSquare, History, Plus, Send, Loader2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Conversation, Message, Todo } from '../types';
import { translations } from '../i18n/locales';
import { useLanguage } from '../contexts/LanguageContext';
import { generateId, stripHtmlTags, SYSTEM_PROMPT } from '../utils';
import { loadProjectConversations, saveProjectConversations } from '../utils/projectStorage';

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

export const ChatPanel: React.FC<ChatPanelProps> = ({
  projectId,
  isOpen,
  width,
  onClose,
  initialTodo,
  onNewGlobalChat,
}) => {
  const { t, language } = useLanguage();
  const ct = t.chat;
  const dateLocale = language === 'zh' ? 'zh-CN' : 'en-US';
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadProjectConversations(projectId)
  );
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKey = import.meta.env.VITE_MOONSHOT_API_KEY || '';

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
  }, [conversations, projectId]);

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

  const callKimiAPI = async (messages: Message[]): Promise<string> => {
    if (!apiKey) {
      throw new Error(ct.missingApiKey);
    }

    const apiMessages = [
      { role: 'system', content: KIMI_SYSTEM_PROMPT + '\n\n' + SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'kimi-k2.5',
        messages: apiMessages,
        temperature: 1
      })
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

    addMessageToConversation(currentConversationId, userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      const conv = conversations.find(c => c.id === currentConversationId);
      const allMessages = [...(conv?.messages || []), userMessage];
      const response = await callKimiAPI(allMessages);
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      
      addMessageToConversation(currentConversationId, assistantMessage);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `${ct.errorPrefix}${error instanceof Error ? error.message : ct.errorUnknown}`,
        timestamp: Date.now()
      };
      addMessageToConversation(currentConversationId, errorMessage);
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
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ct.inputPlaceholder}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none max-h-32"
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
      </div>
    </div>
  );
};

