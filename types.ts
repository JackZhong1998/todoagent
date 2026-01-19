
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
