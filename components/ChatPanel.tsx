

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, MessageSquare, History, Plus, Send, Bot, User, Loader2, ChevronRight } from 'lucide-react';
import { Conversation, Message, Todo } from '../types';
import { generateId, loadConversations, saveConversations, stripHtmlTags, SYSTEM_PROMPT } from '../utils';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTodo?: Todo;
  onNewGlobalChat: () => void;
}

const KIMI_SYSTEM_PROMPT = "你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。";

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  initialTodo, 
  onNewGlobalChat 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const envApiKey = (import.meta as any).env?.VITE_MOONSHOT_API_KEY || '';
  const [apiKey, setApiKey] = useState(() => {
    if (envApiKey) return envApiKey;
    return localStorage.getItem('moonshot_api_key') || '';
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(!envApiKey && !localStorage.getItem('moonshot_api_key'));

  const currentConversation = useMemo(() => {
    return currentConversationId 
      ? conversations.find(c => c.id === currentConversationId) 
      : null;
  }, [currentConversationId, conversations]);

  const globalConversations = conversations.filter(c => !c.todoId);
  const todoConversations = conversations.filter(c => c.todoId);

  useEffect(() => {
    if (isOpen) {
      if (initialTodo) {
        const existingTodoConversation = conversations.find(c => c.todoId === initialTodo.id);
        if (existingTodoConversation) {
          setCurrentConversationId(existingTodoConversation.id);
          setInputText('');
        } else {
          const newConversation: Conversation = {
            id: generateId(),
            title: initialTodo.title || '新任务对话',
            messages: [],
            todoId: initialTodo.id,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          const updatedConversations = [newConversation, ...conversations];
          setConversations(updatedConversations);
          saveConversations(updatedConversations);
          setCurrentConversationId(newConversation.id);
          
          const plainContent = stripHtmlTags(initialTodo.content);
          setInputText(`请帮我完成这个任务：\n\n标题：${initialTodo.title || '无标题'}\n\n内容：${plainContent || '暂无内容'}`);
        }
      } else {
        createNewGlobalConversation();
      }
    }
  }, [isOpen, initialTodo?.id]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation, isLoading]);

  const createNewGlobalConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    setCurrentConversationId(newConversation.id);
    setShowHistory(false);
    setInputText('');
  };

  const addMessageToConversation = (conversationId: string, message: Message) => {
    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        const updatedMessages = [...c.messages, message];
        let newTitle = c.title;
        if (c.title === '新对话' || c.title === '新任务对话') {
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
      throw new Error('请先设置 Moonshot API Key');
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
      throw new Error(errorData.error?.message || `API 调用失败: ${response.status}`);
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
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
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

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('moonshot_api_key', apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`h-screen bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-out ${isOpen ? 'w-[420px]' : 'w-0 overflow-hidden'}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">
              {currentConversation?.title || 'AI 助手'}
            </h2>
            <p className="text-xs text-gray-400">
              {initialTodo ? '任务专属对话' : '全局对话'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!initialTodo && (
            <button
              onClick={createNewGlobalConversation}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="新建对话"
            >
              <Plus size={18} />
            </button>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${
              showHistory ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="历史记录"
          >
            <History size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="关闭"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showApiKeyInput && (
        <div className="p-4 border-b border-gray-100 bg-yellow-50 flex-shrink-0">
          <div className="text-xs text-yellow-700 mb-2 font-medium">请输入 Moonshot API Key</div>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 bg-white border border-yellow-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveApiKey()}
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {showHistory && (
          <div className="absolute inset-0 bg-white z-20 border-b border-gray-100">
            <div className="p-4 h-full overflow-y-auto">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {initialTodo ? '任务对话' : '全局对话'}
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
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
              
              {!initialTodo && (
                <>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3">
                    任务对话
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
                            {new Date(conv.updatedAt).toLocaleDateString()}
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
              <h3 className="text-gray-700 font-semibold mb-2">开始对话</h3>
              <p className="text-gray-400 text-sm">
                有什么任务需要帮助吗？随时告诉我！
              </p>
            </div>
          ) : (
            currentConversation?.messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                  ${message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-black text-white'
                  }
                `}>
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`
                  max-w-[280px] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-tr-md'
                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                  }
                `}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center">
                <Bot size={16} />
              </div>
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
            placeholder="输入你的问题..."
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

