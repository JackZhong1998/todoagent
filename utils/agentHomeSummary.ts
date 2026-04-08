import { MOONSHOT_MODEL_DEFAULT } from './moonshotClient';

const KIMI_SYSTEM_BASE =
  '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。Moonshot AI 为专有名词，不可翻译成其他语言。';

export type AgentHomeAiSnapshot = {
  userUnderstanding: string[];
  projectUnderstanding: string[];
  preferencesAndNeeds: string[];
  generatedAt: number;
};

export type AgentHomePersonalityLite = 'coach' | 'strategist' | 'executor';

export type AgentSummaryDimension = 'preferencesAndNeeds' | 'userUnderstanding' | 'projectUnderstanding';

export const AGENT_HOME_INCREMENTAL_SYSTEM_PROMPT = `${KIMI_SYSTEM_BASE}

你是 TodoAgent 的「长期用户认知引擎」。你的任务不是做一次性摘要，而是持续积累并修正对用户的认识。

目标：
- 每次只处理一个维度（preferencesAndNeeds / userUnderstanding / projectUnderstanding）。
- 结合“已有认知 + 本次新增材料”，产出可累积、可复用、可长期维护的增量认知条目。
- 输出要偏“稳定特征”和“可执行洞察”，不是流水账。

硬性规则：
1) 只使用输入材料，不得编造。不要推断用户职业、公司、隐私身份等未给信息。
2) 若证据不足，允许输出 1-2 条“证据不足”类条目，但不要空泛。
3) 输出必须是纯 JSON 对象，不要 markdown，不要解释前后缀。
4) 每条是一句完整句子，语言跟 uiLanguage 保持一致，尽量简洁（中文 <= 80 字，英文 <= 120 chars）。
5) 内容应该“可累计”：优先保留长期有效的认识；短期一次性细节应降权。
6) 可以修正已有认知：若新证据与旧认知冲突，应更新为更可靠表达。
7) 根据 agentPersonality 调整表达重点：
   - coach：更强调节奏、动机、坚持方式；
   - strategist：更强调结构、风险、权衡与决策习惯；
   - executor：更强调执行偏好、动作顺序、推进方式。
8) 当前只处理一个 targetDimension，严禁输出其它维度内容。

输出 JSON 形状（键名固定）：
{
  "items": string[]
}

items 长度 4-10。`;

export const AGENT_HOME_MERGE_SYSTEM_PROMPT = `${KIMI_SYSTEM_BASE}

你是 TodoAgent 的「认知合并器」。你会收到某个维度的当前认知条目与本次新增条目。
你的任务是合并成更高质量、更长期可用的一组认知。

合并准则：
1) 去重：语义重复的条目只保留表达更清晰的一条。
2) 提纯：删除空话、模板话、无证据的猜测。
3) 纠偏：如果新条目能修正旧条目，保留修正后的版本。
4) 累积：保留长期有效认知，避免只反映一次性临时状态。
5) 可执行：尽量让条目能指导后续协作与交互策略。
6) 只按 targetDimension 输出，不混入其它维度内容。
7) 输出必须是纯 JSON 对象，不要 markdown，不要前后缀解释。

输出 JSON 形状（键名固定）：
{
  "items": string[]
}

items 长度 6-16。`;

export function buildAgentHomeIncrementalPrompt(input: {
  uiLanguage: 'zh' | 'en';
  agentPersonality: AgentHomePersonalityLite;
  trigger: 'auto' | 'manual';
  targetDimension: AgentSummaryDimension;
  currentItems: string[];
  todo: { id: string; title: string; content: string } | null;
  conversationSnippets: string[];
}): string {
  const snips = input.conversationSnippets.slice(-36).join('\n---\n');
  const todoBlock = input.todo
    ? JSON.stringify(
        {
          id: input.todo.id,
          title: input.todo.title || '(empty)',
          content: input.todo.content.slice(0, 12000) || '(empty)',
        },
        null,
        2
      )
    : '(none)';

  return [
    `uiLanguage: ${input.uiLanguage}`,
    `agentPersonality: ${input.agentPersonality}`,
    `trigger: ${input.trigger}`,
    `targetDimension: ${input.targetDimension}`,
    '',
    '## Current stored items for this dimension',
    JSON.stringify(input.currentItems.slice(0, 24), null, 2),
    '',
    '## Current todo (only this todo should be considered as task context)',
    todoBlock,
    '',
    '## Conversation snippets related to this summarization',
    snips || '(empty)',
    '',
    'Return JSON only: {"items": string[]}.',
  ].join('\n');
}

export function buildAgentHomeMergePrompt(input: {
  uiLanguage: 'zh' | 'en';
  targetDimension: AgentSummaryDimension;
  currentItems: string[];
  incomingItems: string[];
}): string {
  return [
    `uiLanguage: ${input.uiLanguage}`,
    `targetDimension: ${input.targetDimension}`,
    '',
    '## Existing items',
    JSON.stringify(input.currentItems.slice(0, 36), null, 2),
    '',
    '## Incoming items',
    JSON.stringify(input.incomingItems.slice(0, 24), null, 2),
    '',
    'Return JSON only: {"items": string[]}.',
  ].join('\n');
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const direct = tryParse(raw.trim());
  if (direct) return direct as Record<string, unknown>;

  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) {
    const v = tryParse(fence[1].trim());
    if (v) return v as Record<string, unknown>;
  }

  const brace = raw.match(/\{[\s\S]*\}/);
  if (brace) return tryParse(brace[0]) as Record<string, unknown> | null;

  return null;
}

const asStringArray = (v: unknown, limit: number): string[] =>
  Array.isArray(v)
    ? v
        .map((x) => String(x ?? '').trim())
        .filter(Boolean)
        .slice(0, limit)
    : [];

export function parseAgentHomeItemsJson(raw: string): string[] | null {
  const o = parseJsonObject(raw);
  if (!o) return null;
  const items = asStringArray(o.items, 24);
  return items.length ? items : [];
}

export function parseAgentHomeSummaryJson(raw: string): Omit<AgentHomeAiSnapshot, 'generatedAt'> | null {
  const o = parseJsonObject(raw);
  if (!o) return null;
  const u = asStringArray(o.userUnderstanding, 24);
  const p = asStringArray(o.projectUnderstanding, 24);
  const n = asStringArray(o.preferencesAndNeeds, 24);
  if (!u.length && !p.length && !n.length) return null;
  return { userUnderstanding: u, projectUnderstanding: p, preferencesAndNeeds: n };
}

export const AGENT_HOME_SUMMARY_MODEL = MOONSHOT_MODEL_DEFAULT;
