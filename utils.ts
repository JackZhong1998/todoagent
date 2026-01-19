
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
