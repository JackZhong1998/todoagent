/** OpenAI/Kimi-compatible tool definitions for chat completions. */

export const KIMI_WEB_SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "web_search",
    description:
      "Search the public web via Brave Search. Only use when the user has enabled web search or clearly needs fresh external facts/news/docs. Returns titles, URLs, and short snippets.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query in the user's language or English.",
        },
      },
      required: ["query"],
    },
  },
} as const;

const KIMI_FETCH_AND_SKILL_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "fetch_url",
      description:
        "Fetch a single public http(s) page and return readable text/markdown content. Use for reading docs, articles, or GitHub raw files. Do not use for private or authenticated URLs.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Full URL including https://",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "import_skill_from_url",
      description:
        "Download text/markdown from a URL (e.g. GitHub raw SKILL.md) and save it as a Skill document in the user's current project. The skill is attached to this conversation so instructions apply to follow-up messages. Use when the user provides a skill link or asks to import a skill.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Direct URL to the skill file (prefer raw GitHub or plain .md URL).",
          },
        },
        required: ["url"],
      },
    },
  },
] as const;

/** 含联网搜索；仅在用户打开「搜索」开关时传给模型。 */
export const KIMI_AGENT_TOOLS = [KIMI_WEB_SEARCH_TOOL, ...KIMI_FETCH_AND_SKILL_TOOLS] as const;

/** 不含 web_search；默认使用，避免每次对话都触发检索。 */
export const KIMI_AGENT_TOOLS_WITHOUT_WEB_SEARCH = [...KIMI_FETCH_AND_SKILL_TOOLS] as const;

export type KimiAgentToolDefinition =
  | (typeof KIMI_WEB_SEARCH_TOOL)
  | (typeof KIMI_FETCH_AND_SKILL_TOOLS)[number];

function webSearchPromptBlock(): string {
  return `- web_search：联网搜索公开网页，获取摘要与链接。
`;
}

const AGENT_TOOLS_BASE_PROMPT = `你可以使用下列工具（function calling）：
WEB_SEARCH_LINE
- fetch_url：读取单个公开网页的正文（适合文档、文章、GitHub raw）。
- import_skill_from_url：把远程 Markdown/文本保存为当前项目的「Skill」文档，并绑定到本对话；之后系统会把该 Skill 全文注入上下文，请按其中流程与约束协助用户。

规则：
RULES_WEB_SEARCH
- 需要读网页全文时用 fetch_url。
- 用户给出 skill 链接或明确要求导入 skill 时用 import_skill_from_url。
- 工具失败时向用户简要说明原因，不要编造工具结果。
WEB_SEARCH_JSON_RULE`;

export function buildAgentToolsSystemPrompt(options: { webSearch: boolean }): string {
  const { webSearch } = options;
  if (webSearch) {
    return AGENT_TOOLS_BASE_PROMPT.replace("WEB_SEARCH_LINE", webSearchPromptBlock())
      .replace(
        "RULES_WEB_SEARCH",
        "- 仅在确实需要时效信息、外部事实或用户明确要查资料时调用 web_search；能凭已有上下文回答则不要搜索。"
      )
      .replace(
        "WEB_SEARCH_JSON_RULE",
        `- **web_search 返回的 JSON 里若 ok 为 true 且 results 数组有内容，必须根据 results 用中文总结并引用标题/链接；禁止再说「搜索不可用」「搜索功能暂时无法使用」等。仅当 ok 为 false 或 results 为空时，才可说明未搜到或接口报错。**`
      );
  }
  return AGENT_TOOLS_BASE_PROMPT.replace("WEB_SEARCH_LINE", "")
    .replace(
      "RULES_WEB_SEARCH",
      "- 当前对话未启用联网搜索：不要用 web_search；如需实时资讯请直接提示用户在输入框下方打开「联网搜索」。"
    )
    .replace("WEB_SEARCH_JSON_RULE", "");
}

/** @deprecated 使用 buildAgentToolsSystemPrompt({ webSearch: true }) */
export const AGENT_TOOLS_SYSTEM_PROMPT = buildAgentToolsSystemPrompt({ webSearch: true });
