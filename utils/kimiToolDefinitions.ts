/** OpenAI/Kimi-compatible tool definitions for chat completions. */

export const KIMI_AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description:
        "Search the public web via Brave Search. Use for fresh facts, news, documentation URLs, or when the user asks what something is. Returns titles, URLs, and short snippets.",
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
  },
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

export type KimiAgentToolDefinition = (typeof KIMI_AGENT_TOOLS)[number];

export const AGENT_TOOLS_SYSTEM_PROMPT = `你可以使用下列工具（function calling）：
- web_search：联网搜索公开网页，获取摘要与链接。
- fetch_url：读取单个公开网页的正文（适合文档、文章、GitHub raw）。
- import_skill_from_url：把远程 Markdown/文本保存为当前项目的「Skill」文档，并绑定到本对话；之后系统会把该 Skill 全文注入上下文，请按其中流程与约束协助用户。

规则：
- 需要时效性或外部事实时优先 web_search；需要读全文再用 fetch_url。
- 用户给出 skill 链接或明确要求导入 skill 时用 import_skill_from_url。
- 工具失败时向用户简要说明原因，不要编造工具结果。
- **web_search 返回的 JSON 里若 ok 为 true 且 results 数组有内容，必须根据 results 用中文总结并引用标题/链接；禁止再说「搜索不可用」「搜索功能暂时无法使用」等。仅当 ok 为 false 或 results 为空时，才可说明未搜到或接口报错。**`;
