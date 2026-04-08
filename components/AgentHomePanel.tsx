import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Sparkles, UserRound } from 'lucide-react';
import { DocumentsPanel } from './DocumentsPanel';
import { AnalysisResultItem, ANALYSIS_FAILED_TASK_TYPE } from './AIAnalysisPage';
import { Conversation, Todo, WorkspaceDoc } from '../types';
import {
  loadAgentHomeAiSnapshot,
  loadProjectConversations,
  loadProjectDocs,
  PROJECT_CONVERSATIONS_UPDATED_EVENT,
  PROJECT_DOCS_UPDATED_EVENT,
  saveAgentHomeAiSnapshot,
} from '../utils/projectStorage';
import {
  AGENT_HOME_SUMMARY_MODEL,
  AGENT_HOME_INCREMENTAL_SYSTEM_PROMPT,
  AGENT_HOME_MERGE_SYSTEM_PROMPT,
  AgentSummaryDimension,
  buildAgentHomeIncrementalPrompt,
  buildAgentHomeMergePrompt,
  parseAgentHomeItemsJson,
} from '../utils/agentHomeSummary';
import {
  AgentQuotaExceededError,
  moonshotDirectApiKey,
  moonshotFetchCompletion,
  moonshotParseCompletionJson,
  moonshotProxyEnabled,
} from '../utils/moonshotClient';
import { stripHtmlTags } from '../utils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

function summarizeTodos(
  todos: Todo[],
  analysisByTodoId: Record<string, AnalysisResultItem>,
  noTitleLabel: string
) {
  const total = todos.length;
  const completed = todos.filter((t) => t.isCompleted).length;
  const open = total - completed;
  const recentCompleted = [...todos]
    .filter((t) => t.isCompleted)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map((t) => t.title.trim() || noTitleLabel);
  const failedAnalysis = Object.values(analysisByTodoId).filter(
    (x) => x.taskType === ANALYSIS_FAILED_TASK_TYPE
  ).length;
  return { total, completed, open, recentCompleted, failedAnalysis };
}

function summarizeConversations(conversations: Conversation[]) {
  const allMessages = conversations.flatMap((c) => c.messages);
  const userMessages = allMessages.filter((m) => m.role === 'user');
  const assistantMessages = allMessages.filter((m) => m.role === 'assistant');
  const latestUserText = userMessages.slice(-12).map((m) => m.content.toLowerCase()).join('\n');
  const needsExecution = /(开始|实现|开发|落地|上线|mvp|ship|build|implement)/i.test(latestUserText);
  const prefersConcise = /(简洁|简短|直接|要点|结论先行|concise|brief)/i.test(latestUserText);
  const prefersDiscussion = /(讨论|思考|方案|权衡|tradeoff|plan)/i.test(latestUserText);
  const hasChecklistHabit = /(^|\n)\s*[-*]\s|\d+\.\s/.test(latestUserText);
  return {
    userTurns: userMessages.length,
    assistantTurns: assistantMessages.length,
    needsExecution,
    prefersConcise,
    prefersDiscussion,
    hasChecklistHabit,
  };
}

function buildConversationSnippets(conversations: Conversation[]): string[] {
  const lines: string[] = [];
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const c of sorted.slice(0, 8)) {
    for (const m of c.messages.slice(-24)) {
      const raw = m.role === 'user' ? m.apiContent || m.content : m.content;
      const plain = stripHtmlTags(raw).replace(/\s+/g, ' ').trim().slice(0, 480);
      if (plain) lines.push(`${m.role}: ${plain}`);
    }
  }
  return lines.slice(-96);
}

function buildTodoConversationSnippets(conversations: Conversation[], todoId: string): string[] {
  const lines: string[] = [];
  const related = conversations.filter((c) => c.todoId === todoId).sort((a, b) => b.updatedAt - a.updatedAt);
  for (const c of related.slice(0, 6)) {
    for (const m of c.messages.slice(-30)) {
      const raw = m.role === 'user' ? m.apiContent || m.content : m.content;
      const plain = stripHtmlTags(raw).replace(/\s+/g, ' ').trim().slice(0, 900);
      if (plain) lines.push(`${m.role}: ${plain}`);
    }
  }
  return lines.slice(-120);
}

interface AgentHomePanelProps {
  projectId: string;
  todos: Todo[];
  analysisByTodoId: Record<string, AnalysisResultItem>;
  sopMarkdown: string;
}

export const AgentHomePanel: React.FC<AgentHomePanelProps> = ({
  projectId,
  todos,
  analysisByTodoId,
  sopMarkdown,
}) => {
  const { t, language } = useLanguage();
  const { getClerkToken } = useAuth();
  const ah = t.agentHome;
  const isZh = language === 'zh';
  const useMoonshotProxy = moonshotProxyEnabled();
  const directMoonshotKey = moonshotDirectApiKey();
  const defaultPersonality = 'strategist' as const;

  const [docs, setDocs] = useState<WorkspaceDoc[]>(() => loadProjectDocs(projectId));
  const [conversations, setConversations] = useState<Conversation[]>(() => loadProjectConversations(projectId));
  const [aiSnapshot, setAiSnapshot] = useState(() => loadAgentHomeAiSnapshot(projectId));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [docTab, setDocTab] = useState<'docs' | 'skills'>('docs');
  const prevCompletedTodoIdsRef = useRef<Set<string>>(new Set(todos.filter((t) => t.isCompleted).map((t) => t.id)));

  useEffect(() => {
    setDocs(loadProjectDocs(projectId));
    setConversations(loadProjectConversations(projectId));
    setAiSnapshot(loadAgentHomeAiSnapshot(projectId));
    setAiError(null);
    setDocTab('docs');
    prevCompletedTodoIdsRef.current = new Set(todos.filter((t) => t.isCompleted).map((t) => t.id));
  }, [projectId]);

  useEffect(() => {
    const onStorage = () => {
      setDocs(loadProjectDocs(projectId));
      setConversations(loadProjectConversations(projectId));
    };
    const onConversationUpdate = (e: Event) => {
      const pid = (e as CustomEvent<{ projectId: string }>).detail?.projectId;
      if (pid !== projectId) return;
      setConversations(loadProjectConversations(projectId));
    };
    const onDocsUpdate = (e: Event) => {
      const pid = (e as CustomEvent<{ projectId: string }>).detail?.projectId;
      if (pid !== projectId) return;
      setDocs(loadProjectDocs(projectId));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(PROJECT_CONVERSATIONS_UPDATED_EVENT, onConversationUpdate);
    window.addEventListener(PROJECT_DOCS_UPDATED_EVENT, onDocsUpdate);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PROJECT_CONVERSATIONS_UPDATED_EVENT, onConversationUpdate);
      window.removeEventListener(PROJECT_DOCS_UPDATED_EVENT, onDocsUpdate);
    };
  }, [projectId]);

  const userDocs = useMemo(() => docs.filter((d) => !d.isSkill), [docs]);
  const skillDocs = useMemo(() => docs.filter((d) => d.isSkill), [docs]);
  const todoSummary = useMemo(
    () => summarizeTodos(todos, analysisByTodoId, t.app.noTitle),
    [todos, analysisByTodoId, t.app.noTitle]
  );
  const chatSummary = useMemo(() => summarizeConversations(conversations), [conversations]);
  const topSkills = useMemo(
    () => skillDocs.slice(0, 5).map((d) => d.name),
    [skillDocs]
  );

  const userUnderstandingHeuristic = useMemo(() => {
    const points: string[] = [];
    points.push(
      isZh
        ? `你当前以项目推进为主，已积累 ${chatSummary.userTurns} 轮用户输入，持续在“讨论方案 + 快速开发”之间切换。`
        : `You are in a build-focused mode with ${chatSummary.userTurns} user turns, switching between planning and shipping.`
    );
    if (chatSummary.needsExecution) {
      points.push(isZh ? '近期信号显示你偏好“先落地再迭代”的推进节奏。' : 'Recent signals indicate a ship-first iteration style.');
    }
    if (chatSummary.prefersDiscussion) {
      points.push(isZh ? '你会在关键节点先讨论信息架构和触发机制，再进入开发。' : 'You tend to discuss architecture and triggers before implementation.');
    }
    return points;
  }, [chatSummary, isZh]);

  const projectUnderstandingHeuristic = useMemo(() => {
    const points: string[] = [];
    points.push(
      isZh
        ? `当前项目共 ${todoSummary.total} 个任务，已完成 ${todoSummary.completed} 个，待推进 ${todoSummary.open} 个。`
        : `${todoSummary.completed}/${todoSummary.total} tasks completed, ${todoSummary.open} still in progress.`
    );
    if (sopMarkdown.trim()) {
      points.push(isZh ? '项目已形成增量 SOP，Agent 可基于历史执行轨迹给出下一步建议。' : 'Incremental SOP exists and can guide next actions.');
    } else {
      points.push(isZh ? '尚未形成完整 SOP，建议继续完成任务以增强流程画像。' : 'No stable SOP yet; complete more tasks to build process memory.');
    }
    if (todoSummary.recentCompleted.length) {
      points.push(
        isZh
          ? `最近完成：${todoSummary.recentCompleted.slice(0, 3).join('、')}`
          : `Recently done: ${todoSummary.recentCompleted.slice(0, 3).join(', ')}`
      );
    }
    return points;
  }, [isZh, sopMarkdown, todoSummary]);

  const preferenceSummaryHeuristic = useMemo(() => {
    const points: string[] = [];
    points.push(
      isZh
        ? `Agent 对话累计：用户 ${chatSummary.userTurns} 轮 / Agent ${chatSummary.assistantTurns} 轮。`
        : `Chat stats: ${chatSummary.userTurns} user turns / ${chatSummary.assistantTurns} agent turns.`
    );
    if (chatSummary.prefersConcise) {
      points.push(isZh ? '沟通偏好：偏好简洁、结论导向的回复。' : 'Communication preference: concise, conclusion-first responses.');
    }
    if (chatSummary.hasChecklistHabit) {
      points.push(isZh ? '执行偏好：偏好列表化/条目化组织信息。' : 'Execution preference: list-oriented organization.');
    }
    points.push(
      isZh
        ? '需求倾向：希望看到“上下文编排 + 触发时机 + 总结频率”这类可执行机制。'
        : 'Need pattern: asks for actionable mechanisms (context, trigger timing, summary cadence).'
    );
    return points;
  }, [chatSummary, isZh]);

  const userUnderstanding = aiSnapshot?.userUnderstanding?.length
    ? aiSnapshot.userUnderstanding
    : userUnderstandingHeuristic;
  const projectUnderstanding = aiSnapshot?.projectUnderstanding?.length
    ? aiSnapshot.projectUnderstanding
    : projectUnderstandingHeuristic;
  const preferenceSummary = aiSnapshot?.preferencesAndNeeds?.length
    ? aiSnapshot.preferencesAndNeeds
    : preferenceSummaryHeuristic;

  const runAiSummary = useCallback(async (input: { trigger: 'auto' | 'manual'; todo: Todo | null }) => {
    if (aiLoading) return;
    setAiError(null);
    if (useMoonshotProxy) {
      const tok = await getClerkToken();
      if (!tok) {
        setAiError(ah.needSignIn);
        return;
      }
    } else if (!directMoonshotKey) {
      setAiError(ah.needApiKey);
      return;
    }

    setAiLoading(true);
    try {
      const callModel = async (systemPrompt: string, userPrompt: string) => {
        const moonshotBody = {
          model: AGENT_HOME_SUMMARY_MODEL,
          temperature: 0.3,
          messages: [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: userPrompt },
          ],
        };
        if (useMoonshotProxy) {
          const res = await moonshotFetchCompletion(getClerkToken, {
            billingKind: 'sop',
            dedupeKey: `agent-home:${projectId}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
            body: moonshotBody,
          });
          const data = await moonshotParseCompletionJson(res);
          return String(data.choices?.[0]?.message?.content ?? '');
        }
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${directMoonshotKey}`,
          },
          body: JSON.stringify(moonshotBody),
        });
        if (!response.ok) {
          let detail = '';
          try {
            const err = await response.json();
            detail = err?.error?.message || '';
          } catch {
            detail = await response.text();
          }
          throw new Error(detail || `HTTP ${response.status}`);
        }
        const data = await response.json();
        return String(data?.choices?.[0]?.message?.content ?? '');
      };

      const baseUserUnderstanding = aiSnapshot?.userUnderstanding?.length
        ? aiSnapshot.userUnderstanding
        : userUnderstandingHeuristic;
      const baseProjectUnderstanding = aiSnapshot?.projectUnderstanding?.length
        ? aiSnapshot.projectUnderstanding
        : projectUnderstandingHeuristic;
      const basePreferences = aiSnapshot?.preferencesAndNeeds?.length
        ? aiSnapshot.preferencesAndNeeds
        : preferenceSummaryHeuristic;

      const conversationSnippets =
        input.trigger === 'auto' && input.todo
          ? buildTodoConversationSnippets(conversations, input.todo.id)
          : buildConversationSnippets(conversations);

      const summarizeOneDimension = async (
        dimension: AgentSummaryDimension,
        currentItems: string[]
      ): Promise<string[]> => {
        const incrementalPrompt = buildAgentHomeIncrementalPrompt({
          uiLanguage: isZh ? 'zh' : 'en',
          agentPersonality: defaultPersonality,
          trigger: input.trigger,
          targetDimension: dimension,
          currentItems,
          todo: input.todo
            ? { id: input.todo.id, title: input.todo.title, content: input.todo.content }
            : null,
          conversationSnippets,
        });
        const incrementalRaw = await callModel(AGENT_HOME_INCREMENTAL_SYSTEM_PROMPT, incrementalPrompt);
        const incrementalItems = parseAgentHomeItemsJson(incrementalRaw);
        if (!incrementalItems) throw new Error('invalid_json');

        const mergePrompt = buildAgentHomeMergePrompt({
          uiLanguage: isZh ? 'zh' : 'en',
          targetDimension: dimension,
          currentItems,
          incomingItems: incrementalItems,
        });
        const mergedRaw = await callModel(AGENT_HOME_MERGE_SYSTEM_PROMPT, mergePrompt);
        const mergedItems = parseAgentHomeItemsJson(mergedRaw);
        if (!mergedItems) throw new Error('invalid_json');
        return mergedItems;
      };

      const [nextPreferences, nextUserUnderstanding, nextProjectUnderstanding] = await Promise.all([
        summarizeOneDimension('preferencesAndNeeds', basePreferences),
        summarizeOneDimension('userUnderstanding', baseUserUnderstanding),
        summarizeOneDimension('projectUnderstanding', baseProjectUnderstanding),
      ]);

      const snapshot = {
        userUnderstanding: nextUserUnderstanding,
        projectUnderstanding: nextProjectUnderstanding,
        preferencesAndNeeds: nextPreferences,
        generatedAt: Date.now(),
      };
      saveAgentHomeAiSnapshot(projectId, snapshot);
      setAiSnapshot(snapshot);
    } catch (e) {
      if (e instanceof AgentQuotaExceededError) {
        setAiError(ah.aiQuotaHint);
      } else if (e instanceof Error && e.message === 'invalid_json') {
        setAiError(ah.aiSummaryFailed);
      } else {
        setAiError(e instanceof Error ? e.message : ah.aiSummaryFailed);
      }
    } finally {
      setAiLoading(false);
    }
  }, [
    ah.aiQuotaHint,
    ah.aiSummaryFailed,
    ah.needApiKey,
    ah.needSignIn,
    aiLoading,
    aiSnapshot?.preferencesAndNeeds,
    aiSnapshot?.projectUnderstanding,
    aiSnapshot?.userUnderstanding,
    conversations,
    directMoonshotKey,
    getClerkToken,
    isZh,
    projectId,
    preferenceSummaryHeuristic,
    projectUnderstandingHeuristic,
    useMoonshotProxy,
    userUnderstandingHeuristic,
    defaultPersonality,
  ]);

  useEffect(() => {
    const currentCompleted = new Set(todos.filter((t) => t.isCompleted).map((t) => t.id));
    let newlyCompletedTodo: Todo | null = null;
    for (const todo of todos) {
      if (todo.isCompleted && !prevCompletedTodoIdsRef.current.has(todo.id)) {
        newlyCompletedTodo = todo;
      }
    }
    prevCompletedTodoIdsRef.current = currentCompleted;
    if (!newlyCompletedTodo || aiLoading) return;
    void runAiSummary({ trigger: 'auto', todo: newlyCompletedTodo });
  }, [aiLoading, runAiSummary, todos]);

  return (
    <div className="space-y-5">
      {aiError ? <p className="text-xs text-rose-600">{aiError}</p> : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <UserRound size={17} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {isZh ? 'AI在认识你' : 'AI Is Learning About You'}
            </h3>
          </div>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {userUnderstanding.map((line, idx) => (
              <li key={idx}>- {line}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Brain size={17} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {isZh ? 'AI在理解你的项目' : 'AI Is Understanding Your Project'}
            </h3>
          </div>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {projectUnderstanding.map((line, idx) => (
              <li key={idx}>- {line}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={17} className="text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            {isZh ? 'AI在整理你的偏好' : 'AI Is Organizing Your Preferences'}
          </h3>
        </div>
        <ul className="space-y-1.5 text-sm text-gray-700">
          {preferenceSummary.map((line, idx) => (
            <li key={idx}>- {line}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDocTab('docs')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              docTab === 'docs' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isZh ? `文档（${userDocs.length}）` : `Docs (${userDocs.length})`}
          </button>
          <button
            type="button"
            onClick={() => setDocTab('skills')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              docTab === 'skills' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isZh ? `Skill（${skillDocs.length}）` : `Skills (${skillDocs.length})`}
          </button>
        </div>
        <div>
          <DocumentsPanel projectId={projectId} listScope={docTab === 'docs' ? 'user' : 'skill'} />
        </div>
      </section>
    </div>
  );
};
