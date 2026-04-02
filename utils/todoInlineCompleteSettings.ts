const STORAGE_KEY = 'todoagent_todo_inline_ai';

export const TODO_INLINE_AI_EVENT = 'todoagent-todo-inline-ai';

export function getTodoInlineAiEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === null) return true;
  return v === '1';
}

export function setTodoInlineAiEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  window.dispatchEvent(new Event(TODO_INLINE_AI_EVENT));
}
