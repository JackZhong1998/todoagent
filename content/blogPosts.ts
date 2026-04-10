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
    id: 'human-ai-work-split-framework',
    slug: 'human-ai-work-split-framework',
    publishedAt: '2026-04-10',
    zh: {
      title: '人机分工怎么定：一个可落地的任务分流框架',
      summary: '用风险、可验证性、可重复性三维度，把任务稳定分到「人做 / AI做 / 协同做」，避免拍脑袋协作。',
      readingTime: '8 分钟',
      content: [
        '很多团队引入 AI 后，第一反应是“先都试试”。短期看很热闹，长期会出现同一个问题：返工率高、责任边界不清、产出质量波动。真正有效的人机协作，不是“尽量多给 AI”，而是先把任务分流规则定清楚。',
        '这里给你一个可直接用的三维框架。第一维是风险成本：如果做错会导致对外事故、法律风险或品牌损失，默认人主导；第二维是可验证性：能否在 5 分钟内客观验收；第三维是可重复性：未来一个月是否会高频重复。风险低、可验证、可重复的任务，优先交给 AI。',
        '你可以把任务分成三类。A 类（人做）：战略判断、跨团队博弈、含高不确定性的决策。B 类（AI做）：格式化输出、信息整理、初稿生成、批量改写。C 类（协同做）：AI 先产草稿，人做结构和标准把关，再由 AI 批量落地。',
        '执行时别追求完美模型，先追求“稳定流程”。每次任务结束后只记录三件事：哪里省时了、哪里翻车了、下次要增加什么约束。两周后你会得到一套属于你团队的分流手册，这份手册比任何单次 prompt 都更值钱。',
      ],
    },
    en: {
      title: 'How to Split Work Between Humans and AI: A Practical Routing Framework',
      summary:
        'Use three dimensions—risk, verifiability, and repeatability—to route work into human-led, AI-led, or hybrid flows with less rework.',
      readingTime: '8 min',
      content: [
        'When teams first adopt AI, they often default to “let us try everything.” It feels productive for a week, then quality drifts, ownership blurs, and rework climbs. Durable collaboration is not about maximizing AI usage. It is about routing tasks with clear rules.',
        'A simple framework works well in practice. Dimension one: downside risk. If errors can create legal, brand, or customer trust damage, keep humans in the lead. Dimension two: verifiability. Can output be checked objectively in minutes? Dimension three: repeatability. Will this task recur often enough to justify a stable pattern?',
        'Map work into three buckets. Human-led: strategy, ambiguity-heavy decisions, and cross-functional trade-offs. AI-led: formatting, summarization, first drafts, and repetitive transforms. Hybrid: AI produces options, humans set direction and quality bars, AI executes the scaled version.',
        'Do not optimize for the perfect prompt first. Optimize for a stable loop: run, review, capture one lesson, and update constraints. After two weeks, you get a reusable routing playbook. That playbook compounds faster than any single “good answer.”',
      ],
    },
  },
  {
    id: 'from-chat-to-sop-system',
    slug: 'from-chat-to-sop-system',
    publishedAt: '2026-04-09',
    zh: {
      title: '从聊天到 SOP：把一次性产出变成可复用流程',
      summary: '不是多写提示词，而是把成功任务沉淀成 SOP 资产，让下次协作从“已有标准”开始。',
      readingTime: '7 分钟',
      content: [
        '很多人会说“这次 AI 回答挺好”，但下次同类任务又得从头来。原因很简单：你存的是结果，不是过程。想让效率复利，必须把过程结构化，形成 SOP。',
        '一个最小可用 SOP 不需要很长，五段就够：任务目标、输入材料、关键约束、执行步骤、验收标准。注意“验收标准”必须可观察，比如“标题不超过 60 字”“输出包含 3 个可执行动作”，不要写成抽象形容词。',
        '建议每周只挑 2~3 个高频任务做 SOP 化。先从稳定场景开始：周报整理、文章初稿、方案对比、会议纪要。只要跑过三次且结构基本一致，就值得沉淀。',
        '真正能提升质量的，不是 SOP 的数量，而是回写机制。每次翻车后补一条“反例约束”：哪些表达不能出现、哪些结论必须给证据、哪些步骤必须人工确认。这样你的 SOP 会越跑越稳，而不是越写越空。',
      ],
    },
    en: {
      title: 'From Chat Output to SOP: Turning One-Off Wins into Reusable Workflows',
      summary:
        'Stop saving only outputs. Capture process as a lightweight SOP so similar tasks start from a proven baseline, not from scratch.',
      readingTime: '7 min',
      content: [
        'Teams often celebrate a strong AI response, then repeat the same work manually next week. The core mistake is saving the artifact but not the method. If you want compounding efficiency, capture process, not just output.',
        'A practical SOP can stay short. Use five blocks: objective, inputs, constraints, steps, and definition of done. Make “done” measurable. Replace vague standards like “better quality” with checks you can actually run in minutes.',
        'Do not SOP everything. Start with two or three recurring tasks per week: weekly updates, draft generation, comparison tables, meeting summaries. If a pattern repeats three times with similar shape, it is ready for SOP capture.',
        'The real multiplier is feedback write-back. After failures, add one anti-pattern constraint: what must be avoided, what needs evidence, and what requires human sign-off. This keeps SOPs grounded in outcomes, not in theory.',
      ],
    },
  },
  {
    id: 'weekly-human-ai-review-template',
    slug: 'weekly-human-ai-review-template',
    publishedAt: '2026-04-08',
    zh: {
      title: '一周一次的人机协作复盘：可直接套用的模板',
      summary: '用 30 分钟周复盘看清协作质量：完成率、返工率、可替代率，决定下周应该优化哪一步。',
      readingTime: '6 分钟',
      content: [
        '如果你只在“忙到爆”的时候才找 AI，协作质量会非常随机。最好的办法是固定每周一次短复盘，用同一套结构回看任务数据，快速找到值得优化的点。',
        '周复盘可以按四步走。第一步看结果：完成了什么、拖延了什么。第二步看质量：哪些任务返工次数最多。第三步看分工：哪些任务其实可以前置交给 AI。第四步定动作：下周只改 1~2 条流程规则。',
        '推荐记录三个核心指标。完成率：本周完成任务 / 计划任务；返工率：有二次修改以上的任务占比；可替代率：最终判定可由 AI 主做的任务占比。指标不需要追求精确到小数，关键是趋势。',
        '最后给自己一个硬约束：每次复盘必须产出一条可执行改动，比如“所有新任务都补验收标准”或“高频任务必须绑定旧 SOP”。这样下一周才能真正变好，而不是只是“看了一遍数据”。',
      ],
    },
    en: {
      title: 'A Weekly Human-AI Review Template You Can Run in 30 Minutes',
      summary:
        'Run one short weekly review to track completion, rework, and replaceability so collaboration improves by process, not by luck.',
      readingTime: '6 min',
      content: [
        'If AI is only used during deadline panic, quality becomes unpredictable. A short weekly review creates stability: same structure, same metrics, better decisions over time.',
        'Use a four-step loop. Step one: outcomes—what shipped and what slipped. Step two: quality—where rework was highest. Step three: routing—what could have been delegated earlier. Step four: action—change only one or two process rules for next week.',
        'Track three simple metrics. Completion rate: finished tasks over planned tasks. Rework rate: tasks requiring two or more revision rounds. Replaceability rate: tasks that could be AI-led with acceptable quality. Precision matters less than consistency.',
        'End every review with one enforceable change, such as “all new tasks require acceptance criteria” or “recurring tasks must link to an SOP.” Without this final rule, reviews become reporting. With it, they become leverage.',
      ],
    },
  },
  {
    id: 'why-ai-todo-fails-without-context',
    slug: 'why-ai-todo-fails-without-context',
    publishedAt: '2026-04-07',
    zh: {
      title: '为什么很多 AI 待办用几天就废了：不是工具问题，是上下文断层',
      summary: '你以为缺的是更聪明的模型，实际缺的是任务上下文。本文拆解 AI 待办失效的根因，并给出可执行修复动作。',
      readingTime: '10 分钟',
      content: [
        '上周一个朋友跟我说，他把三款 AI 工具都买了，最后还是回到纸质待办。不是因为他排斥 AI，而是每次开始任务都要重新解释背景，像每天都在 onboarding 一个新同事。',
        '这件事很典型。很多人以为 AI 待办失效，是模型不够聪明。更常见的原因是：任务上下文没有被结构化。你写了“做什么”，没写“为什么做”；你写了“优化”，没写“优化到什么程度算完成”。',
        '第一周通常看起来很顺。新鲜感高、任务简单、沟通耐心也高。第二周开始，复杂度上来，系统就暴露三个断层：目标断层、边界断层、记忆断层。',
        '目标断层是最常见的。任务标题像“整理竞品”“优化文案”“搞定周报”，这些词本质是标签，不是可执行指令。标签可以帮你记事，但无法帮你协作。',
        '边界断层也很致命。你没写清时间限制、合规要求、禁改项，AI 就会按“常识”生成。问题是常识不是你的业务标准，返工自然增加。',
        '记忆断层则让你重复踩坑。上次失败点没有回写成约束，下次同类任务继续翻车。你以为是偶发问题，其实是系统没有学习机制。',
        '把任务当作协作单元后，修复会很直接：每个任务固定四字段——目标、约束、输入、验收。目标定方向，约束定边界，输入定证据，验收定落地。少一项，模型就会脑补。',
        '再给你一个两周可落地动作：第一周只模板化 5 个高频任务；第二周每次失败回写 1 条反例约束，并做一次 30 分钟复盘。复盘只看三个指标：完成率、返工率、可替代率。',
        '很多人会在这个阶段发现：模型没变，但输出明显稳定了。原因很简单——你提供了可计算输入，而不是情绪化指令。',
        '如果你也有“AI 一开始很好用，后来越来越别扭”的感觉，先别急着换工具。先把任务四字段补齐，再跑两周。通常你会发现，真正需要升级的不是模型，而是协作系统。',
      ],
    },
    en: {
      title: 'Why AI To-Do Systems Break After a Week: It Is a Context Gap, Not a Tool Gap',
      summary:
        'Most AI task systems fail because context is missing, not because models are weak. This article explains the failure pattern and gives practical fixes.',
      readingTime: '10 min',
      content: [
        'Last week, a founder friend told me he had tested three AI productivity tools and still went back to paper notes. He was not anti-AI. He was tired of re-explaining context every day, like onboarding a new teammate every morning.',
        'This is a common pattern. Teams blame model quality, but the root problem is often context structure. They store what to do, but not why it matters, what constraints are non-negotiable, or what done actually means.',
        'Week one usually feels great. New tools, simple tasks, high patience. Week two is where reality shows up: complexity increases and three gaps appear—goal gap, boundary gap, and memory gap.',
        'The goal gap appears when tasks are labels, not instructions. “Improve copy” and “fix report” are memory aids for humans, not executable specs for collaborators.',
        'The boundary gap appears when constraints are missing. If timing, compliance, forbidden edits, or quality thresholds are unclear, AI fills gaps with generic assumptions. Generic assumptions create expensive rework.',
        'The memory gap appears when failures are not written back. Teams repeat the same mistakes because the system does not learn. One missed feedback loop can erase most productivity gains.',
        'A practical fix is to enforce four task fields: objective, constraints, inputs, and definition of done. Objective sets direction. Constraints prevent drift. Inputs anchor evidence. Definition of done makes outcomes testable.',
        'Then run a two-week stabilization cycle. Week one: template five recurring tasks. Week two: after each miss, add one anti-pattern rule and run a 30-minute review on completion rate, rework rate, and replaceability rate.',
        'Most teams notice a surprising effect: the model seems smarter without any model change. What changed was input quality, not model capability.',
        'If your workflow felt magical in week one and frustrating in week three, do not switch tools yet. Audit task structure first. In many cases, that single move restores consistency.',
      ],
    },
  },
  {
    id: 'ai-brief-template-that-reduces-rework',
    slug: 'ai-brief-template-that-reduces-rework',
    publishedAt: '2026-04-06',
    zh: {
      title: '一个能降低返工的 AI Brief 模板：先把“验收标准”写出来',
      summary: '多数 Brief 失败，不是因为写得短，而是缺少可验证标准。本文给你一套可直接复制的任务 Brief 写法。',
      readingTime: '9 分钟',
      content: [
        '“这个任务很简单，你先做个初稿。”如果你经常这样下任务，返工几乎是必然。因为“简单”只存在于你脑子里，不在协作者的输入里。对 AI 也一样。',
        '很多团队把时间花在 prompt 技巧上，却忽略了更关键的东西：验收标准。你一旦先定义“什么叫完成”，目标、语气、结构、长度会自动收敛。没有验收标准，所有输出都像对的；有了标准，才知道哪个能上线。',
        '我建议用五段式 Brief：目标、输入、约束、输出格式、验收标准。写法不复杂，但必须具体。比如“目标”要写业务结果，不是写动作；“约束”要写禁改项，不是写“尽量好一点”；“验收”要写可检查条件，不是写“更有说服力”。',
        '下面是一个可复制模板。目标：这篇文章用于落地页首屏，目标是提升试用点击。输入：上周版本、三条用户反馈、竞品页面链接。约束：语气务实，不夸张承诺，长度 150 字内。输出格式：一段主文案 + 一句 CTA。验收标准：包含痛点、机制、行动三要素。',
        '很多人写 Brief 会犯两个错。第一个错是“信息很多但没有优先级”，结果 AI 不知道该以什么为准。第二个错是“限制很多但没有验收”，结果输出只能靠感觉打分。',
        '解决方法很朴素：每个 Brief 只保留一个核心目标；每个目标配三条验收标准；每条标准都可在 1 分钟内检查完。你会发现这比“多轮聊天磨答案”更省时间。',
        '你可能担心写 Brief 太慢。现实通常相反：前面多花 3 分钟，后面少花 30 分钟。尤其是高频任务，第一次写成模板后，后续只改变量字段，协作成本会快速下降。',
        '最后一句：Brief 不是作文，它是接口文档。接口清晰，系统稳定。把“我想要什么”改成“我如何验收”，这是从手工协作走向系统协作的分水岭。',
      ],
    },
    en: {
      title: 'An AI Brief Template That Cuts Rework: Start with Definition of Done',
      summary:
        'Most briefs fail because they lack testable acceptance criteria. Use this practical template to get cleaner first drafts and fewer revision rounds.',
      readingTime: '9 min',
      content: [
        '“This is easy. Just draft it.” If that line appears in your workflow, rework is almost guaranteed. Easy exists in your head, not in the collaborator input. AI suffers from the same ambiguity.',
        'Many teams spend energy on prompt tricks and ignore the bigger lever: acceptance criteria. Once done is explicit, structure, tone, and scope converge quickly. Without done criteria, every draft looks plausible.',
        'Use a five-block brief: objective, inputs, constraints, output shape, and definition of done. Keep each block concrete. Objective should describe business outcome, not activity. Constraints should list hard boundaries. Done should be testable in minutes.',
        'A practical example: objective = improve click-through on hero copy. Inputs = previous version + user quotes + competitor references. Constraints = no hype, 150 words max, keep legal-safe claims. Output = one hero paragraph and one CTA line. Done = includes pain, mechanism, and action.',
        'Two common mistakes keep showing up. First, too much context with no priority. AI then optimizes for the wrong thing. Second, too many style requests with no measurable checks. Teams end up debating taste instead of quality.',
        'A useful rule is one objective, three done checks, and one-minute validation per check. This shifts collaboration from endless iteration to controlled execution.',
        'People worry that stronger briefs take too long. In practice, three extra minutes up front can remove thirty minutes of revision later. For recurring work, a reusable brief template compounds quickly.',
        'A brief is not creative writing. It is an interface contract. Clear interface, stable system. Moving from preference language to testable criteria is the turning point.',
      ],
    },
  },
  {
    id: 'content-loop-for-small-teams-with-ai',
    slug: 'content-loop-for-small-teams-with-ai',
    publishedAt: '2026-04-05',
    zh: {
      title: '小团队内容冷启动：用 AI 做一个每周可复用的内容循环',
      summary: '不是一口气写 30 篇，而是建立一个每周稳定可跑的内容循环：选题、起草、校对、分发、复盘。',
      readingTime: '9 分钟',
      content: [
        '很多团队一做内容就想“规模化”，结果第一周很猛，第二周掉速，第三周彻底停更。问题不是执行力差，而是流程设计错了。冷启动阶段最重要的不是数量，而是可持续节奏。',
        '我更推荐一个五步循环。第一步选题：从用户问题出发，而不是从你想说什么出发。第二步起草：AI 先给结构和素材草稿。第三步校对：人工补案例、删空话、查事实。第四步分发：一篇内容拆成 2~3 个渠道版本。第五步复盘：看曝光、点击、停留，决定下周迭代点。',
        '这里最容易偷懒的是第三步校对。很多“AI 味”文章不是因为模型差，而是因为没人把“经验和判断”写回去。你至少要补三样东西：真实场景、失败教训、明确建议。没有这些，读者只会觉得“信息密度低，像看模板”。',
        '冷启动别追求大而全，先做一个最小内容矩阵：每周 1 篇方法论长文 + 1 篇场景案例 + 1 条复盘短帖。长文负责搜索沉淀，案例负责转化，短帖负责保持活跃。',
        '当这个循环跑稳后，再谈自动化。否则你自动化的只是低质量重复。流程先稳定，AI 才能真正放大结果。',
        '一句话总结：内容增长不是“写得快”，而是“每周都能稳定写、稳定发、稳定复盘”。把这个循环跑起来，你的内容资产才会开始复利。',
      ],
    },
    en: {
      title: 'Content Cold Start for Small Teams: Build a Weekly AI-Assisted Content Loop',
      summary:
        'Do not try to publish 30 pieces at once. Build a repeatable weekly loop for topic selection, drafting, editing, distribution, and review.',
      readingTime: '9 min',
      content: [
        'Small teams often confuse intensity with sustainability. Week one looks heroic, week two slows down, week three goes silent. The bottleneck is usually workflow design, not motivation.',
        'A practical cold-start loop has five steps. Topic selection: start from user questions. Drafting: let AI produce structure and rough material. Editing: humans add evidence, remove filler, and verify claims. Distribution: repurpose one article into two or three channels. Review: inspect impressions, clicks, and engagement to pick one improvement for next week.',
        'The editing step is where quality is won or lost. Most AI-flavored content is not a model problem. It is a missing-editor problem. Add at least three things: real operating context, one failure lesson, and one concrete recommendation.',
        'For early-stage teams, keep the matrix small: one methodology article, one scenario case, and one short retrospective post per week. Long-form content compounds in search. Cases improve conversion. Short retrospectives keep your publishing rhythm alive.',
        'Only automate after the loop is stable. Otherwise you scale weak output faster. Stability first, automation second.',
        'A useful north star is simple: publish every week, learn every week, tighten one rule every week. That is how content becomes an asset instead of a campaign.',
      ],
    },
  },
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
