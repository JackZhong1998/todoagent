import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Brain, FileText, Loader2, Sparkles, UserRound, Wrench } from 'lucide-react';
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
  AGENT_HOME_SUMMARY_SYSTEM_PROMPT,
  buildAgentHomeSummaryUserPrompt,
  parseAgentHomeSummaryJson,
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
import {
  loadAgentPersonality,
  saveAgentPersonality,
  type AgentPersonality,
} from '../utils/agentPersonality';

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

  const [personality, setPersonality] = useState<AgentPersonality>(() => loadAgentPersonality(projectId));
  const [docs, setDocs] = useState<WorkspaceDoc[]>(() => loadProjectDocs(projectId));
  const [conversations, setConversations] = useState<Conversation[]>(() => loadProjectConversations(projectId));
  const [aiSnapshot, setAiSnapshot] = useState(() => loadAgentHomeAiSnapshot(projectId));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setPersonality(loadAgentPersonality(projectId));
    setDocs(loadProjectDocs(projectId));
    setConversations(loadProjectConversations(projectId));
    setAiSnapshot(loadAgentHomeAiSnapshot(projectId));
    setAiError(null);
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

  const refreshAiSummary = useCallback(async () => {
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
      const userPrompt = buildAgentHomeSummaryUserPrompt({
        uiLanguage: isZh ? 'zh' : 'en',
        agentPersonality: personality,
        todos: {
          total: todoSummary.total,
          completed: todoSummary.completed,
          open: todoSummary.open,
          recentCompletedTitles: todoSummary.recentCompleted,
        },
        sopExcerpt: sopMarkdown,
        conversationSnippets: buildConversationSnippets(conversations),
        userDocNames: userDocs.map((d) => d.name),
        skillDocNames: skillDocs.map((d) => d.name),
      });

      const moonshotBody = {
        model: AGENT_HOME_SUMMARY_MODEL,
        temperature: 0.35,
        messages: [
          { role: 'system' as const, content: AGENT_HOME_SUMMARY_SYSTEM_PROMPT },
          { role: 'user' as const, content: userPrompt },
        ],
      };

      let raw: string;
      if (useMoonshotProxy) {
        const res = await moonshotFetchCompletion(getClerkToken, {
          billingKind: 'sop',
          dedupeKey: `agent-home:${projectId}:${Date.now()}`,
          body: moonshotBody,
        });
        const data = await moonshotParseCompletionJson(res);
        raw = String(data.choices?.[0]?.message?.content ?? '');
      } else {
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
        raw = String(data?.choices?.[0]?.message?.content ?? '');
      }

      const parsed = parseAgentHomeSummaryJson(raw);
      if (!parsed) throw new Error('invalid_json');

      const snapshot = { ...parsed, generatedAt: Date.now() };
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
    conversations,
    directMoonshotKey,
    getClerkToken,
    isZh,
    personality,
    projectId,
    skillDocs,
    sopMarkdown,
    todoSummary.completed,
    todoSummary.open,
    todoSummary.recentCompleted,
    todoSummary.total,
    useMoonshotProxy,
    userDocs,
  ]);

  const personalityOptions: Array<{
    id: AgentPersonality;
    title: string;
    desc: string;
  }> = [
    {
      id: 'coach',
      title: isZh ? '教练型' : 'Coach',
      desc: isZh ? '强调鼓励与节奏管理，适合持续推进。' : 'Motivation and cadence management.',
    },
    {
      id: 'strategist',
      title: isZh ? '参谋型' : 'Strategist',
      desc: isZh ? '强调分析、权衡和风险提示，适合方案设计。' : 'Analysis, trade-offs, and risk framing.',
    },
    {
      id: 'executor',
      title: isZh ? '执行官型' : 'Executor',
      desc: isZh ? '强调任务拆解和直接行动，减少讨论成本。' : 'Task breakdown and direct execution.',
    },
  ];

  const updatePersonality = (next: AgentPersonality) => {
    setPersonality(next);
    saveAgentPersonality(projectId, next);
  };

  const aiUpdatedLabel =
    aiSnapshot?.generatedAt && aiSnapshot.generatedAt > 0
      ? new Date(aiSnapshot.generatedAt).toLocaleString(isZh ? 'zh-CN' : 'en-US')
      : null;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Bot size={18} className="text-gray-700 shrink-0" />
            <h2 className="text-base font-semibold text-gray-900">
              {isZh ? 'Agent 的家' : 'Agent Home'}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              type="button"
              onClick={() => void refreshAiSummary()}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {aiLoading ? ah.refreshing : ah.refreshAiSummary}
            </button>
            {aiUpdatedLabel ? (
              <p className="text-[10px] text-gray-400">
                {ah.lastAiUpdate}: {aiUpdatedLabel}
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {isZh
            ? '这里汇总 Agent 对你、对项目、对偏好需求的理解，以及已拥有的文档与技能。点击下方可用 Kimi 基于当前材料生成「AI 总结」（使用与 SOP 相同的计费通道）。'
            : 'Memory for you, the project, preferences, docs, and skills. Use the button to run a Kimi JSON summary (billed like SOP updates).'}
        </p>
        {aiError ? <p className="mt-2 text-xs text-rose-600">{aiError}</p> : null}
        {!aiSnapshot?.generatedAt ? (
          <p className="mt-2 text-xs text-amber-800/80">{ah.quickSummaryNote}</p>
        ) : (
          <p className="mt-2 text-xs text-emerald-700/90">{ah.aiGeneratedBadge}</p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <UserRound size={17} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {isZh ? 'Agent 对用户的理解' : 'User Understanding'}
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
              {isZh ? 'Agent 对当前项目的理解' : 'Project Understanding'}
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
            {isZh ? '用户偏好与需求总结' : 'Preference & Needs Summary'}
          </h3>
        </div>
        <ul className="space-y-1.5 text-sm text-gray-700">
          {preferenceSummary.map((line, idx) => (
            <li key={idx}>- {line}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-400">
          {isZh
            ? '触发时机（规划）：任务完成、文档上传、Skill 更新、长对话结束后可手动或自动刷新 AI 总结。'
            : 'Triggers (planned): task done, doc/skill change, long chat; refresh manually or on schedule.'}
        </p>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">
          {isZh ? 'Agent 性格（3 选 1）' : 'Agent Personality'}
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          {personalityOptions.map((item) => {
            const active = personality === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => updatePersonality(item.id)}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  active ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-semibold">{item.title}</p>
                <p className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>{item.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <FileText size={17} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {isZh ? `Agent 拥有的文档（${userDocs.length}）` : `Agent Documents (${userDocs.length})`}
            </h3>
          </div>
          <ul className="space-y-1 text-sm text-gray-700">
            {userDocs.slice(0, 8).map((doc) => (
              <li key={doc.id}>- {doc.name}</li>
            ))}
            {userDocs.length === 0 ? <li>- {isZh ? '暂无上传文档' : 'No uploaded documents'}</li> : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Wrench size={17} className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {isZh ? `Agent 拥有的 Skill 文档（${skillDocs.length}）` : `Skill Documents (${skillDocs.length})`}
            </h3>
          </div>
          <ul className="space-y-1 text-sm text-gray-700">
            {topSkills.map((name) => (
              <li key={name}>- {name}</li>
            ))}
            {skillDocs.length === 0 ? <li>- {isZh ? '暂无 Skill 文档' : 'No skill documents'}</li> : null}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{isZh ? '文档管理（上传）' : 'Document Manager'}</h3>
          <p className="text-xs text-gray-500">
            {isZh ? '保留原有上传与预览能力。' : 'Keeps existing upload and preview flow.'}
          </p>
        </div>
        <DocumentsPanel projectId={projectId} listScope="user" />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{isZh ? 'Skill 文档管理' : 'Skill Manager'}</h3>
          <p className="text-xs text-gray-500">
            {isZh ? '由对话工具导入并沉淀到项目文档。' : 'Imported from chat tools and persisted in project docs.'}
          </p>
        </div>
        <DocumentsPanel projectId={projectId} listScope="skill" />
      </section>
    </div>
  );
};
