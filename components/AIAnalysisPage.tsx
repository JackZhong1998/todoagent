import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Todo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export type Replaceability = '可替代' | '不可替代' | '不清楚';

export interface AnalysisResultItem {
  todoId: string;
  title: string;
  taskType: string;
  replaceability: Replaceability;
  /** 任务属性：目标、领域、环境、约束 */
  taskAttributes?: string;
  /** 涉及的人类原子能力 */
  humanAtomicCapabilities?: string[];
  /** 需用户或环境提供的上下文 */
  requiredUserContext?: string[];
  /** 当下实现可能性（现有产品/范式） */
  currentFeasibility?: string;
  /** 未来能力组合与实现路径 */
  futureImplementationPath?: string;
  /** Agent 侧原子能力标签 */
  agentAtomicCapabilities?: string[];
  /** 多模态相关能力标签 */
  multimodalCapabilities?: string[];
  process: string;
  reason: string;
}

interface AIAnalysisPageProps {
  todos: Todo[];
  analysisByTodoId: Record<string, AnalysisResultItem>;
  analysisLoadingByTodoId: Record<string, boolean>;
  onBack?: () => void;
  /** Hide top bar with back button (e.g. when shown inside app tab). */
  embedded?: boolean;
  /** Incremental SOP Markdown (stats tab, second sub-tab). */
  sopMarkdown?: string;
  sopLoading?: boolean;
}

/** Stored in cache when analysis API fails; keep stable for retry logic. */
export const ANALYSIS_FAILED_TASK_TYPE = '分析失败';

function replaceabilityLabel(value: Replaceability, a: { replaceableDisplay: string; nonReplaceableDisplay: string; unclearDisplay: string }): string {
  if (value === '可替代') return a.replaceableDisplay;
  if (value === '不可替代') return a.nonReplaceableDisplay;
  return a.unclearDisplay;
}

function formatTaskTypeLine(
  item: AnalysisResultItem | undefined,
  isLoading: boolean,
  a: { analyzingEllipsis: string; notAnalyzed: string; analysisFailed: string }
): string {
  if (isLoading) return a.analyzingEllipsis;
  if (!item?.taskType) return a.notAnalyzed;
  if (item.taskType === ANALYSIS_FAILED_TASK_TYPE) return a.analysisFailed;
  return item.taskType;
}

function TagList({
  label,
  items,
  emptyHint,
}: {
  label: string;
  items?: string[];
  emptyHint: string;
}) {
  const list = (items ?? []).filter(Boolean);
  return (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-2">{label}</div>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyHint}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {list.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200/90"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProseBlock({
  title,
  text,
  placeholder,
}: {
  title: string;
  text?: string;
  placeholder: string;
}) {
  const body = text?.trim();
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100/80">
      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{title}</div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{body || placeholder}</p>
    </div>
  );
}

export const AIAnalysisPage: React.FC<AIAnalysisPageProps> = ({
  todos,
  analysisByTodoId,
  analysisLoadingByTodoId,
  onBack,
  embedded = false,
  sopMarkdown = '',
  sopLoading = false,
}) => {
  const { t } = useLanguage();
  const a = t.analysis;
  const [statsSubTab, setStatsSubTab] = useState<'replaceability' | 'sop'>('replaceability');
  const completedTodos = useMemo(
    () => todos.filter((todo) => todo.isCompleted).sort((a, b) => b.createdAt - a.createdAt),
    [todos]
  );
  const availableResults = useMemo(
    () => completedTodos.map((todo) => analysisByTodoId[todo.id]).filter(Boolean),
    [completedTodos, analysisByTodoId]
  );

  const total = availableResults.length;
  const replaceableCount = availableResults.filter((r) => r.replaceability === '可替代').length;
  const nonReplaceableCount = availableResults.filter((r) => r.replaceability === '不可替代').length;
  const unclearCount = availableResults.filter((r) => r.replaceability === '不清楚').length;

  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '0%');

  const replaceabilitySection = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">{a.statCompleted}</div>
          <div className="mt-2 text-3xl font-bold text-black">{completedTodos.length}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">{a.statReplaceable}</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{replaceableCount}</div>
          <div className="text-xs text-gray-400 mt-1">{pct(replaceableCount)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">{a.statNonReplaceable}</div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{nonReplaceableCount}</div>
          <div className="text-xs text-gray-400 mt-1">{pct(nonReplaceableCount)}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider">{a.statUnclear}</div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{unclearCount}</div>
          <div className="text-xs text-gray-400 mt-1">{pct(unclearCount)}</div>
        </div>
      </div>

      <div className="space-y-5">
        {completedTodos.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-gray-100 rounded-[32px] text-sm text-gray-400">
            {a.emptyState}
          </div>
        ) : (
          completedTodos.map((todo) => {
            const item = analysisByTodoId[todo.id];
            const isLoading = !!analysisLoadingByTodoId[todo.id];
            const isLegacyCached =
              !!item &&
              item.humanAtomicCapabilities === undefined &&
              item.currentFeasibility === undefined &&
              item.agentAtomicCapabilities === undefined;
            const legacyNote = isLegacyCached && !!item.process?.trim();

            return (
              <article
                key={todo.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{todo.title || t.app.noTitle}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {a.taskTypeLabel}
                        {formatTaskTypeLine(item, isLoading, a)}
                      </p>
                      {legacyNote ? (
                        <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 inline-block">
                          {a.legacyCacheNote}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      {isLoading ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <Loader2 size={12} className="animate-spin" />
                          {a.analyzingBadge}
                        </span>
                      ) : item ? (
                        <span
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            item.replaceability === '可替代'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.replaceability === '不可替代'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {a.verdictPrefix}
                          {replaceabilityLabel(item.replaceability, a)}
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          {a.noResultYet}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <ProseBlock
                    title={a.sectionTaskAttributes}
                    text={item?.taskAttributes}
                    placeholder={isLoading ? a.loadingTaskAttributes : a.none}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100/80">
                      <TagList
                        label={a.sectionHumanCapabilities}
                        items={item?.humanAtomicCapabilities}
                        emptyHint={isLoading ? a.analyzingEllipsis : a.none}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100/80">
                      <TagList
                        label={a.sectionUserContext}
                        items={item?.requiredUserContext}
                        emptyHint={isLoading ? a.analyzingEllipsis : a.none}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProseBlock
                      title={a.sectionCurrentFeasibility}
                      text={item?.currentFeasibility}
                      placeholder={isLoading ? a.loadingFeasibility : a.none}
                    />
                    <ProseBlock
                      title={a.sectionFuturePath}
                      text={item?.futureImplementationPath}
                      placeholder={isLoading ? a.loadingFuturePath : a.none}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/60">
                      <TagList
                        label={a.sectionAgentCapabilities}
                        items={item?.agentAtomicCapabilities}
                        emptyHint={isLoading ? a.analyzingEllipsis : a.none}
                      />
                    </div>
                    <div className="bg-violet-50/40 rounded-xl p-4 border border-violet-100/60">
                      <TagList
                        label={a.sectionMultimodal}
                        items={item?.multimodalCapabilities}
                        emptyHint={isLoading ? a.analyzingEllipsis : a.emptyMultimodal}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProseBlock
                      title={a.sectionProcess}
                      text={item?.process}
                      placeholder={isLoading ? a.loadingProcess : a.none}
                    />
                    <ProseBlock
                      title={a.sectionReason}
                      text={item?.reason}
                      placeholder={isLoading ? a.loadingReason : a.none}
                    />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {embedded ? (
        <div className="space-y-3">
          <div className="flex p-1 bg-gray-100/80 rounded-xl w-full max-w-md">
            <button
              type="button"
              onClick={() => setStatsSubTab('replaceability')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                statsSubTab === 'replaceability'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {a.tabReplaceability}
            </button>
            <button
              type="button"
              onClick={() => setStatsSubTab('sop')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                statsSubTab === 'sop' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {a.tabSop}
            </button>
          </div>
          {statsSubTab === 'replaceability' ? (
            <p className="text-xs text-gray-400 leading-relaxed bg-white border border-gray-100 rounded-2xl px-5 py-4">
              {a.headerHint}
            </p>
          ) : (
            <p className="text-xs text-gray-400 leading-relaxed bg-white border border-gray-100 rounded-2xl px-5 py-4">
              {a.sopHint}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            {a.backToTodo}
          </button>
          <div className="text-xs text-gray-400 max-w-md text-right leading-relaxed">{a.headerHint}</div>
        </div>
      )}

      {embedded && statsSubTab === 'sop' ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 min-h-[240px]">
          {sopLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin shrink-0" />
              {a.sopUpdating}
            </div>
          ) : sopMarkdown.trim() ? (
            <article className="prose prose-sm prose-gray max-w-none prose-headings:font-semibold prose-a:text-blue-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{sopMarkdown}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-gray-400">{a.sopEmpty}</p>
          )}
        </div>
      ) : (
        replaceabilitySection
      )}
    </div>
  );
};
