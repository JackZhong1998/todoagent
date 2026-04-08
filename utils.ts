
import { Conversation } from './types';

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
};

export const generateId = () => Math.random().toString(36).substring(2, 9);

/** Suggested filename for a skill imported from a URL (e.g. GitHub raw path segment). */
export const skillDocumentNameFromUrl = (urlStr: string): string => {
  try {
    const u = new URL(urlStr.trim());
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || 'skill.md';
    return decodeURIComponent(last).slice(0, 120) || 'skill.md';
  } catch {
    return 'skill.md';
  }
};

export const saveTodos = (todos: any[]) => {
  localStorage.setItem('swiss_todos', JSON.stringify(todos));
};

export const loadTodos = (): any[] => {
  const saved = localStorage.getItem('swiss_todos');
  return saved ? JSON.parse(saved) : [];
};

export const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem('swiss_conversations', JSON.stringify(conversations));
};

export const loadConversations = (): Conversation[] => {
  const saved = localStorage.getItem('swiss_conversations');
  return saved ? JSON.parse(saved) : [];
};

export const formatTime = (timestamp: number): string => {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const formatFullDateTimeShort = (timestamp: number): string => {
  const d = new Date(timestamp);
  const yy = String(d.getFullYear()).slice(-2);
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yy}/${MM}/${DD} ${hh}:${mm}:${ss}`;
};

export const formatDeadlineShort = (timestamp: number): string => {
  const d = new Date(timestamp);
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  return `${MM}/${DD} ${hh}:00`;
};

export const stripHtmlTags = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

/**
 * Todo 卡片编辑器以首个 h1 为标题区；innerText/stripHtmlTags 常把 h1 与紧跟的正文接成一行，
 * 对话栏等场景应优先使用 h1 的纯文本，避免标题与正文拼接。
 */
export const getTodoHeadingPlainText = (contentHtml: string, fallbackTitle: string): string => {
  const html = (contentHtml || '').trim();
  if (html) {
    const host = document.createElement('div');
    host.innerHTML = html;
    const h1 = host.querySelector('h1');
    const h1Text = (h1?.textContent || '').replace(/\s+/g, ' ').trim();
    if (h1Text) return h1Text;
  }
  const plain = stripHtmlTags(html).trim();
  const firstLine = plain
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  if (firstLine) return firstLine;
  return (fallbackTitle || '').trim();
};

export const SYSTEM_PROMPT = `你是一个专业的 To-Do 任务助手，专门帮助用户完成各种任务。

你的核心职责：
1. 理解用户的任务需求
2. 提供具体、可操作的建议和方案
3. 帮助用户分解复杂任务为可执行的小步骤
4. 提供专业的知识支持
5. 保持积极、鼓励的态度

回答要求：
- 回答要简洁明了，重点突出
- 提供具体的步骤和建议，而不是空泛的理论
- 如果有代码相关的需求，提供可运行的代码示例
- 鼓励用户采取行动
- 使用中文回复，除非用户使用其他语言

关于任务处理：
- 如果任务不明确，主动询问用户更多细节
- 帮助用户设定合理的优先级
- 提供时间管理建议
- 可以帮助用户进行头脑风暴

请记住，你的目标是帮助用户高效地完成任务！`;
