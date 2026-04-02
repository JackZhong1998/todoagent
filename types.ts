
export enum Priority {
  P0 = 'P0', // Critical
  P1 = 'P1', // High
  P2 = 'P2', // Normal
}

export interface Todo {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  createdAt: number;
  deadlineAt?: number | null;
  isRunning: boolean;
  startTime: number | null;
  totalTime: number;
  isCompleted: boolean;
}

export type FilterType = 'ALL' | Priority;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  todoId?: string;
  /** Skill docs (WorkspaceDoc.id) whose full body is injected into this chat's system prompt. */
  attachedSkillDocIds?: string[];
  createdAt: number;
  updatedAt: number;
}

export type WorkspaceDocKind = 'markdown' | 'text' | 'html';

export interface WorkspaceDoc {
  id: string;
  name: string;
  kind: WorkspaceDocKind;
  body: string;
  createdAt: number;
  /** When set, document was imported from this URL (e.g. GitHub raw). */
  sourceUrl?: string;
  /** Skill instructions: shown in docs list and injectable into chat. */
  isSkill?: boolean;
}
