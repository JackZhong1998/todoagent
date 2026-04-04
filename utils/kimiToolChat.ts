import type { KimiAgentToolDefinition } from "./kimiToolDefinitions";
import type { Message } from "../types";
import { AgentQuotaExceededError } from "./moonshotClient";

const MOONSHOT_URL = "https://api.moonshot.cn/v1/chat/completions";

export type KimiUserContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type KimiToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type KimiAssistantMessage = {
  role: "assistant";
  content: string | null;
  tool_calls?: KimiToolCall[];
  /** 启用思考能力时，多轮 tool 调用必须原样带回，否则会 400。 */
  reasoning_content?: string | null;
};

type KimiToolMessage = {
  role: "tool";
  tool_call_id: string;
  content: string;
};

export type KimiRequestMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | KimiUserContentPart[] }
  | KimiAssistantMessage
  | KimiToolMessage;

/** Builds OpenAI-compatible user `content` for Moonshot / Kimi (incl. vision). */
export function kimiUserMessageContent(m: Message): string | KimiUserContentPart[] {
  const text = String(m.apiContent ?? m.content ?? "");
  const trimmed = text.trim();
  const imgs =
    m.imageDataUrls?.filter((u) => typeof u === "string" && u.startsWith("data:image/")) ?? [];
  if (!imgs.length) {
    return trimmed.length ? trimmed : " ";
  }
  const parts: KimiUserContentPart[] = [];
  for (const url of imgs) {
    parts.push({ type: "image_url", image_url: { url } });
  }
  parts.push({ type: "text", text: trimmed.length ? trimmed : "（见附图）" });
  return parts;
}

/** kimi-k2.5 可关闭思考，避免 tool 多轮必须携带 reasoning_content；thinking 专用模型勿用。 */
function requestBodyForModel(
  model: string,
  base: Record<string, unknown>
): Record<string, unknown> {
  const lower = model.toLowerCase();
  if (lower.includes("k2.5") || lower.includes("k2_5")) {
    return { ...base, thinking: { type: "disabled" } };
  }
  return base;
}

export async function runKimiWithTools(options: {
  /** 直连 Moonshot（仅本地/未启用代理时） */
  apiKey?: string;
  /** 服务端代理：每轮传入完整 OpenAI-compatible body */
  moonshotCompletions?: (body: Record<string, unknown>) => Promise<Response>;
  model: string;
  /** Refreshed each API round so mid-turn changes (e.g. imported skills) apply to the next model call. */
  getSystemContent: () => string;
  history: Message[];
  tools: KimiAgentToolDefinition[];
  maxToolRounds?: number;
  executeTool: (name: string, argsJson: string) => Promise<string>;
}): Promise<string> {
  const {
    apiKey,
    moonshotCompletions,
    model,
    getSystemContent,
    history,
    tools,
    executeTool,
    maxToolRounds = 8,
  } = options;

  const baseMessages: KimiRequestMessage[] = history.map((m) => {
    if (m.role === "assistant") {
      return { role: "assistant", content: m.content };
    }
    return { role: "user", content: kimiUserMessageContent(m) };
  });

  const messages: KimiRequestMessage[] = [
    { role: "system", content: getSystemContent() },
    ...baseMessages,
  ];

  const postCompletion = async (payload: Record<string, unknown>) => {
    if (moonshotCompletions) {
      return moonshotCompletions(payload);
    }
    if (!apiKey) {
      throw new Error("Missing Moonshot credentials");
    }
    return fetch(MOONSHOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  };

  let rounds = 0;
  while (rounds < maxToolRounds) {
    rounds += 1;
    messages[0] = { role: "system", content: getSystemContent() };
    const response = await postCompletion(
      requestBodyForModel(model, {
        model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.6,
        max_tokens: 16384,
      })
    );

    if (!response.ok) {
      let detail = `${response.status}`;
      try {
        const errData = (await response.json()) as {
          error?: string | { message?: string };
        };
        if (errData?.error === "agent_quota_exceeded") {
          throw new AgentQuotaExceededError();
        }
        detail =
          typeof errData.error === "object" && errData.error?.message
            ? errData.error.message
            : typeof errData.error === "string"
              ? errData.error
              : JSON.stringify(errData);
      } catch (e) {
        if (e instanceof AgentQuotaExceededError) throw e;
        /* ignore */
      }
      throw new Error(detail);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const msg = choice?.message as KimiAssistantMessage | undefined;
    if (!msg) {
      throw new Error("Empty model response");
    }

    const toolCalls = msg.tool_calls;
    if (!toolCalls?.length) {
      const text = msg.content?.trim() ?? "";
      return text || "(模型未返回文本)";
    }

    const assistantEcho: KimiAssistantMessage = {
      role: "assistant",
      content: msg.content,
      tool_calls: toolCalls,
    };
    const rawMsg = choice.message as KimiAssistantMessage & Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(rawMsg, "reasoning_content")) {
      const rc = rawMsg.reasoning_content;
      assistantEcho.reasoning_content = rc == null ? "" : String(rc);
    }
    messages.push(assistantEcho);

    for (const tc of toolCalls) {
      const name = tc.function?.name ?? "";
      const args = tc.function?.arguments ?? "{}";
      let result: string;
      try {
        result = await executeTool(name, args);
      } catch (e) {
        result = JSON.stringify({
          error: e instanceof Error ? e.message : String(e),
        });
      }
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }
  }

  throw new Error("Tool loop limit exceeded");
}
