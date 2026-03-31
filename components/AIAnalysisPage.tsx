import React, { useMemo } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Todo } from '../types';

export type Replaceability = '可替代' | '不可替代' | '不清楚';

export interface AnalysisResultItem {
  todoId: string;
  title: string;
  taskType: string;
  replaceability: Replaceability;
  process: string;
  reason: string;
}

interface AIAnalysisPageProps {
  todos: Todo[];
  analysisByTodoId: Record<string, AnalysisResultItem>;
  analysisLoadingByTodoId: Record<string, boolean>;
  onBack: () => void;
}
export const AIAnalysisPage: React.FC<AIAnalysisPageProps> = ({
  todos,
  analysisByTodoId,
  analysisLoadingByTodoId,
  onBack,
}) => {
  const completedTodos = useMemo(
    () => todos.filter(todo => todo.isCompleted).sort((a, b) => b.createdAt - a.createdAt),
    [todos]
  );
  const availableResults = useMemo(
    () => completedTodos.map(todo => analysisByTodoId[todo.id]).filter(Boolean),
    [completedTodos, analysisByTodoId]
  );

  const total = availableResults.length;
  const replaceableCount = availableResults.filter(r => r.replaceability === '可替代').length;
  const nonReplaceableCount = availableResults.filter(r => r.replaceability === '不可替代').length;
  const unclearCount = availableResults.filter(r => r.replaceability === '不清楚').length;

  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '0%');

  const handleAnalyze = async () => {
    if (!completedTodos.length) {
      setError('当前没有已完成任务，无法分析。');
      return;
    }
    if (!apiKey) {
      setError('请先在 .env 中设置 VITE_MOONSHOT_API_KEY。');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const taskPayload = completedTodos.map(todo => ({
        todoId: todo.id,
        title: todo.title || '无标题',
        content: stripHtmlTags(todo.content || ''),
        priority: todo.priority,
        totalTimeSeconds: todo.totalTime,
      }));

      const prompt = `请分析下面每一个已完成任务，判断它未来是否可由 AI 替代执行。

返回格式必须是严格 JSON 数组，不要输出任何额外文字。每个元素字段：
- todoId: string
- title: string
- taskType: string（任务类型）
- replaceability: string（只能是"可替代"、"不可替代"、"不清楚"）
- process: string（分析过程，1-3句）
- reason: string（结论原因，1-2句）

任务列表：
${JSON.stringify(taskPayload, null, 2)}`;

      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'kimi-k2.5',
          temperature: 0.2,
          messages: [
            { role: 'system', content: KIMI_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `AI 分析失败：${response.status}`);
      }

      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content || '';
      const parsed = safeJsonParse(raw);
      if (!parsed) {
        throw new Error('AI 返回格式不是有效 JSON。');
      }
      setResults(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析失败，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          返回 To-Do List
        </button>
        <div className="text-xs text-gray-400">任务在完成时会自动触发 AI 分析</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">已完成任务</div>
          <div className="mt-2 text-3xl font-bold text-black">{completedTodos.length}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">可替代</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{replaceableCount}</div>
          <div className="text-xs text-gray-400 mt-1">{pct(replaceableCount)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">不可替代</div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{nonReplaceableCount}</div>
          <div className="text-xs text-gray-400 mt-1">{pct(nonReplaceableCount)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">不清楚</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{unclearCount}</div>
          <div className="text-xs text-gray-400 mt-1">{pct(unclearCount)}</div>
        </div>
      </div>

      <div className="space-y-4">
        {completedTodos.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-gray-100 rounded-[32px] text-sm text-gray-400">
            当前没有已完成任务，暂时没有可展示的分析卡片。
          </div>
        ) : (
          completedTodos.map(todo => {
            const item = analysisByTodoId[todo.id];
            const isLoading = !!analysisLoadingByTodoId[todo.id];
            return (
            <div key={todo.id} className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{todo.title || '无标题任务'}</h3>
                  <p className="text-xs text-gray-500 mt-1">任务类型：{item?.taskType || '分析中/未分析'}</p>
                </div>
                {isLoading ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    <Loader2 size={12} className="animate-spin" />
                    分析中
                  </span>
                ) : item ? (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.replaceability === '可替代'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.replaceability === '不可替代'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.replaceability}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    暂无结果
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">分析过程</div>
                  <p className="text-sm text-gray-700 leading-6 whitespace-pre-wrap">
                    {item?.process || (isLoading ? 'AI 正在分析该任务...' : '暂无')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">原因与结论</div>
                  <p className="text-sm text-gray-700 leading-6 whitespace-pre-wrap">
                    {item?.reason || (isLoading ? '分析结果生成后将显示在这里。' : '暂无')}
                  </p>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};
