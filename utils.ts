
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

export const saveTodos = (todos: any[]) => {
  localStorage.setItem('swiss_todos', JSON.stringify(todos));
};

export const loadTodos = (): any[] => {
  const saved = localStorage.getItem('swiss_todos');
  return saved ? JSON.parse(saved) : [];
};
