export type AgentPersonality = 'coach' | 'strategist' | 'executor';

const PREFIX = 'todoagent_personality_v1_';

export function loadAgentPersonality(projectId: string): AgentPersonality {
  if (typeof window === 'undefined') return 'strategist';
  const raw = localStorage.getItem(`${PREFIX}${projectId}`);
  if (raw === 'coach' || raw === 'strategist' || raw === 'executor') return raw;
  return 'strategist';
}

export function saveAgentPersonality(projectId: string, personality: AgentPersonality): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${PREFIX}${projectId}`, personality);
}

/** 附加到对话 system prompt，与 Agent 主页「性格」三选一联动。 */
export function agentPersonalityPromptAddon(projectId: string, language: 'zh' | 'en'): string {
  const p = loadAgentPersonality(projectId);
  if (language === 'zh') {
    if (p === 'coach') {
      return '\n\n## 协作语气（用户已在 Agent 主页选择）\n采用「教练型」：多给节奏与坚持方面的反馈，用简短鼓励配合具体下一步，避免空洞套话。';
    }
    if (p === 'executor') {
      return '\n\n## 协作语气（用户已在 Agent 主页选择）\n采用「执行官型」：优先给出可执行拆解与明确下一步，控制铺陈，少说抽象原则。';
    }
    return '\n\n## 协作语气（用户已在 Agent 主页选择）\n采用「参谋型」：优先结构、权衡与风险；结论前先简要交代推理。';
  }
  if (p === 'coach') {
    return '\n\n## Collaboration tone (set in Agent Home)\nCoach mode: emphasize cadence and steady progress; pair brief encouragement with concrete next steps.';
  }
  if (p === 'executor') {
    return '\n\n## Collaboration tone (set in Agent Home)\nExecutor mode: prioritize actionable breakdowns and the very next step; keep theory minimal.';
  }
  return '\n\n## Collaboration tone (set in Agent Home)\nStrategist mode: emphasize structure, trade-offs, and risks; show reasoning briefly before conclusions.';
}
