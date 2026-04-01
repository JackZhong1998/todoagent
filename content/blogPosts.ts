import type { Language } from '../i18n/locales';

export type BlogPostLocale = {
  title: string;
  summary: string;
  readingTime: string;
  content: string[];
};

export type BlogPost = {
  id: string;
  slug: string;
  publishedAt: string;
  zh: BlogPostLocale;
  en: BlogPostLocale;
};

export const blogPosts: BlogPost[] = [
  {
    id: 'attention-workflow-j-plan',
    slug: 'awf-s4x3',
    publishedAt: '2026-03-30',
    zh: {
      title: 'Attention 工作法：如何用 TodoAgent 实现上四休三',
      summary: '把注意力管理和待办协作结合起来，用两周建立一个可持续迭代的个人执行系统。',
      readingTime: '6 分钟',
      content: [
        'TodoAgent 的核心不是把任务写得更漂亮，而是把注意力切片和上下文沉淀结合起来。你不再只是在勾选任务，而是在记录自己和 Agent 如何协作做成事情。',
        '第一周建议只做三件事：固定每天 2 次回顾、所有任务都写清楚下一步动作、每个任务都补充上下文。这样可以让 Agent 在下一次协作时理解你的真实状态。',
        '第二周开始引入节奏实验：把高强度任务压缩到 4 天，保留 3 天做恢复、总结和学习。关键点是每个任务结束后都要留下可复用的知识片段。',
        '两周之后你会得到一套真正可持续的工作系统：任务不再越积越乱，AI 协作效率也会随着上下文资产积累而持续提升。',
      ],
    },
    en: {
      title: 'Attention Workflow: Using TodoAgent to Move Toward a 4-Day Week',
      summary:
        'Pair attention management with collaborative todos to build a personal execution system you can sustain and improve in about two weeks.',
      readingTime: '6 min',
      content: [
        'TodoAgent is not about writing prettier tasks—it is about slicing attention and compounding context. You are not only checking boxes; you are recording how you and your Agent actually get things done.',
        'In week one, do only three things: review twice a day on a fixed rhythm, write every task as a clear next physical or digital action, and attach enough context that your Agent can read your real state next time.',
        'In week two, run a rhythm experiment: compress high-intensity work into four days and reserve three for recovery, synthesis, and learning. After each task, leave a small, reusable knowledge snippet.',
        'After two weeks you should have a system that survives real life: the list stops rotting, and AI collaboration improves as context assets stack week over week.',
      ],
    },
  },
  {
    id: 'agent-collaboration-pattern',
    slug: 'acp-5p',
    publishedAt: '2026-03-25',
    zh: {
      title: '和 Agent 紧密协作的 5 个实践',
      summary: '从需求拆解到结果复盘，5 个可直接套用的协作模式，帮助你把 AI 从工具变成队友。',
      readingTime: '5 分钟',
      content: [
        '第一，先给 Agent 明确的工作边界。任务目标、验收标准、上下文来源缺一不可。',
        '第二，任务拆成半天内能完成的小闭环。闭环越短，协作反馈越快。',
        '第三，每次交互都补一段「为什么这么做」的说明，这能显著提升后续连续协作质量。',
        '第四，建立你的个人提示模板库，把高频场景标准化；第五，复盘失败案例，把问题映射回上下文缺口，而不是只怪模型表现。',
      ],
    },
    en: {
      title: 'Five Practices for Working Closely With Your Agent',
      summary:
        'From scoping to retrospectives—five reusable patterns that help you turn AI from a tool into a teammate.',
      readingTime: '5 min',
      content: [
        'First, give the Agent a clear boundary: goal, definition of done, and where context lives. If any of these is missing, you are asking for generic answers.',
        'Second, size tasks into half-day loops. Shorter loops mean faster feedback and less drift between what you intended and what the model assumed.',
        'Third, add one line of rationale each time—why this approach, what you already tried, what would count as success. That single habit dramatically improves follow-up turns.',
        'Fourth, maintain a small library of prompt templates for recurring scenarios. Fifth, when something fails, map it back to a context gap instead of blaming the model’s “personality.”',
      ],
    },
  },
  {
    id: 'context-asset-method',
    slug: 'tca-method',
    publishedAt: '2026-03-18',
    zh: {
      title: '把 ToDo 变成 Context 资产',
      summary: '任务完成后如何积累可复用 context，让下一次执行更快、更稳、更有质量。',
      readingTime: '7 分钟',
      content: [
        '很多人使用待办系统时只关注「做完没」，而忽略「为什么做、怎么做、下次怎么更快做」。',
        'TodoAgent 的方式是把每个任务视为一次知识生产：任务目标、关键决策、踩坑记录、最终结果，这四项就是最小 context 单元。',
        '当 context 形成资产，你会看到两个变化：一是 Agent 对你的偏好理解越来越准；二是你自己做决策的速度越来越快。',
        '长期来看，任务清单不再只是执行列表，而是你和 Agent 共同维护的「工作记忆系统」。',
      ],
    },
    en: {
      title: 'Turn Your To-Do List Into a Context Asset',
      summary:
        'After each task, capture reusable context so the next execution is faster, calmer, and higher quality.',
      readingTime: '7 min',
      content: [
        'Most todo systems optimize for “done or not done” and skip why it mattered, how it was executed, and how to do it faster next time.',
        'TodoAgent treats every task as a tiny knowledge artifact: goal, key decisions, pitfalls, and outcome. That foursome is the smallest useful context unit.',
        'When context compounds, two things happen: the Agent aligns better with your taste and constraints, and you make decisions faster because the reasoning is already on the page.',
        'Over time, the list stops being a pile of chores and becomes shared working memory between you and your Agent.',
      ],
    },
  },
  {
    id: 'task-briefs-for-agents',
    slug: 'task-briefs-for-agents',
    publishedAt: '2026-04-01',
    zh: {
      title: '怎么写「Agent 读得懂」的任务 Brief',
      summary: '好的任务描述 = 目标 + 约束 + 已有材料 + 验收标准；四段式模板直接套用。',
      readingTime: '6 分钟',
      content: [
        '模型不会读心。若标题只有「搞定报表」，Agent 只能猜格式、周期和受众。把 Brief 想成给新同事的交接页：对方不知道你的历史，只能靠文字。',
        '建议固定四块：① 目标（要解决什么问题）；② 约束（时间、工具、合规、不能动的部分）；③ 材料（链接、文件、相关任务 ID）；④ 验收标准（怎样算完成）。',
        '上下文不是越长越好，而是「刚好够决策」。优先贴结论、决策记录和反例；背景故事可以折叠成两三句或单独文档。',
        '在 TodoAgent 里，Brief 会随任务留存并与对话串联。下次同类任务出现时，你可以引用旧 Brief，让 Agent 从稳定格式起步而不是从零推断。',
      ],
    },
    en: {
      title: 'Writing Task Briefs Your Agent Can Actually Use',
      summary:
        'A strong brief = goal, constraints, inputs, and a definition of done—a four-part template you can paste into every task.',
      readingTime: '6 min',
      content: [
        'Models cannot read minds. A title like “fix the report” leaves format, cadence, and audience undefined. Treat the brief like a handoff to a new teammate who only sees what you wrote.',
        'Use four blocks: goal (what problem you are solving), constraints (time, tools, compliance, non-negotiables), inputs (links, files, related task IDs), and acceptance criteria (what “done” looks like).',
        'Context should be “just enough to decide,” not a novel. Lead with conclusions, decisions, and counterexamples; move long backstory into a doc and link it.',
        'In TodoAgent, the brief stays with the task and threads into chat. Next time you run a similar task, you can point the Agent at an old brief and start from a stable shape instead of cold inference.',
      ],
    },
  },
  {
    id: 'review-cadence-llm',
    slug: 'review-cadence-llm',
    publishedAt: '2026-03-28',
    zh: {
      title: '与 LLM 共事的复盘节奏：日纪要、周复盘怎么设',
      summary: '用轻量日纪要把上下文喂给 Agent；用周复盘做「模式扫描」，避免只在赶工时对话。',
      readingTime: '7 分钟',
      content: [
        '和人对齐靠会议，和 Agent 对齐靠文字节奏。没有固定复盘，模型只能看到碎片提问，很难理解你的优先级变化。',
        '日纪要可以很短：今天完成了什么、卡在哪里、明天第一条动作是什么。关键是写进任务或全局对话里，让 Agent 在次日接续时不必重新采访你。',
        '周复盘做三件事：清点未闭环任务、标出重复性工作（是否值得模板化）、记录一条「下周要避开的坑」。这条记录会成为下一周 Brief 的默认前缀。',
        'TodoAgent 把待办、文档和对话放在同一工作区里，复盘时可以从列表跳到原文再跳回对话，减少复制粘贴。节奏比篇幅重要——能坚持每天五句，胜过每周一篇长文却从不回看。',
      ],
    },
    en: {
      title: 'A Review Cadence for Human–LLM Teams',
      summary:
        'Use a light daily note to feed context to your Agent, and a weekly retro for pattern scanning—so collaboration is not only firefighting.',
      readingTime: '7 min',
      content: [
        'Humans align in meetings; Agents align through written rhythm. Without a cadence, the model only sees scattered prompts and misses how your priorities shifted.',
        'Keep the daily note tiny: what shipped, where you were blocked, and the first action tomorrow. Store it on the task or in global chat so the next session continues instead of re-interviewing you.',
        'Weekly retro: close open loops, flag repetitive work (template candidates), and write one “do-not-repeat” line for next week. That line becomes the default prefix for new briefs.',
        'TodoAgent keeps todos, docs, and chat in one workspace, so reviews can jump from list to source to thread without copy-paste theater. Consistency beats length—a five-sentence daily habit beats a weekly essay you never reopen.',
      ],
    },
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find((post) => post.slug === slug);
};

/** 按发布日期倒序（最新在前） */
export const getBlogPostsSorted = (): BlogPost[] => {
  return [...blogPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
};

export const pickBlogLocale = (post: BlogPost, language: Language): BlogPostLocale => {
  return post[language];
};
