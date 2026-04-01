import type { Language } from '../i18n/locales';

/** 程序化 SEO：人群/场景页（Persona playbook），中英双语、独立摘要与段落，避免薄内容。 */
export type PseoLocaleBlock = {
  pageTitle: string;
  metaDescription: string;
  cardTeaser: string;
  h1: string;
  audience: string;
  frictions: [string, string, string];
  productIntro: string;
  productBullets: [string, string, string];
  loopSteps: [string, string, string];
  faq: [{ q: string; a: string }, { q: string; a: string }];
};

export type PseoPersona = {
  slug: string;
  updatedAt: string;
  /** 内链：相关场景（须为已存在 slug） */
  relatedSlugs: [string, string, string];
  zh: PseoLocaleBlock;
  en: PseoLocaleBlock;
};

export const pseoPersonas: PseoPersona[] = [
  {
    slug: 'software-engineers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['product-managers', 'data-analysts', 'engineering-managers'],
    zh: {
      pageTitle: '面向软件工程师的 AI 待办与 Agent 协作 | TodoAgent',
      metaDescription:
        '用 TodoAgent 把 issue、PR 与上下文收进可执行待办：任务级对话、文档与复盘闭环，适合高频使用 LLM 的工程同学。',
      cardTeaser: '把分支、评审与上下文从聊天窗口拽回可追踪的待办闭环。',
      h1: '软件工程师如何用 TodoAgent 稳住交付节奏',
      audience:
        '你经常在 IDE、Issue、文档和模型窗口之间切换，需要把「下一步动作」写清楚，并把决策理由留给未来的自己和 Agent。',
      frictions: [
        '任务标题只有动词，没有验收标准，Agent 下次只能瞎猜。',
        '上下文散落在 Slack / PR 评论里，复盘时拼不起来。',
        '同一天被多个需求打断，注意力切片没有记录，周一看不懂上周在忙什么。',
      ],
      productIntro:
        'TodoAgent 以待办为轴心，把「下一步」与材料绑在一起；任务级对话保留决策过程，全局对话承接跨任务的节奏。',
      productBullets: [
        '每个任务可挂文档与历史对话，减少重复解释架构约束。',
        '完成闭环后可做结构化分析，帮助你判断哪些工作更适合人机分工。',
        '两周内用固定回顾节奏，把「写完代码」扩展成「写完代码 + 可复用上下文」。',
      ],
      loopSteps: [
        '开工前写清下一步动作与验收，并贴上相关 issue / 设计链接。',
        '执行中用任务对话追问实现细节；结论留在任务侧，避免只存在会话里。',
        '合并或发版后做一次一句话复盘：踩坑、约束、下次复用点。',
      ],
      faq: [
        {
          q: '和只用来「问代码」的 Chat 有什么不同？',
          a: 'TodoAgent 强调任务与上下文的绑定：同样的问题下次从任务卡片开始，而不是从零复述背景。',
        },
        {
          q: '适合团队还是个人？',
          a: '当前工作区以个人执行为主；你可以把输出整理成团队文档，再链回任务作为单一事实来源。',
        },
      ],
    },
    en: {
      pageTitle: 'AI To-Do & Agent Collaboration for Software Engineers | TodoAgent',
      metaDescription:
        'Ship faster with task-scoped context: bind next actions to issues, docs, and chat history—built for engineers who already live in LLMs.',
      cardTeaser: 'Pull branches, reviews, and context out of chat threads into trackable execution loops.',
      h1: 'How software engineers use TodoAgent to stabilize delivery',
      audience:
        'You jump between IDE, issues, docs, and model tabs. You need crisp next actions and a paper trail of decisions for Future You—and your Agent.',
      frictions: [
        'Task titles are verbs without acceptance criteria, so the model guesses next time.',
        'Context lives in Slack and PR comments and does not survive a weekly review.',
        'Context switching erodes attention slices; by Monday you cannot reconstruct the week.',
      ],
      productIntro:
        'TodoAgent anchors work on todos, binds materials to the next action, and keeps task chat where decisions belong—while global chat carries cross-task rhythm.',
      productBullets: [
        'Attach docs and prior threads per task to stop re-explaining architecture constraints.',
        'Structured analysis after completion helps you see what work is a strong human–Agent split.',
        'A two-week cadence turns “shipped code” into “shipped code plus reusable context.”',
      ],
      loopSteps: [
        'Before coding, write the next action and acceptance, link the issue or design note.',
        'Use task chat for implementation Q&A; keep conclusions on the task, not only in the session.',
        'After merge or release, add a one-line retro: pitfalls, constraints, reusable takeaway.',
      ],
      faq: [
        {
          q: 'How is this different from a coding chat?',
          a: 'TodoAgent binds prompts to tasks so the next session starts from the card—not from zero context.',
        },
        {
          q: 'Is this for teams or individuals?',
          a: 'The workspace is individual-first; you can still publish summaries to team docs and link back as the source of truth.',
        },
      ],
    },
  },
  {
    slug: 'product-managers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['software-engineers', 'product-designers', 'founders'],
    zh: {
      pageTitle: '产品经理的 AI 待办：需求、评审与上下文一条线 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理 PRD 切片、评审待办与跨团队跟进：每条任务带决策与链接，Agent 协助对齐优先级与下一步。',
      cardTeaser: '把需求切片、决策与跟进写成可协作的待办，而不是散落的会议纪要。',
      h1: '产品经理如何用 TodoAgent 串起需求与执行',
      audience:
        '你要在目标、范围、风险和研发节奏之间翻译，常常同时推进多个主题，需要一条能看见「为什么现在做这一步」的主线。',
      frictions: [
        '会议纪要很长，但可执行项和决策没有进系统。',
        '同一个主题在多工具里改名，搜索不到历史判断。',
        '临时插入的需求打断主线，没有记录打断原因与回滚点。',
      ],
      productIntro:
        'TodoAgent 让你把「可交付下一步」写进待办，并把 PRD、数据链接、讨论摘要附在任务上；对话沉淀后仍可被下一次规划引用。',
      productBullets: [
        '用任务对话快速打磨用户故事与验收，结论回写到任务正文。',
        '全局对话适合周节奏与优先级复盘，不与单需求细节搅在一起。',
        '固定回顾把「本周推什么」与「上周卡在哪」对齐，减少重复对齐会。',
      ],
      loopSteps: [
        '拆需求时每个主题至少一个「下一步」任务，并写清依赖与风险一句。',
        '评审后把变更点写进对应任务，而不是只留在会议录屏里。',
        '周五用 15 分钟清点未闭环项，把上下文补丁打给下周一的自己。',
      ],
      faq: [
        { q: '能替代项目管理工具吗？', a: '更偏个人与 Agent 的执行与上下文系统；可与看板类工具并行，TodoAgent 负责「想清楚下一步」与沉淀。' },
        { q: '适合敏捷迭代吗？', a: '适合把迭代内的决策与动作显式化；节奏模板可按你的 sprint 习惯微调。' },
      ],
    },
    en: {
      pageTitle: 'AI To-Do for Product Managers: Specs, Reviews, and Context | TodoAgent',
      metaDescription:
        'Run PRD slices, review follow-ups, and cross-team tracking in one execution layer—each task carries decisions, links, and Agent-ready context.',
      cardTeaser: 'Turn specs, decisions, and follow-ups into collaborative todos—not lost meeting notes.',
      h1: 'How product managers use TodoAgent to connect intent and execution',
      audience:
        'You translate goals, scope, risk, and engineering cadence. You juggle multiple themes and need a visible line of “why this next step now.”',
      frictions: [
        'Meetings generate noise; actionable items and decisions never enter a system.',
        'The same initiative renames across tools, so historical rationale is unsearchable.',
        'Interrupt-driven work erases the main thread unless you log why you paused.',
      ],
      productIntro:
        'TodoAgent makes the shippable next step explicit, attaches PRDs, data links, and discussion snippets, and keeps chat residue referenceable for the next planning pass.',
      productBullets: [
        'Task chat sharpens stories and acceptance; conclusions land back on the task body.',
        'Global chat holds weekly rhythm and priority retros without mixing spec detail.',
        'Short Friday reviews align “what ships next” with “where we stalled.”',
      ],
      loopSteps: [
        'When splitting work, give each theme at least one next-action task with dependency and risk in one line.',
        'After reviews, update the relevant tasks—do not leave changes only in recordings.',
        'Spend fifteen minutes closing loops and patching context for Monday-you.',
      ],
      faq: [
        { q: 'Does this replace PM software?', a: 'It complements boards—TodoAgent focuses on crisp next actions and compounding context with your Agent.' },
        { q: 'Does it fit agile sprints?', a: 'Yes: make in-sprint decisions and actions explicit; tune the cadence to your sprint length.' },
      ],
    },
  },
  {
    slug: 'founders',
    updatedAt: '2026-04-01',
    relatedSlugs: ['product-managers', 'indie-hackers', 'sales-professionals'],
    zh: {
      pageTitle: '创始人的 AI 待办：战略切片与执行闭环 | TodoAgent',
      metaDescription:
        'TodoAgent 帮助创始人在融资、产品、招聘之间切换时仍保留上下文：每条任务可对话、可复盘，Agent 协助整理优先级与下一步。',
      cardTeaser: '在多条战线之间切换时，不让决策与上下文只活在脑子里。',
      h1: '创始人如何用 TodoAgent 管理多线程工作',
      audience:
        '你同时盯产品方向、现金流、招聘与对外沟通，时间被切碎，需要低成本记录「当时为什么这样选」。',
      frictions: [
        '重要决定只在口头对齐，没有可检索记录。',
        '每天被紧急事项驱动，战略任务反复延期却无解释。',
        '和 Advisor / 合伙人沟通后，行动项没有统一落点。',
      ],
      productIntro:
        'TodoAgent 用待办承接「下一步」，用任务与全局对话分层：战术在执行任务里，节奏与优先级在全局里周更。',
      productBullets: [
        '把投资人/客户反馈拆成可执行任务，并保留原话摘要避免失真。',
        '用固定回顾把「本周唯一主线」写出来，降低隐性多任务成本。',
        'Agent 协助把模糊焦虑改写成可验证的下一步，而不是空泛 brainstorm。',
      ],
      loopSteps: [
        '周一写三条：本周主线、最大风险、一个必须完成的里程碑。',
        '紧急插入时新增一条「打断记录」任务，一句话说明暂停原因。',
        '周日 20 分钟复盘：关闭项、延期项、需要他人输入的阻塞。',
      ],
      faq: [
        { q: '会不会增加管理负担？', a: '默认模板很短；负担来自「想清楚下一步」，TodoAgent 只是把这一步显式化并留痕。' },
        { q: '敏感信息怎么办？', a: '任务描述建议写摘要与决策点，涉密原文放自有存储并在任务里链过去。' },
      ],
    },
    en: {
      pageTitle: 'Founders: AI To-Do for Strategy Slices and Execution Loops | TodoAgent',
      metaDescription:
        'Switch between fundraising, product, and hiring without losing rationale—tasks carry chat, links, and retros so your Agent can help reprioritize.',
      cardTeaser: 'When you context-switch across fronts, stop storing decisions only in your head.',
      h1: 'How founders use TodoAgent to run multi-threaded work',
      audience:
        'You balance product direction, cash, hiring, and external comms. Time fragments; you still need cheap, searchable records of why you chose a path.',
      frictions: [
        'Key calls happen verbally with no durable artifact.',
        'Urgent work starves strategy tasks with no logged explanation.',
        'After advisor sessions, action items scatter across channels.',
      ],
      productIntro:
        'TodoAgent holds next actions in todos and separates layers: tactics live on tasks; weekly rhythm and priorities live in global chat.',
      productBullets: [
        'Turn investor or customer feedback into executable tasks with faithful summaries.',
        'Force-rank “the one main thread this week” during review to cut hidden multitasking.',
        'Use the Agent to rewrite vague anxiety into testable next steps—not endless brainstorming.',
      ],
      loopSteps: [
        'Monday: main thread, top risk, one milestone that must land.',
        'When interrupted, add a one-line “pause note” task explaining what yielded.',
        'Sunday: twenty minutes—closed, slipped, blocked-by-others.',
      ],
      faq: [
        { q: 'Will this add overhead?', a: 'Templates stay tiny; the real work is clarifying the next step—TodoAgent just makes it explicit and traceable.' },
        { q: 'What about sensitive info?', a: 'Keep summaries and decisions on the task; link out to secure storage for raw material.' },
      ],
    },
  },
  {
    slug: 'content-writers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['growth-marketers', 'freelancers', 'academic-researchers'],
    zh: {
      pageTitle: '内容创作者的 AI 待办：选题、素材与改稿闭环 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理选题、采访笔记与改稿任务；每条内容一条任务线，Agent 协助梳理结构与事实核对清单。',
      cardTeaser: '把选题、素材、版本和反馈从文件夹命名里解放出来。',
      h1: '内容创作者如何用 TodoAgent 管一整条生产线',
      audience:
        '你同时有多篇稿子、多个客户或栏目，版本与反馈分散，需要知道「这一版卡在谁、缺什么材料」。',
      frictions: [
        '素材在五个标签页里，写作时反复搜索。',
        '编辑反馈散落在邮件，难以映射到具体段落。',
        '截稿前才发现事实核对没做，只能熬夜补洞。',
      ],
      productIntro:
        'TodoAgent 建议「一篇稿 = 一条主线任务 + 子动作」：大纲、采访、初稿、事实核对、终稿各为清晰下一步，对话里留下结构讨论。',
      productBullets: [
        '任务级对话适合拆大纲与改段落；全局对话管本周产出与档期。',
        '把编辑意见摘成检查清单任务，避免遗漏第二轮修改。',
        '完成后沉淀「风格与禁区」笔记，下一篇同栏目启动更快。',
      ],
      loopSteps: [
        '开稿前写清受众、论点一句、必须包含的事实来源链接。',
        '每轮修改新建或更新子任务：谁反馈、截止、是否阻塞发布。',
        '定稿后写 3 条可复用经验：标题套路、结构偏好、要避免的雷区。',
      ],
      faq: [
        { q: '适合长视频脚本吗？', a: '适合；把分镜/脚本章节拆成子任务即可，同理可用于 newsletter 多区块写作。' },
        { q: '会和笔记软件重复吗？', a: '笔记存原文，TodoAgent 管「下一步与决策」；二者链在一起最稳。' },
      ],
    },
    en: {
      pageTitle: 'Content Writers: AI To-Do for Ideas, Research, and Edits | TodoAgent',
      metaDescription:
        'Run pitches, research notes, and revision work as executable tasks—each piece gets its own thread, with Agent help on outlines and fact-check lists.',
      cardTeaser: 'Stop losing drafts, sources, and feedback inside folder names and tabs.',
      h1: 'How content writers use TodoAgent to run a production line',
      audience:
        'You juggle multiple pieces, clients, or columns. Versions and comments scatter; you need to know what blocks shipping for each draft.',
      frictions: [
        'Sources live across tabs; writing becomes archaeology.',
        'Editor notes in email do not map cleanly to paragraphs.',
        'Fact checks surface on deadline eve.',
      ],
      productIntro:
        'Treat one piece as one spine task plus child actions: outline, interviews, draft, fact check, final—each a crisp next step; structure debates stay in task chat.',
      productBullets: [
        'Task chat for outlines and line edits; global chat for weekly output and deadlines.',
        'Turn feedback into checklist tasks so second-pass edits do not slip.',
        'After publish, capture style guardrails to accelerate the next similar piece.',
      ],
      loopSteps: [
        'Before drafting: audience, one-line thesis, must-cite sources linked.',
        'Each revision round: who commented, due date, publish blockers explicit.',
        'On ship: three reusable notes—title patterns, structure preference, avoid list.',
      ],
      faq: [
        { q: 'Does it work for video scripts?', a: 'Yes—segment scenes or beats into sub-tasks; same pattern for multi-block newsletters.' },
        { q: 'Isn’t this what notes apps do?', a: 'Notes hold prose; TodoAgent holds next actions and decisions—link both for a durable system.' },
      ],
    },
  },
  {
    slug: 'academic-researchers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['students', 'content-writers', 'consultants'],
    zh: {
      pageTitle: '科研工作者的 AI 待办：文献、实验与写作切片 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理文献阅读、实验步骤与论文修订任务；任务绑定 PDF 与笔记链接，Agent 协助整理方法与下一步。',
      cardTeaser: '让「下一篇要读什么、下一个实验动作是什么」永远可追踪。',
      h1: '科研工作者如何用 TodoAgent 降低项目漂移',
      audience:
        '你的项目周期长，并行的课题与审稿意见多，需要把方法细节和待办对齐，而不是只存在实验记录本边缘。',
      frictions: [
        '读文献没有停损点，永远在「再多看一篇」。',
        '实验步骤口头交接，复现实验要翻聊天记录。',
        '审稿意见 30 条，不知道哪条对应哪一节修改。',
      ],
      productIntro:
        'TodoAgent 把「下一步科研动作」写成任务：读哪篇、跑哪组对照、改哪一节；对话里可草稿回复审稿人，再拆成子任务。',
      productBullets: [
        '任务挂方法段落与数据路径，减少实验室协作摩擦。',
        '全局对话做月度进度与课题优先级，不与单篇论文细节混杂。',
        '用复盘把失败实验的可复用结论记下来，避免重复踩坑。',
      ],
      loopSteps: [
        '每周为每个课题设一个「当前瓶颈」任务，只允许一个主阻塞描述。',
        '文献任务写清退出条件：例如「回答 X 问题或读完 Y 篇综述」。',
        '审稿逐条映射到任务或子任务，合并修改时再关单。',
      ],
      faq: [
        { q: '会替代 Reference Manager 吗？', a: '不替代；文献元数据仍在 Zotero 等工具，TodoAgent 管执行顺序与上下文。' },
        { q: '适合合作者众多的大项目吗？', a: '适合个人工作流与本地上下文；团队可共享规范，各自待办仍建议个人维护。' },
      ],
    },
    en: {
      pageTitle: 'Researchers: AI To-Do for Papers, Experiments, and Revisions | TodoAgent',
      metaDescription:
        'Track reading goals, experimental next steps, and revision tasks—bind PDFs and lab notes to todos, with Agent help structuring methods and replies.',
      cardTeaser: 'Always know the next paper to read and the next bench action to take.',
      h1: 'How academic researchers use TodoAgent to reduce project drift',
      audience:
        'Your timelines are long, with parallel threads and reviewer letters. Method details must align with actions—not only margin notes in a notebook.',
      frictions: [
        'Literature reviews lack stopping rules; you “just one more paper” forever.',
        'Bench handoffs live in chat, hurting reproducibility.',
        'Thirty reviewer comments with no mapping to sections.',
      ],
      productIntro:
        'Make the next research action explicit: which paper, which contrastive run, which section to rewrite. Draft reviewer responses in chat, then split into sub-tasks.',
      productBullets: [
        'Attach method paragraphs and data paths to tasks to cut lab friction.',
        'Use global chat for monthly progress and theme priority—not paper minutiae.',
        'Log failed-run lessons as reusable context to avoid repeating mistakes.',
      ],
      loopSteps: [
        'Each week, one “current bottleneck” task per project with a single main blocker.',
        'Reading tasks include exit criteria: answer question X or finish survey Y.',
        'Map each review bullet to a task; close them when edits merge.',
      ],
      faq: [
        { q: 'Does this replace reference managers?', a: 'No—keep Zotero et al. for metadata; TodoAgent owns execution order and working context.' },
        { q: 'Big collaborations?', a: 'Great for personal execution; teams can share conventions while keeping individual boards of work.' },
      ],
    },
  },
  {
    slug: 'consultants',
    updatedAt: '2026-04-01',
    relatedSlugs: ['founders', 'operations-leads', 'freelancers'],
    zh: {
      pageTitle: '咨询顾问的 AI 待办：客户项目与交付切片 | TodoAgent',
      metaDescription:
        '多客户并行时用 TodoAgent 分离上下文：每个交付包一条任务树，Agent 协助整理访谈摘要与建议书大纲。',
      cardTeaser: '客户一多，用任务边界防止上下文串台。',
      h1: '咨询顾问如何用 TodoAgent 管理多客户交付',
      audience:
        '你同时服务多个客户，信息敏感，需要严格边界，又要把每次访谈与结论沉淀成可复用模块。',
      frictions: [
        'A 客户的术语被写进 B 客户的草案。',
        '交付里程碑很多，但缺少「本周唯一必须完成」的硬任务。',
        '复盘只发生在脑子里，下个项目仍从零写建议结构。',
      ],
      productIntro:
        'TodoAgent 用项目或任务命名约定分隔客户上下文；任务对话生成草案结构，结论回写任务，减少复制粘贴错误。',
      productBullets: [
        '全局对话只谈你自己的方法论升级，不谈单客户细节。',
        '把每次访谈的「三点洞察」写成固定格式，便于后续合成报告。',
        '用周回顾统计时间去向，识别被低估的隐性沟通成本。',
      ],
      loopSteps: [
        '每个客户至少一个「本周承诺」任务，避免只有长期清单。',
        '访谈后 10 分钟内写任务：事实、矛盾点、待验证假设。',
        '交付前跑一遍检查清单：术语表、数据口径、与客户目标对齐句。',
      ],
      faq: [
        { q: '合规与客户保密怎么注意？', a: '任务里写摘要与结论级描述，涉密数据放客户指定环境，仅用链接引用。' },
        { q: '适合固定 retainer 吗？', a: '适合；用循环任务模板覆盖周期性汇报与数据拉取。' },
      ],
    },
    en: {
      pageTitle: 'Consultants: AI To-Do for Multi-Client Delivery | TodoAgent',
      metaDescription:
        'Isolate contexts across clients—each deliverable becomes a task tree with chat, summaries, and Agent-assisted outlines without cross-talk.',
      cardTeaser: 'When client count grows, hard task boundaries stop context bleed.',
      h1: 'How consultants use TodoAgent to run parallel engagements',
      audience:
        'You serve multiple clients with sensitive info. You need strict boundaries and reusable modules from interviews to recommendations.',
      frictions: [
        'Client A vocabulary leaks into Client B drafts.',
        'Milestones multiply without a weekly must-ship task.',
        'Retros stay mental; the next engagement still starts from a blank outline.',
      ],
      productIntro:
        'Use naming conventions to separate client contexts. Generate outline drafts in task chat, then copy conclusions back to the task to reduce paste errors.',
      productBullets: [
        'Reserve global chat for your own methodology upgrades—not client detail.',
        'After each interview, log “three insights” in a fixed format for later synthesis.',
        'Weekly review surfaces where time actually went, including hidden comms cost.',
      ],
      loopSteps: [
        'Each client gets at least one “this week’s promise” task.',
        'Within ten minutes post-call: facts, tensions, hypotheses to validate.',
        'Pre-delivery checklist: glossary, data definitions, goal-alignment sentence.',
      ],
      faq: [
        { q: 'Confidentiality?', a: 'Keep summaries and conclusions on tasks; store raw data in client-approved systems and link out.' },
        { q: 'Retainers?', a: 'Yes—use recurring task templates for periodic reporting pulls.' },
      ],
    },
  },
  {
    slug: 'product-designers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['product-managers', 'software-engineers', 'growth-marketers'],
    zh: {
      pageTitle: '产品设计师的 AI 待办：研究、方案与走查 | TodoAgent',
      metaDescription:
        '用 TodoAgent 串联用户研究结论、方案迭代与走查待办；任务挂 Figma 与洞察链接，Agent 协助整理可用性问题清单。',
      cardTeaser: '让「这一版方案卡在哪」对研发和对齐会都一目了然。',
      h1: '产品设计师如何用 TodoAgent 对齐研究与交付',
      audience:
        '你在洞察、交互、视觉与评审之间往返，需要把「待验证假设」和「已拍板决策」分开存放。',
      frictions: [
        '研究结论没有映射到具体界面改动任务。',
        '评审意见重复出现，因为上次没记决策原因。',
        '走查问题口头传达，开发排期时又要讲一遍。',
      ],
      productIntro:
        'TodoAgent 把每个设计主题拆成可执行任务：验证、改稿、走查、文档；Figma 与用研链接挂在任务上，对话记录争议点与取舍。',
      productBullets: [
        '用任务状态表达「等待用研 / 等待排期 / 可开发」，减少同步会。',
        '全局对话跟踪设计系统债务与季度目标。',
        '完成后沉淀模式库一句话，减少下次从白屏开始。',
      ],
      loopSteps: [
        '开题任务写清用户场景与成功指标一句。',
        '每次评审新增「决策」子任务：选了什么、放弃了什么、原因。',
        '上线前走查清单任务化，截图或链接附在任务描述里。',
      ],
      faq: [
        { q: '和 Figma 评论的关系？', a: '评论管像素；TodoAgent 管优先级与下一步责任，两者互补。' },
        { q: '适合设计系统维护吗？', a: '适合把组件迭代拆成独立任务线，并在全局对话里跟踪版本节奏。' },
      ],
    },
    en: {
      pageTitle: 'Product Designers: AI To-Do for Research, Specs, and QA | TodoAgent',
      metaDescription:
        'Connect research insights, iteration, and walkthrough fixes—tasks carry Figma links and notes, with Agent help turning critique into checklists.',
      cardTeaser: 'Make “where this design is stuck” obvious for eng and syncs alike.',
      h1: 'How product designers use TodoAgent to align research and delivery',
      audience:
        'You move between insights, interaction, visual, and critique. You must separate hypotheses to validate from decisions already made.',
      frictions: [
        'Research does not map to concrete UI change tasks.',
        'Feedback repeats because rationale was never logged.',
        'Walkthrough bugs travel verbally and get re-explained at sprint planning.',
      ],
      productIntro:
        'Split each design theme into actions: validate, revise, walkthrough, document. Attach Figma and research links; capture tradeoffs in chat.',
      productBullets: [
        'Task status can read “waiting on research / waiting on eng / ready to build.”',
        'Global chat tracks design-system debt and quarterly goals.',
        'After ship, log pattern-library one-liners to avoid blank-page starts.',
      ],
      loopSteps: [
        'Kickoff task states scenario and success metric in one line.',
        'Each critique spawns a “decision” sub-task: chosen path, rejected path, why.',
        'Pre-launch: checklist tasks with screenshots or deep links.',
      ],
      faq: [
        { q: 'What about Figma comments?', a: 'Comments handle pixels; TodoAgent handles priority and ownership—use both.' },
        { q: 'Design systems?', a: 'Yes—component iterations become task threads; track release rhythm globally.' },
      ],
    },
  },
  {
    slug: 'growth-marketers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['founders', 'sales-professionals', 'content-writers'],
    zh: {
      pageTitle: '增长营销的 AI 待办：实验、渠道与复盘 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理增长实验假设、上线检查与周复盘；每条实验一条任务线，Agent 协助写清指标与样本量提示。',
      cardTeaser: '让实验从「想法」变成可关闭的任务，而不是永远 open 的文档。',
      h1: '增长营销如何用 TodoAgent 跑实验节奏',
      audience:
        '你在多渠道测试，需要记录假设、对照组、上线窗口与结论，否则下个月会重复同样的试错。',
      frictions: [
        '实验文档写很长，但没有负责人和截止时间。',
        '渠道同事不知道实验何时结束、以何指标判胜负。',
        '赢了的经验没沉淀，输了的教训没记录。',
      ],
      productIntro:
        'TodoAgent 用任务定义实验生命周期：设计、上线、监控、结论、沉淀；指标与链接写在任务头，对话里讨论创意与受众。',
      productBullets: [
        '全局对话对齐季度增长主题，避免每个实验都自称「最优先」。',
        '任务完成时强制一句话结论：提升/无显著/负向 + 下一步建议。',
        '与内容任务联动，campaign 物料有明确交付与验收。',
      ],
      loopSteps: [
        '新建实验任务必须包含：假设、核心指标、最小样本提示、负责人。',
        '上线日 checklist：追踪就绪、落地页、受众排除规则。',
        '结束后 24 小时内写结论任务，并链到报表截图或看板。',
      ],
      faq: [
        { q: '能和 Ads 平台数据对接吗？', a: '产品内不直连广告 API；在任务中链到报表或导出即可。' },
        { q: '适合 B2B 长周期线索吗？', a: '适合把「触达—培育—商机」拆成多条任务线分别复盘。' },
      ],
    },
    en: {
      pageTitle: 'Growth Marketers: AI To-Do for Experiments and Channel Loops | TodoAgent',
      metaDescription:
        'Run growth experiments as tasks with owners, metrics, and deadlines—Agent help clarifies hypotheses and post-mortem notes.',
      cardTeaser: 'Turn experiments from docs that never close into tasks that can ship and retire.',
      h1: 'How growth marketers use TodoAgent to keep experiment cadence',
      audience:
        'You test across channels. You must log hypotheses, controls, launch windows, and outcomes—or you repeat the same mistakes next month.',
      frictions: [
        'Experiment briefs are long but lack owners and due dates.',
        'Channel partners do not know when tests end or how winners are picked.',
        'Wins are not templated; losses are not memorialized.',
      ],
      productIntro:
        'Model experiment life cycles as tasks: design, launch, monitor, conclude, archive. Put metrics and links in the task header; brainstorm copy in chat.',
      productBullets: [
        'Global chat aligns quarterly themes so every test does not claim top priority.',
        'Completion requires a one-line verdict: up / flat / down plus next step.',
        'Link campaign creative tasks with clear acceptance for assets.',
      ],
      loopSteps: [
        'New experiment tasks must include hypothesis, north-star metric, rough sample hint, owner.',
        'Launch-day checklist: tracking, landing page, audience exclusions.',
        'Within twenty-four hours of end: conclusion task linking dashboard proof.',
      ],
      faq: [
        { q: 'Ads API integrations?', a: 'Not built-in—link tasks to your dashboards or exports.' },
        { q: 'Long B2B cycles?', a: 'Yes—split outreach, nurture, and opportunity follow-ups into separate threads.' },
      ],
    },
  },
  {
    slug: 'operations-leads',
    updatedAt: '2026-04-01',
    relatedSlugs: ['founders', 'finance-ops', 'customer-success'],
    zh: {
      pageTitle: '运营负责人的 AI 待办：流程、供应商与指标 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理流程改造、供应商跟进与跨部门项目；任务绑定 SOP 链接与指标，Agent 协助拆解阻塞与下一步。',
      cardTeaser: '把「流程债」和「本周要推的改造」从脑子里搬到可指派任务。',
      h1: '运营负责人如何用 TodoAgent 推进跨团队事项',
      audience:
        '你维护 SOP、盯供应商、协调销售与交付，事项多且重复，需要看见依赖链与责任边界。',
      frictions: [
        '流程优化永远在「有空再做」，没有里程碑。',
        '供应商问题口头同步，没有可追踪工单。',
        '跨部门项目只有群聊，没有单一事实来源的任务树。',
      ],
      productIntro:
        'TodoAgent 把改造项目和日常救火分开任务池；重要流程各有一条「负责人 + 下次检查日」任务，对话记录例外处理规则。',
      productBullets: [
        '全局对话做运营周会：风险、资源、优先级三件事。',
        '任务可链到表格或 BI，减少「数字在哪」的往返。',
        '用模板重复创建周期性核对任务（库存、账单、权限）。',
      ],
      loopSteps: [
        '每个流程改造任务写清 Before/After 一句与影响团队。',
        '供应商问题任务包含期望回复时间与升级路径。',
        '周五清点：未闭环、已委托、需管理层决策三类。',
      ],
      faq: [
        { q: '适合客服工单系统吗？', a: '不替代工单；TodoAgent 更适合你个人的推进与上下文，可与工单链互引用。' },
        { q: '多人协作呢？', a: '先保证个人任务树清晰；共享视图可通过导出或文档同步实现。' },
      ],
    },
    en: {
      pageTitle: 'Operations Leads: AI To-Do for Processes, Vendors, and Metrics | TodoAgent',
      metaDescription:
        'Run process improvements, vendor follow-ups, and cross-team programs as tasks with SOP links, metrics, and Agent-assisted unblock notes.',
      cardTeaser: 'Move process debt and “this week’s change” from memory into assignable work.',
      h1: 'How operations leads use TodoAgent to drive cross-team work',
      audience:
        'You own SOPs, vendors, and handoffs between sales and delivery. Dependencies and ownership must stay visible.',
      frictions: [
        'Process work is “when we have time,” with no milestones.',
        'Vendor issues live in verbal syncs without tickets.',
        'Cross-team projects exist only as group chats.',
      ],
      productIntro:
        'Separate transformation projects from daily firefighting. Give important flows an owner plus next review date; log exception rules in chat.',
      productBullets: [
        'Global chat runs the weekly ops huddle: risks, capacity, priorities.',
        'Link tasks to spreadsheets or BI to stop hunting for numbers.',
        'Use templates for recurring audits—inventory, billing, access reviews.',
      ],
      loopSteps: [
        'Each process change states before/after in one line plus impacted teams.',
        'Vendor tasks include expected response time and escalation path.',
        'Friday triage: open, delegated, needs-executive-call.',
      ],
      faq: [
        { q: 'Replace a ticketing system?', a: 'No—TodoAgent is for your execution layer; link out to tickets when needed.' },
        { q: 'Teams?', a: 'Start with a clear personal tree; share via docs or exports for alignment.' },
      ],
    },
  },
  {
    slug: 'students',
    updatedAt: '2026-04-01',
    relatedSlugs: ['academic-researchers', 'freelancers', 'content-writers'],
    zh: {
      pageTitle: '学生的 AI 待办：课程、作业与复习节奏 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理多门课作业与考试复习：任务写清截止与评分标准摘要，Agent 协助拆步骤与防拖延提示。',
      cardTeaser: '把「下周要交」拆成今天能完成的小步，减少通宵。',
      h1: '学生如何用 TodoAgent 管理学业与项目',
      audience:
        '你同时修多门课、社团和实习，截止日期堆叠，需要把大作业拆成可执行块并保留助教反馈摘要。',
      frictions: [
        '只看截止日期，不看中间检查点，导致前松后紧。',
        '小组作业责任不清，最后一个人扛锅。',
        '复习没有清单，考前才发现某章完全没练。',
      ],
      productIntro:
        'TodoAgent 鼓励「作业 = 多条子任务」：资料、初稿、互评、终稿；每条写预计耗时，全局对话管本周时间预算。',
      productBullets: [
        '任务对话可让 Agent 帮你检查大纲是否覆盖 rubric 要点（摘要级）。',
        '把课程链接与 rubric PDF 链在任务上，减少找文件时间。',
        '用每日回顾勾选「今天推进了哪一步」，建立正反馈。',
      ],
      loopSteps: [
        '拿到作业先建主任务，再拆至少 3 个子任务与预估时间。',
        '小组任务为每位成员建「个人交付」子任务，合并前再集成。',
        '考前两周建章节 checklist 任务，每天勾一项。',
      ],
      faq: [
        { q: '会帮我写作业吗？', a: 'TodoAgent 不替代学术诚信；Agent 用于拆解步骤、澄清要求与自检清单。' },
        { q: '适合考研/考证吗？', a: '适合；用任务模板重复「章节—练习—错题回顾」循环即可。' },
      ],
    },
    en: {
      pageTitle: 'Students: AI To-Do for Courses, Assignments, and Study Loops | TodoAgent',
      metaDescription:
        'Break big syllabi into executable tasks with deadlines and rubric snippets—Agent help turns vague assignments into step lists (not cheating).',
      cardTeaser: 'Turn “due next week” into steps you can finish today—fewer all-nighters.',
      h1: 'How students use TodoAgent for school and side projects',
      audience:
        'You stack classes, clubs, and internships. Deadlines collide unless big work splits into chunks with TA feedback captured.',
      frictions: [
        'You only watch final due dates, not checkpoints—work compresses at the end.',
        'Group projects have unclear ownership.',
        'Studying lacks checklists; exam week reveals untouched chapters.',
      ],
      productIntro:
        'Model assignments as a parent task plus children: research, draft, peer review, final. Estimate hours; use global chat for weekly time budgets.',
      productBullets: [
        'Task chat can sanity-check outlines against rubric summaries—not ghostwriting.',
        'Link LMS pages and PDF rubrics to tasks to reduce file hunts.',
        'Daily micro-reviews celebrate incremental progress.',
      ],
      loopSteps: [
        'On assign-out: parent task plus ≥3 children with time guesses.',
        'Group work: per-member delivery subtasks before integration.',
        'Two weeks pre-exam: chapter checklist tasks, one tick per day.',
      ],
      faq: [
        { q: 'Will it do my homework?', a: 'No—use the Agent for planning, clarification, and checklists while you do the work.' },
        { q: 'Test prep?', a: 'Yes—repeat a template loop: chapter → drills → error review.' },
      ],
    },
  },
  {
    slug: 'freelancers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['founders', 'consultants', 'indie-hackers'],
    zh: {
      pageTitle: '自由职业者的 AI 待办：客户、报价与交付 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理多客户提案、里程碑与发票跟进；任务分隔上下文，Agent 协助整理范围边界与交付清单。',
      cardTeaser: '把「这一单做到哪、下一笔款何时催」从脑子里挪到任务。',
      h1: '自由职业者如何用 TodoAgent 管理多客户项目',
      audience:
        '你同时谈新单、做交付、催款和自我营销，边界模糊时最容易加班到失控。',
      frictions: [
        '范围蔓延没有书面记录，难以礼貌说「这算变更」。',
        '里程碑很多，但发票与交付物对应不上。',
        '营销和内容输出永远排在「客户忙完之后」。',
      ],
      productIntro:
        'TodoAgent 为每个客户维护任务前缀或项目习惯；提案、交付、收款各阶段任务化，对话里草稿邮件与条款摘要。',
      productBullets: [
        '全局对话安排「生意日」：拓客、学习、行政的时间比例。',
        '用任务完成触发自我复盘：时薪估算、是否续单、下季度调价线索。',
        '文档面板可挂合同与 brief，减少在邮箱里翻旧账。',
      ],
      loopSteps: [
        '签约后第一条任务写清范围一句 + 不在范围内示例一条。',
        '每个里程碑绑定交付物链接与开票任务。',
        '每周固定 2 个拓客任务，避免交付吞噬增长。',
      ],
      faq: [
        { q: '能替代合同工具吗？', a: '不能；法律文本仍用专业工具，TodoAgent 管执行与提醒。' },
        { q: '按时计费怎么记？', a: '可用任务备注记录时间段摘要，详细计时仍建议用计时 app。' },
      ],
    },
    en: {
      pageTitle: 'Freelancers: AI To-Do for Clients, Scope, and Invoicing | TodoAgent',
      metaDescription:
        'Separate client contexts, milestone delivery, and invoice nudges—tasks carry scope notes, with Agent help drafting polite scope emails.',
      cardTeaser: 'Know where each deal stands and when to nudge for payment—without living in your head.',
      h1: 'How freelancers use TodoAgent across multiple clients',
      audience:
        'You sell, deliver, invoice, and market yourself. Scope creep arrives quietly unless boundaries are written.',
      frictions: [
        'Scope creep lacks a paper trail, so “no” feels rude.',
        'Milestones multiply but invoices do not map to artifacts.',
        'Marketing always waits until clients are “handled.”',
      ],
      productIntro:
        'Prefix tasks per client or use naming rituals. Proposal, delivery, and billing become explicit tasks; draft emails and clause summaries in chat.',
      productBullets: [
        'Global chat schedules “business days” for outreach, learning, and admin.',
        'On task completion, note effective hourly rate and renewal hints.',
        'Documents panel stores contracts and briefs to stop inbox archaeology.',
      ],
      loopSteps: [
        'Post-signature: scope in one sentence plus one “out of scope” example.',
        'Each milestone links deliverables and spawns an invoice task.',
        'Two biz-dev tasks weekly so delivery does not eat growth.',
      ],
      faq: [
        { q: 'Replace contracts?', a: 'No—use legal tools for documents; TodoAgent handles execution and reminders.' },
        { q: 'Hourly tracking?', a: 'Use notes for session summaries; pair with a timer app for precision.' },
      ],
    },
  },
  {
    slug: 'engineering-managers',
    updatedAt: '2026-04-01',
    relatedSlugs: ['software-engineers', 'product-managers', 'operations-leads'],
    zh: {
      pageTitle: '工程管理者的 AI 待办：1:1、风险与发布 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理 1:1 跟进、技术债与发布风险任务；敏感信息写摘要，Agent 协助整理会议行动项。',
      cardTeaser: '让「本周要 unblock 谁、发布风险在哪」有单一清单。',
      h1: '工程管理者如何用 TodoAgent 减轻协调负担',
      audience:
        '你在 1:1、跨团队对齐和发布窗口之间切换，需要记录承诺与风险而不把团队隐私写进错误的地方。',
      frictions: [
        '1:1 行动项散落在笔记里，下次见面重复问。',
        '发布风险只靠口头，值周同学不知道检查清单。',
        '技术债没有负责人，永远在 backlog 里吃灰。',
      ],
      productIntro:
        'TodoAgent 适合放你自己的管理任务树：谁需要反馈、哪个风险要升级、哪条债要在本季度开一刀；写摘要别写绩效细节。',
      productBullets: [
        '全局对话做「本周管理团队」三件事：人、风险、流程改进。',
        '任务可链到内部 runbook，而不是在聊天里重复粘贴步骤。',
        '用复盘模板记录每次发布的教训一条，供下轮预检。',
      ],
      loopSteps: [
        '每位直接下属一条「待跟进」任务，更新频率高于周会即可。',
        '发布周建 checklist 任务：回滚、监控、值周、沟通口径。',
        '技术债任务必须包含：影响用户面、粗略成本、建议时间盒。',
      ],
      faq: [
        { q: '绩效评估敏感信息能放吗？', a: '不建议；TodoAgent 更适合行动项与风险摘要，正式评估用 HR 指定工具。' },
        { q: '团队共用吗？', a: '当前以个人工作区为主；团队可见内容请遵循公司政策。' },
      ],
    },
    en: {
      pageTitle: 'Engineering Managers: AI To-Do for 1:1s, Risk, and Releases | TodoAgent',
      metaDescription:
        'Track your own management tasks—unblocks, escalation risks, release checklists—with summaries (not HR-sensitive essays) and Agent-polished action items.',
      cardTeaser: 'One list for who needs unblocking and where release risk lives this week.',
      h1: 'How engineering managers use TodoAgent to reduce coordination load',
      audience:
        'You switch between 1:1s, cross-team alignment, and launch windows. Promises and risks need memory without mishandling privacy.',
      frictions: [
        '1:1 actions live in scattered notes and get re-asked.',
        'Release risk is verbal; on-call does not inherit a checklist.',
        'Tech debt has no owner and dies in the backlog.',
      ],
      productIntro:
        'Keep your personal management tree here: who needs feedback, what must escalate, which debt slice ships this quarter—summaries, not performance essays.',
      productBullets: [
        'Global chat lists three weekly pillars: people, risk, process improvement.',
        'Link tasks to internal runbooks instead of pasting steps in chat.',
        'Post-release: one-line lesson tasks to feed the next preflight.',
      ],
      loopSteps: [
        'Per direct report, a standing “follow-ups” task updated between 1:1s.',
        'Launch week checklist tasks: rollback, monitoring, comms owner.',
        'Debt tasks need user impact, rough cost, proposed timebox.',
      ],
      faq: [
        { q: 'Store performance reviews?', a: 'Prefer HR-approved tools; TodoAgent is for actions and risk summaries.' },
        { q: 'Shared team workspace?', a: 'Today it is individual-first; follow company policy for visibility.' },
      ],
    },
  },
  {
    slug: 'data-analysts',
    updatedAt: '2026-04-02',
    relatedSlugs: ['software-engineers', 'product-managers', 'finance-ops'],
    zh: {
      pageTitle: '数据分析师的 AI 待办：查询、看板与结论叙事 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理取数、校验与汇报节奏；任务绑定 SQL/Notebook 链接与指标定义，Agent 协助把发现写成可执行下一步。',
      cardTeaser: '让「这一版数谁看过、指标口径是什么」跟着任务走，而不是散落在工单评论里。',
      h1: '数据分析师如何用 TodoAgent 稳住交付与口径',
      audience:
        '你在业务追问、数据清洗、可视化与结论叙事之间切换，需要把口径变更和待验证假设写成可检索记录。',
      frictions: [
        '同一个指标名在不同部门含义不同，复盘时才发现对不齐。',
        '临时取数需求插队，正式分析永远排在队尾。',
        '结论写在幻灯片里，SQL 与原始假设没有链回任务。',
      ],
      productIntro:
        'TodoAgent 把「一次分析」拆成任务树：口径确认、取数、质检、叙事、复盘；每条任务可挂仓库链接与看板 URL，对话里草稿解释段落。',
      productBullets: [
        '任务级对话适合请 Agent 帮你检查叙事是否覆盖反例与局限（摘要级，不替代专业复核）。',
        '全局对话安排本周「深度分析块」与「救火块」比例，减少隐性加班。',
        '完成后沉淀「指标字典一句」任务，给下次同类需求复用。',
      ],
      loopSteps: [
        '开工任务写清：问题一句、成功标准、已知数据缺口。',
        '每次口径调整新增子任务说明旧/新定义与影响面。',
        '交付前 checklist：样本期、过滤条件、延迟与刷新频率写在任务描述里。',
      ],
      faq: [
        { q: '会直连数仓吗？', a: '产品内不直连；在任务中链到查询、Notebook 或 BI 即可。' },
        { q: '适合机器学习项目吗？', a: '适合管实验与特征工程任务线；模型注册仍用 MLOps 工具。' },
      ],
    },
    en: {
      pageTitle: 'Data Analysts: AI To-Do for Queries, Dashboards, and Narratives | TodoAgent',
      metaDescription:
        'Run ad-hoc pulls, validation, and storytelling as tasks with metric definitions linked—Agent help turns findings into next actions, not slide-only ghosts.',
      cardTeaser: 'Keep metric definitions and review history attached to the task—not buried in ticket threads.',
      h1: 'How data analysts use TodoAgent for delivery and definitions',
      audience:
        'You oscillate between business questions, cleaning, viz, and narrative. Definitions drift unless you log them as durable context.',
      frictions: [
        'The same KPI name means different things across teams.',
        'Ad-hoc pulls starve deep analysis without explicit tradeoffs.',
        'Insights live in decks while SQL and hypotheses stay untethered.',
      ],
      productIntro:
        'Model an analysis as a task tree: align definitions, extract, QA, narrate, retro. Link repos and dashboards; draft explanations in chat.',
      productBullets: [
        'Task chat can sanity-check narratives for caveats—summary level, not a substitute for peer review.',
        'Global chat budgets “deep work blocks” versus firefighting.',
        'Ship a one-line metric glossary task for the next similar request.',
      ],
      loopSteps: [
        'Kickoff states the question, success criteria, and known data gaps.',
        'Any definition change spawns a child task with old vs new impact.',
        'Pre-readout checklist: window, filters, latency, refresh cadence on the task.',
      ],
      faq: [
        { q: 'Warehouse integrations?', a: 'Not built-in—link queries, notebooks, or BI from the task.' },
        { q: 'ML projects?', a: 'Good for experiment and feature-engineering threads; model registry stays in MLOps tools.' },
      ],
    },
  },
  {
    slug: 'customer-success',
    updatedAt: '2026-04-02',
    relatedSlugs: ['sales-professionals', 'product-managers', 'operations-leads'],
    zh: {
      pageTitle: '客户成功的 AI 待办：健康度、QBR 与扩容 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理续约风险、客户目标与内部交接；任务绑定 CRM 摘要链接，Agent 协助整理拜访要点与下一步。',
      cardTeaser: '把「这个账号下周谁跟、风险点一句」写进任务，而不是只存在脑子里。',
      h1: '客户成功如何用 TodoAgent 对齐目标与内部协作',
      audience:
        '你管续约、采用度与扩容，经常在销售、产品与支援之间传话，需要单一清单记住承诺与待办。',
      frictions: [
        '客户目标口头对齐，季度复盘时对不上记录。',
        '交接只靠转发邮件，新 CSM 不知道历史承诺。',
        '风险客户没有「下一步负责人」任务，大家都在等别人动。',
      ],
      productIntro:
        'TodoAgent 为每个重点账号建任务树：目标、健康度信号、内部升级、QBR 材料；对话里草拟客户邮件与内部同步摘要。',
      productBullets: [
        '全局对话安排本周「深度客户日」与「内部协调日」。',
        '任务完成时写一句「客户认知更新」，减少信息衰减。',
        '与产品反馈合并为子任务，链到 issue 或文档。',
      ],
      loopSteps: [
        '新接手账号先建三条任务：目标一句、关键联系人、已知雷点。',
        '每次客户会议后 15 分钟内更新「承诺与日期」子任务。',
        '续约前 60 天启动 checklist：用量、价值故事、风险缓解。',
      ],
      faq: [
        { q: '能替代 CRM 吗？', a: '不能；CRM 仍是系统记录，TodoAgent 管你的个人执行与上下文。' },
        { q: '适合高触达还是低触达？', a: '两种都适合；高触达用更多子任务拆拜访与跟进，低触达用节奏模板即可。' },
      ],
    },
    en: {
      pageTitle: 'Customer Success: AI To-Do for Health, QBRs, and Expansion | TodoAgent',
      metaDescription:
        'Track renewals, adoption signals, and internal handoffs—tasks carry CRM snippets and next owners, with Agent-drafted follow-up notes.',
      cardTeaser: 'Know which account needs motion this week and who owns the next step—not just vibes.',
      h1: 'How customer success teams use TodoAgent to align goals and internals',
      audience:
        'You own renewals, adoption, and expansion while translating between sales, product, and support. You need one durable list of promises.',
      frictions: [
        'Goals align verbally but vanish by QBR time.',
        'Handoffs are forwarded threads; new CSMs miss historical commitments.',
        'At-risk accounts lack an explicit next-owner task.',
      ],
      productIntro:
        'Build a task tree per strategic account: goals, health signals, escalations, QBR assets. Draft customer and internal notes in chat.',
      productBullets: [
        'Global chat balances deep-customer days versus internal coordination.',
        'On closure, log a one-line “customer mental model” update.',
        'Product feedback becomes child tasks linked to issues or docs.',
      ],
      loopSteps: [
        'On takeover: three tasks—goal sentence, key contacts, known landmines.',
        'Post-call within fifteen minutes: promises with dates as sub-tasks.',
        'Sixty days pre-renewal: usage story, value narrative, risk mitigations checklist.',
      ],
      faq: [
        { q: 'Replace a CRM?', a: 'No—CRM stays the system of record; TodoAgent is your execution layer.' },
        { q: 'High-touch vs low-touch?', a: 'Both—more sub-tasks for high-touch; rhythm templates for scaled motions.' },
      ],
    },
  },
  {
    slug: 'sales-professionals',
    updatedAt: '2026-04-02',
    relatedSlugs: ['customer-success', 'founders', 'growth-marketers'],
    zh: {
      pageTitle: '销售同学的 AI 待办：管道、提案与复盘 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理商机阶段、提案截止与复盘；任务绑定客户一句话背景，Agent 协助整理异议与下一步话术摘要。',
      cardTeaser: '管道里每条机会都有「下一封邮件写什么」级别的具体任务。',
      h1: '销售如何用 TodoAgent 推进商机与复盘',
      audience:
        '你在多机会并行、内部评审与客户跟进之间切换，需要记住每个机会的独特障碍与已承诺动作。',
      frictions: [
        'CRM 阶段更新了，但下一步动作仍模糊。',
        '提案前夜才发现缺案例或安全问卷没人认领。',
        '赢单/输单复盘没有固定落点，经验无法复用。',
      ],
      productIntro:
        'TodoAgent 把每个机会当成任务树：研究、触达、提案、谈判、交接；任务描述写客户动机一句，对话里演练话术与邮件草稿。',
      productBullets: [
        '全局对话设定本周「新拓」与「推进」时间块，减少管道假繁荣。',
        '输单任务强制一句「教训与下次触发条件」。',
        '与客户成功交接时链到已建账号任务树，减少重复采访客户。',
      ],
      loopSteps: [
        '新建机会任务必须含：理想客户画像匹配点一句、主要风险一句。',
        '每次客户互动后更新「待办」子任务，避免只改 CRM 阶段。',
        '周五管道评审：三条必须推进、两条必须放弃或降级。',
      ],
      faq: [
        { q: '和 CRM 怎么配合？', a: 'CRM 管对象与阶段，TodoAgent 管你的下一步与话术上下文。' },
        { q: '适合 B2B 长周期吗？', a: '适合；长周期更需要任务树防止中途失忆。' },
      ],
    },
    en: {
      pageTitle: 'Sales Professionals: AI To-Do for Pipeline, Proposals, and Reviews | TodoAgent',
      metaDescription:
        'Run opportunities as task trees with crisp next steps—link one-line account context, with Agent help on objections and email drafts.',
      cardTeaser: 'Every deal gets a concrete “what ships next” task—not just a stage change.',
      h1: 'How sales professionals use TodoAgent to move deals and learn',
      audience:
        'You parallelize opportunities, internal reviews, and follow-ups. Each deal has distinct blockers and promises to remember.',
      frictions: [
        'CRM stages update while next actions stay fuzzy.',
        'Proposal week surfaces missing case studies or security forms with no owner.',
        'Win/loss retros have no home, so lessons never compound.',
      ],
      productIntro:
        'Model each opportunity: research, outreach, proposal, negotiation, handoff. Capture buyer motivation in the task; rehearse copy in chat.',
      productBullets: [
        'Global chat budgets prospecting versus advancing existing pipe.',
        'Loss tasks require one lesson plus a “retry when” trigger.',
        'Handoffs link to customer-success task trees to avoid re-interrogating buyers.',
      ],
      loopSteps: [
        'New opp tasks need ICP fit in one line and top risk in one line.',
        'After every touch, refresh sub-tasks—not only the CRM stage.',
        'Friday pipeline triage: three must-advance, two must-deprioritize.',
      ],
      faq: [
        { q: 'CRM relationship?', a: 'CRM owns objects and stages; TodoAgent owns your next moves and narrative context.' },
        { q: 'Long B2B cycles?', a: 'Especially—task trees prevent mid-cycle amnesia.' },
      ],
    },
  },
  {
    slug: 'people-ops',
    updatedAt: '2026-04-02',
    relatedSlugs: ['founders', 'legal-teams', 'operations-leads'],
    zh: {
      pageTitle: '人力与 People Ops 的 AI 待办：招聘、绩效与制度落地 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理招聘管道、制度改版与员工沟通节奏；任务写摘要链至 HRIS，Agent 协助整理沟通要点与检查清单。',
      cardTeaser: '把「这周要谈的几个人、要发的制度补丁」从表格和脑子里统一到任务。',
      h1: 'People Ops 如何用 TodoAgent 推进流程而不被淹没',
      audience:
        '你同时跑招聘、入职、制度、员工关系与数据报表，敏感信息多，需要清晰边界：任务里摘要，原件在合规系统。',
      frictions: [
        '招聘多岗位并行，面试官反馈散落在邮件。',
        '制度更新发了邮件，但执行检查点没人跟踪。',
        '员工个案耗尽心流，战略性项目永远延期。',
      ],
      productIntro:
        'TodoAgent 用任务树拆「岗位管道」「制度项目」「个案跟进」；描述写事实摘要与下一步，对话里草拟员工沟通稿（需人工审核）。',
      productBullets: [
        '全局对话区分「运营日」与「项目日」，保护深度工作。',
        '合规相关任务标注数据来源与保留策略提示（仍须遵循公司政策）。',
        '周期性任务模板：试用期检查、培训完成核对等。',
      ],
      loopSteps: [
        '每个 open headcount 一条主任务，子任务对应阶段与负责人。',
        '制度改版任务含：影响人群、生效日、FAQ 草稿链接。',
        '个案任务每日上限自检，避免无限救火。',
      ],
      faq: [
        { q: '员工隐私怎么写？', a: '任务里只写必要摘要；详细档案留在 HRIS，任务链过去。' },
        { q: '能自动生成合同吗？', a: '不能；法律文本用专业流程，TodoAgent 管提醒与核对清单。' },
      ],
    },
    en: {
      pageTitle: 'People Ops & HR: AI To-Do for Hiring, Programs, and Rollouts | TodoAgent',
      metaDescription:
        'Run recruiting pipelines, policy rollouts, and employee comms as tasks with summaries linked to HRIS—Agent drafts need human review.',
      cardTeaser: 'Unify “who to talk to this week” and “what policy patch ships” into one execution layer.',
      h1: 'How people ops uses TodoAgent without drowning in admin',
      audience:
        'You juggle hiring, onboarding, policies, ER cases, and reporting. Sensitive details belong in HRIS; tasks carry summaries and next steps.',
      frictions: [
        'Multi-role hiring scatters interviewer feedback across email.',
        'Policy updates broadcast without execution checkpoints.',
        'Cases consume all deep work; strategic projects slip forever.',
      ],
      productIntro:
        'Split pipelines, policy projects, and case follow-ups into trees. Chat drafts comms—always reviewed by a human before send.',
      productBullets: [
        'Global chat separates ops days from project days.',
        'Tag compliance tasks with data-source notes per company policy.',
        'Recurring templates: probation checks, training completions.',
      ],
      loopSteps: [
        'One parent task per open role; children map stages and owners.',
        'Policy tasks list audience, effective date, FAQ doc link.',
        'Daily cap sanity check on case work to protect strategy time.',
      ],
      faq: [
        { q: 'Privacy?', a: 'Summaries on tasks; full files stay in HRIS with links.' },
        { q: 'Auto contracts?', a: 'No—legal workflows own documents; TodoAgent handles reminders and checklists.' },
      ],
    },
  },
  {
    slug: 'legal-teams',
    updatedAt: '2026-04-02',
    relatedSlugs: ['people-ops', 'consultants', 'founders'],
    zh: {
      pageTitle: '法务与合规的 AI 待办：合同审阅、清单与跨部门对齐 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理审阅队列、条款谈判节点与合规项目；任务仅存摘要与截止，Agent 协助整理问题清单（不构成法律意见）。',
      cardTeaser: '让「这一版合同卡在哪个条款、谁在等谁」一眼可见。',
      h1: '法务团队如何用 TodoAgent 管理审阅节奏与项目',
      audience:
        '你在合同、合规、知识产权与业务催办之间排队，需要可见的队列与版本节点，而不是仅靠邮箱标星。',
      frictions: [
        '业务方不知道审阅进行到哪一步，反复催同一封邮件。',
        '同一合同多轮往返，历史争议点没有任务级记录。',
        '合规项目里程碑多，跨部门依赖不透明。',
      ],
      productIntro:
        'TodoAgent 适合个人或小组的任务队列：每条任务链 DMS/CLM 中的文档，描述写争议点摘要与下一动作；对话可草拟问题列表供律师审核。',
      productBullets: [
        '全局对话安排「深度审阅块」与「行政协调块」。',
        '任务状态可对外同步：等待业务 / 等待对方律师 / 内部复核。',
        '合规冲刺用 checklist 子任务，减少最后一刻补材料。',
      ],
      loopSteps: [
        '新审阅任务：业务目标一句、风险等级自评、希望回复日。',
        '每轮往返新增子任务记录条款编号与结论摘要。',
        '项目型合规任务每周一次依赖清点，标出阻塞方。',
      ],
      faq: [
        { q: '这算法律意见吗？', a: '不算；TodoAgent 与 Agent 输出仅供工作组织，法律判断须由执业人员作出。' },
        { q: '能存全文合同吗？', a: '建议仅存链与摘要；全文放在公司批准的合同库。' },
      ],
    },
    en: {
      pageTitle: 'Legal & Compliance: AI To-Do for Reviews, Checklists, and Programs | TodoAgent',
      metaDescription:
        'Queue contract reviews and compliance workstreams with deadlines and summaries linked to your DMS—Agent lists are not legal advice.',
      cardTeaser: 'See which clause blocks the deal and who waits on whom—beyond starred email.',
      h1: 'How legal teams use TodoAgent for review cadence and programs',
      audience:
        'You triage contracts, compliance, IP, and business pressure. You need a visible queue with version milestones—not inbox archaeology.',
      frictions: [
        'Business cannot see review state and pings the same thread.',
        'Multi-round redlines lose a task-level memory of disputes.',
        'Compliance programs hide cross-team dependencies until crunch week.',
      ],
      productIntro:
        'Use tasks as a personal or pod queue: link docs in CLM/DMS, summarize issues, define next actions. Chat can draft question lists for attorney review.',
      productBullets: [
        'Global chat protects deep review blocks versus coordination.',
        'Statuses can be shared: waiting on biz / counterparty / internal QC.',
        'Compliance sprints use checklist children to avoid last-day packet panic.',
      ],
      loopSteps: [
        'New review: business goal, self-rated risk, desired turnaround.',
        'Each round: child task with clause refs plus outcome summary.',
        'Weekly dependency scan on program tasks with named blockers.',
      ],
      faq: [
        { q: 'Is this legal advice?', a: 'No—organization only; licensed counsel decides legal questions.' },
        { q: 'Store full contracts?', a: 'Prefer links plus summaries; full text in approved repositories.' },
      ],
    },
  },
  {
    slug: 'indie-hackers',
    updatedAt: '2026-04-02',
    relatedSlugs: ['founders', 'freelancers', 'open-source-maintainers'],
    zh: {
      pageTitle: '独立开发者的 AI 待办：产品、增长与支持 | TodoAgent',
      metaDescription:
        '一人公司也能跑 Attention 工作法：用 TodoAgent 拆功能、客服与内容；任务绑定用户反馈链接，Agent 协助整理发布清单。',
      cardTeaser: '把「这一版要 ship 什么」和「用户骂得最狠的三点」放在同一套任务系统里。',
      h1: '独立开发者如何用 TodoAgent 平衡构建与增长',
      audience:
        '你同时写代码、回邮件、发帖和看数据，最容易在「再改一点再发布」里耗光一周。',
      frictions: [
        'Roadmap 只在脑子里，导致永远做紧急不做重要。',
        '用户反馈在推特、邮件、Discord 三处，合并不了。',
        '发布前检查靠记忆，漏监控或漏更新定价。',
      ],
      productIntro:
        'TodoAgent 用少量任务模板覆盖：构建、发布、增长、支持；全局对话定「本周唯一里程碑」，任务对话拆实现与文案。',
      productBullets: [
        '每条用户痛点尽量落成一条可验证任务，而不是无限讨论。',
        '发布后 24 小时任务：监控、回复、记录三条用户原话。',
        '与开源 side project 可拆不同项目或前缀，防上下文串台。',
      ],
      loopSteps: [
        '每周一三条任务：本周 ship、本周不学、本周必须拒绝的需求。',
        '功能任务含：最小用户故事、成功指标、回滚想定一句。',
        '每月半天「删任务」：砍掉不再值得做的想法。',
      ],
      faq: [
        { q: '适合 side project 吗？', a: '适合；与工作主业用不同项目或命名习惯分隔即可。' },
        { q: '要配其他看板吗？', a: '可选；TodoAgent 专注可执行下一步与上下文。' },
      ],
    },
    en: {
      pageTitle: 'Indie Hackers: AI To-Do for Build, Distribution, and Support | TodoAgent',
      metaDescription:
        'Solo builders run TodoAgent for shipping, growth, and support—bind feedback links, with Agent help on launch checklists.',
      cardTeaser: 'Keep “what ships this week” and “top user pains” in one execution system.',
      h1: 'How indie hackers balance building and distribution',
      audience:
        'You code, reply, post, and read metrics. “One more tweak before launch” can eat the whole week.',
      frictions: [
        'Roadmaps live only in your head—urgent always beats important.',
        'Feedback scatters across Twitter, email, and Discord.',
        'Launch checks rely on memory—monitoring or pricing updates slip.',
      ],
      productIntro:
        'Use light templates for build, ship, growth, and support. Global chat sets the weekly milestone; task chat splits implementation and copy.',
      productBullets: [
        'Turn pains into verifiable tasks instead of infinite threads.',
        'Post-launch day task: monitoring, replies, three verbatim user quotes.',
        'Separate OSS side projects via prefixes or projects to avoid bleed.',
      ],
      loopSteps: [
        'Monday three tasks: ship this week, intentionally not learning, must-defer requests.',
        'Feature tasks include story, success metric, one-line rollback thought.',
        'Monthly half-day task purge: kill ideas that no longer earn their slot.',
      ],
      faq: [
        { q: 'Side projects?', a: 'Yes—split from day job via naming or project separation.' },
        { q: 'Need another board?', a: 'Optional; TodoAgent focuses on next actions plus context.' },
      ],
    },
  },
  {
    slug: 'open-source-maintainers',
    updatedAt: '2026-04-02',
    relatedSlugs: ['software-engineers', 'indie-hackers', 'engineering-managers'],
    zh: {
      pageTitle: '开源维护者的 AI 待办：Issue、版本与社区沟通 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理 release checklist、RFC 跟进与社区回复；任务链到 GitHub Issue，Agent 协助整理 breaking change 说明草稿。',
      cardTeaser: '让「下一个 release 还差什么」和「哪些 PR 等人 review」不再只靠 issue 列表心算。',
      h1: '开源维护者如何用 TodoAgent 减轻维护负担',
      audience:
        '你在 issue、PR、文档、社区情绪与本职工作之间切换，需要把「维护工作」从个人脑力里卸一点到系统里。',
      frictions: [
        '小修小补占满时间，路线图任务永远推迟。',
        'breaking change 沟通散落在多个 issue，用户升级时懵。',
        '新贡献者不知道从哪里开始，你重复回答同一套 onboarding。',
      ],
      productIntro:
        'TodoAgent 维护者可把 release、RFC、重点 issue 建成任务树；描述写影响面摘要，对话里草拟发布公告与迁移指南（需你审核）。',
      productBullets: [
        '全局对话设定「本周维护预算小时数」，保护主业精力。',
        '把高频新人问题沉淀为一条「指向文档」任务模板，减少重复打字。',
        '与工程同学协作时链到内部任务，不必在公开 issue 暴露全部上下文。',
      ],
      loopSteps: [
        '每个 release 主任务挂 checklist：changelog、迁移、tweet/thread、监控。',
        '对长期 RFC 设「下次讨论截止」子任务，避免无限搁置。',
        '每月审视：哪些 issue 应礼貌关闭或标记 help wanted。',
      ],
      faq: [
        { q: '会替代 GitHub Projects 吗？', a: '不必；可并行，TodoAgent 更偏个人优先级与叙事上下文。' },
        { q: '多仓库呢？', a: '用任务前缀或不同项目区分仓库名即可。' },
      ],
    },
    en: {
      pageTitle: 'Open Source Maintainers: AI To-Do for Releases, RFCs, and Community | TodoAgent',
      metaDescription:
        'Ship releases with checklists, track RFCs, and pace community replies—link GitHub issues, with Agent drafts for breaking-change notes.',
      cardTeaser: 'See what the next release still needs beyond scanning issue counts.',
      h1: 'How open source maintainers reduce sustain burden',
      audience:
        'You balance issues, PRs, docs, community tone, and paid work. You need part of “maintainer brain” externalized.',
      frictions: [
        'Small fixes eat the calendar; roadmap work never starts.',
        'Breaking changes scatter across threads; upgraders get lost.',
        'New contributors repeat the same onboarding questions.',
      ],
      productIntro:
        'Model releases, RFCs, and flagship issues as trees. Summarize blast radius in tasks; draft announcements and migration notes in chat—you approve.',
      productBullets: [
        'Global chat sets a weekly maintainer hour budget.',
        'Template tasks pointing to docs for frequent newbie questions.',
        'Link internal tasks when collaborating with employers without exposing all context publicly.',
      ],
      loopSteps: [
        'Release parent task: changelog, migration guide, comms, monitoring checks.',
        'RFC tasks get a “next discussion deadline” child.',
        'Monthly pass: close or label help-wanted on stale threads.',
      ],
      faq: [
        { q: 'Replace GitHub Projects?', a: 'Not required—parallel tracks; TodoAgent is personal priority plus narrative.' },
        { q: 'Many repos?', a: 'Prefix tasks or separate projects per repo name.' },
      ],
    },
  },
  {
    slug: 'finance-ops',
    updatedAt: '2026-04-02',
    relatedSlugs: ['founders', 'data-analysts', 'operations-leads'],
    zh: {
      pageTitle: '财务与 FP&A 的 AI 待办：关账、预测与跨部门对齐 | TodoAgent',
      metaDescription:
        '用 TodoAgent 管理月结清单、预测版本与业务方追问；任务链表格与模型文件，Agent 协助整理假设变更摘要（须人工复核数字）。',
      cardTeaser: '关账和预测周不再是「谁忘了交表」的微信群追逐战。',
      h1: '财务与 FP&A 如何用 TodoAgent 稳住节奏',
      audience:
        '你在准确、合规与业务「再给个版本」之间被拉扯，需要可见的依赖与假设记录。',
      frictions: [
        '月结 checklist 在 Excel，协作靠私聊，状态不同步。',
        '预测模型假设改了，业务方不知道哪版数可用。',
        '临时分析插队，固定报告永远熬夜补。',
      ],
      productIntro:
        'TodoAgent 把月结、预测轮次、专项分析拆成任务树；任务写假设摘要与数据截止日，对话里草拟对业务说明（数字以系统为准）。',
      productBullets: [
        '全局对话划分「关账周」与「常规划」保护深度建模时间。',
        '每次预测发布新增任务记录「本版与上版差异一句」。',
        '跨部门依赖用子任务标明责任人与期望返回时间。',
      ],
      loopSteps: [
        '月结主任务挂标准子任务：银行、收入、费用、调节、复核。',
        '预测任务含：情景名、关键假设、锁定时间。',
        '业务追问任务记录问题来源与答复链接，避免口头数被误传。',
      ],
      faq: [
        { q: 'Agent 能算报表吗？', a: '不能替代财务系统与复核；仅辅助文字摘要与任务组织。' },
        { q: '审计痕迹呢？', a: '正式审计轨迹仍以 ERP/账套为准；任务仅辅助协作。' },
      ],
    },
    en: {
      pageTitle: 'Finance Ops & FP&A: AI To-Do for Close, Forecasts, and Alignment | TodoAgent',
      metaDescription:
        'Run month-end checklists and forecast cycles as tasks with linked sheets—Agent text is not a substitute for controlled numbers.',
      cardTeaser: 'Stop chasing teammates in chat during close and forecast weeks.',
      h1: 'How finance and FP&A teams steady the rhythm',
      audience:
        'You balance accuracy, compliance, and endless “one more version” asks. Dependencies and assumptions must be visible.',
      frictions: [
        'Close checklists live in spreadsheets coordinated via DMs.',
        'Model assumptions change without a consumable story for the business.',
        'Ad-hoc analysis starves recurring reporting.',
      ],
      productIntro:
        'Split close, forecast rounds, and deep dives into trees. Log assumption deltas; draft business-facing language in chat—numbers stay in systems of record.',
      productBullets: [
        'Global chat isolates close week versus normal planning.',
        'Each forecast publish gets a “diff vs last version” task.',
        'Cross-functional dependencies become owned sub-tasks with ETAs.',
      ],
      loopSteps: [
        'Close parent: bank, revenue, expenses, adjustments, review children.',
        'Forecast tasks: scenario name, key levers, freeze time.',
        'Business asks log source plus answer link to reduce telephone-game errors.',
      ],
      faq: [
        { q: 'Does the Agent calculate books?', a: 'No—systems and humans own numbers; Agent helps narrative and task structure.' },
        { q: 'Audit trails?', a: 'ERP remains authoritative; tasks assist collaboration only.' },
      ],
    },
  },
];

const bySlug = new Map(pseoPersonas.map((p) => [p.slug, p]));

export function getPseoPersonaBySlug(slug: string): PseoPersona | undefined {
  return bySlug.get(slug);
}

export function getPseoPersonasSorted(): PseoPersona[] {
  return [...pseoPersonas].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function pickPseoLocale(persona: PseoPersona, language: Language): PseoLocaleBlock {
  return persona[language];
}

export function getRelatedPersonas(persona: PseoPersona): PseoPersona[] {
  return persona.relatedSlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is PseoPersona => p !== undefined);
}
