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

/** System prompt：仅输出 JSON，供 Agent Home「AI 总结」一次调用使用。 */
export const AGENT_HOME_SUMMARY_SYSTEM_PROMPT = `${KIMI_SYSTEM_BASE}

你是 TodoAgent 工作区里的「记忆整理员」。用户会给你当前项目的结构化材料（待办统计、对话摘录、文档与 Skill 列表、SOP 片段等）。请据此生成供产品界面展示的短摘要。

你必须严格遵守：
1) 只根据输入材料下结论；材料里没有的信息不要编造（包括用户的职业、公司、具体隐私）。
2) 若材料不足，用 1～2 条简短说明「尚不足以推断」，不要臆测。
3) 输出必须是**仅包含 JSON 对象**的正文，不要用 markdown 代码块，不要前后缀解释文字。
4) 数组每一项是一句完整中文或英文句子（与 uiLanguage 一致），尽量短（每条建议不超过 80 个字或英文 120 字符）。
5) 根据 agentPersonality 调整语气侧重（不要重复 personality 这个词）：
   - coach：多给节奏与坚持方面的中性观察；
   - strategist：多给结构、风险与权衡；
   - executor：多给可执行重点与下一步倾向。
6) 三段内容不要重复同一句话；preferencesAndNeeds 侧重沟通风格、协作习惯、需求模式，不要复述纯数字统计（数字放在 projectUnderstanding 更合适）。

JSON 形状（键名固定）：
{
  "userUnderstanding": string[],
  "projectUnderstanding": string[],
  "preferencesAndNeeds": string[]
}

每段数组长度 3～6 条。`;

export function buildAgentHomeSummaryUserPrompt(input: {
  uiLanguage: 'zh' | 'en';
  agentPersonality: AgentHomePersonalityLite;
  todos: { total: number; completed: number; open: number; recentCompletedTitles: string[] };
  sopExcerpt: string;
  conversationSnippets: string[];
  userDocNames: string[];
  skillDocNames: string[];
}): string {
  const snips = input.conversationSnippets.slice(-24).join('\n---\n');
  const recents = input.todos.recentCompletedTitles.slice(0, 8).join(' | ');
  const sop = input.sopExcerpt.trim().slice(0, 6000);
  const docs = input.userDocNames.slice(0, 40).join(', ');
  const skills = input.skillDocNames.slice(0, 40).join(', ');

  return [
    `uiLanguage: ${input.uiLanguage}`,
    `agentPersonality: ${input.agentPersonality}`,
    '',
    '## Todos (counts)',
    JSON.stringify({
      total: input.todos.total,
      completed: input.todos.completed,
      open: input.todos.open,
      recentCompletedTitles: recents || '(none)',
    }),
    '',
    '## User-uploaded document names',
    docs || '(none)',
    '',
    '## Skill document names',
    skills || '(none)',
    '',
    '## SOP excerpt (may be empty)',
    sop || '(empty)',
    '',
    '## Recent conversation snippets (user + assistant, chronological chunks)',
    snips || '(empty)',
    '',
    'Remember: output JSON only, with keys userUnderstanding, projectUnderstanding, preferencesAndNeeds.',
  ].join('\n');
}

export function parseAgentHomeSummaryJson(raw: string): Omit<AgentHomeAiSnapshot, 'generatedAt'> | null {
  const tryParse = (s: string) => {
    try {
      const o = JSON.parse(s) as Record<string, unknown>;
      const user = o.userUnderstanding;
      const proj = o.projectUnderstanding;
      const pref = o.preferencesAndNeeds;
      const asArr = (v: unknown): string[] =>
        Array.isArray(v)
          ? v.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 8)
          : [];
      const u = asArr(user);
      const p = asArr(proj);
      const n = asArr(pref);
      if (!u.length && !p.length && !n.length) return null;
      return { userUnderstanding: u, projectUnderstanding: p, preferencesAndNeeds: n };
    } catch {
      return null;
    }
  };

  const direct = tryParse(raw.trim());
  if (direct) return direct;

  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) {
    const v = tryParse(fence[1].trim());
    if (v) return v;
  }

  const brace = raw.match(/\{[\s\S]*\}/);
  if (brace) return tryParse(brace[0]);

  return null;
}

export const AGENT_HOME_SUMMARY_MODEL = MOONSHOT_MODEL_DEFAULT;
