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
    id: 'human-ai-routing-scorecard',
    slug: 'human-ai-routing-scorecard',
    publishedAt: '2026-04-11',
    zh: {
      title: '人机分工怎么定：一张任务路由评分表，避免“全交 AI”或“全靠人”',
      summary: '用风险、可验证性、重复频率、协作成本四个维度给任务打分，快速决定该人做、AI做还是协同做。',
      readingTime: '9 分钟',
      content: [
        '这两个月我看过很多团队做 AI 协作，最常见的极端有两个：要么什么都想交给 AI，要么被几次翻车吓到后什么都不敢交。两种做法最后都很累。前者返工高，后者效率低。',
        '真正可持续的做法不是“态度上支持 AI”，而是给任务一个路由规则：这件事该人主导、AI 主导，还是协同执行。规则清楚，团队就不需要每次开会争论“这单要不要给 AI”。',
        '我建议你用四个维度打分。第一，风险成本：做错的代价有多高。第二，可验证性：结果能不能在短时间客观验收。第三，重复频率：这个任务未来一个月会不会反复出现。第四，协作成本：把任务讲清楚需要花多少沟通成本。',
        '评分很简单，每个维度 1 到 5 分。风险越高分越高，越倾向人主导；可验证性和重复频率越高分越高，越适合 AI 主导；协作成本越高分越高，说明短期不适合直接丢给 AI。',
        '然后你可以按区间路由。A 区（高风险 + 低可验证）：人主导，AI 只做资料整理。B 区（低风险 + 高可验证 + 高频）：AI 主导，人做抽检。C 区（中风险 + 中可验证）：协同执行，AI 先出草稿，人来定方向和标准。',
        '这里有个关键细节：不要把“内容生成”当成一次动作，而要当成一个链路。比如写文章不是“让 AI 写完就发”，而是“选题 -> 结构 -> 初稿 -> 证据校对 -> 发布”。链路里每一段都可以分配不同主导方。',
        '很多团队在路由上翻车，不是因为打分不准，而是没有复盘更新。建议你每周看一次三项数据：返工率、超时率、人工介入次数。只要某个任务连续两周异常，就调整它的路由策略。',
        '你会发现，所谓“AI 适不适合这个任务”不是一次性判断，而是一个可迭代系统。今天不适合，不代表下个月不适合；今天适合，也不代表永远适合。',
        '最后给一个实操建议：先选 10 个高频任务跑这张评分表，不要全量上线。先小范围验证，你会很快看到哪些任务真正值得自动化，哪些任务必须保留人为判断。',
      ],
    },
    en: {
      title: 'How to Route Work Between Humans and AI: A Simple Task Scorecard',
      summary:
        'Use a four-factor scorecard—risk, verifiability, frequency, and collaboration cost—to decide when work should be human-led, AI-led, or hybrid.',
      readingTime: '9 min',
      content: [
        'Across teams adopting AI, I keep seeing two extremes. One group pushes everything to AI and drowns in rework. The other gets burned early and sends nothing to AI, then complains that productivity never improves. Both paths are expensive.',
        'A durable middle path is task routing. Instead of asking “Do we trust AI?” ask “Who should lead this task type under current constraints?” Once routing rules are explicit, you remove repeated debate from daily operations.',
        'A practical scorecard uses four factors. First, downside risk: what happens if this output is wrong. Second, verifiability: can quality be checked objectively in minutes. Third, recurrence: how often this task appears. Fourth, collaboration cost: how much effort it takes to brief the task clearly.',
        'Score each factor from one to five. Higher risk pushes toward human leadership. Higher verifiability and recurrence push toward AI leadership. Higher collaboration cost means the task may need process cleanup before AI can handle it reliably.',
        'Then map score patterns into routing zones. Zone A (high risk, low verifiability): human-led, AI as research support. Zone B (low risk, high verifiability, high recurrence): AI-led, human spot checks. Zone C (middle ground): hybrid flow where AI drafts and humans lock standards.',
        'One important nuance: treat work as a chain, not a single step. For example, publishing an article includes topic selection, structure, drafting, evidence checks, and release. Different stages can have different leaders.',
        'Most routing failures are not caused by bad first guesses. They happen because teams never update rules with performance data. Run a weekly routing review on three metrics: rework rate, delay rate, and manual intervention count.',
        'This turns routing from opinion into operations. Whether AI should lead a task becomes an evolving decision, not ideology. What is unsafe today may become safe after constraints improve.',
        'If you want to start quickly, pick ten recurring tasks and score only those. Small-scope trials create cleaner evidence and faster iteration than full-system rollout.',
      ],
    },
  },
  {
    id: 'human-ai-work-split-framework',
    slug: 'human-ai-work-split-framework',
    publishedAt: '2026-04-10',
    zh: {
      title: '人机分工怎么定：一个可落地的任务分流框架',
      summary:
        '不做“能不能用 AI”的哲学讨论，只用三件事打分：做错代价、能不能快速验收、会不会反复出现；对应落到人主导、AI 主导或协同流程。',
      readingTime: '10 分钟',
      content: [
        '我见过最耗团队的讨论，是每周开会争论“这件事该不该 AI 做”。判据如果停留在直觉，结论就会跟着情绪走：有人怕出事，有人怕显得落后。分流框架的意义，是把争论变成一张表：三件事看完，分工就能定七八成。',
        '三维就够，别再加维度把自己绕进去。第一，风险：错了会不会对外、对合同、对合规造成难以撤回的后果。第二，可验证性：你是否能在几分钟内用清单验收，而不是靠“感觉更像那么回事”。第三，可重复性：这类事未来两周会不会再来一遍，值得不值得写成固定套路。',
        '先处理极端情况，中间地带就清晰了。高风险——无论可重复性多高——默认不要 AI 独自定稿。最多让 AI 做资料整理与多版本草稿，签字与对外口径必须过人。反过来，低风险 + 可验证 + 高频，才是 AI 主扛的黄金区：格式转换、摘要、初稿扩写、批量改名归类。',
        '最容易误判的是“看起来很机械，其实很危险”的任务。例如给重要客户的致歉邮件：文字不长，好像能套模板，但一旦措辞越界就是品牌事故。这类任务常常会“可验证”（字数、结构都能检查），但仍应划入协同区：AI 出三版草案，人定调与定稿。',
        '另一个误判来源是把一次性探索当成高频任务。第一次做行业调研，AI 能帮不少忙，但如果没有沉淀成问题清单与引用规范，第二次仍会在同样地方翻车。可重复性不是“任务名字一样”，而是输入结构与验收结构稳定。不稳定就先别谈自动化。',
        '把分流落成三类标签即可。A 人主导：拍板、谈判、对外承诺、危机应对。B AI 主导：在清晰 Brief 下的规模化文字与数据处理，且必须配抽检。C 协同：AI 先铺开选项与草稿，人锁方向，再让 AI 批量改版。标签贴在任务标题前缀上，比写在文档里更容易执行。',
        '框架要配两条硬规则，否则很快变摆设。规则一：任何对外的最终稿都要有负责人字段，不能只写“AI 生成”。规则二：任何 B 类任务都要挂最小验收（三条以内），否则自动降级为 C 类。责任的颗粒度比分流更重要。',
        '如果你在读本站另一篇《人机分工怎么定：一张任务路由评分表》（同站博客），可以把这篇当作“入门版分流”：三维更快，适合做日常开单；评分表适合季度梳理任务族与争议仲裁。两者不冲突，像体温计和体检套餐的关系。',
        '落地建议：本周只挑 15 个真实任务练习归类，不要写宏大制度。归类错了也没关系，把错的分流记下来，往往比“写对一百次”更能补团队盲区。',
        '两周后你会感受到变化：讨论从“信不信任 AI”变成“这张任务卡缺了哪条约束”。后者能改，前者多半只能停在吵架里。',
      ],
    },
    en: {
      title: 'How to Split Work Between Humans and AI: A Practical Routing Framework',
      summary:
        'Skip philosophy. Score each task on three things—downside risk, fast verifiability, and repeatability—then route human-led, AI-led, or hybrid with two simple guardrails.',
      readingTime: '10 min',
      content: [
        'The most expensive meetings I see are weekly debates about “whether AI should do this.” If criteria stay intuitive, decisions track mood: some people fear accidents, others fear looking behind. A routing framework turns debate into a short table—three checks, and most tasks pick a lane.',
        'Three dimensions are enough; do not add more and drown. First, downside risk: can a mistake hit customers, contracts, or compliance in a hard-to-undo way? Second, verifiability: can you validate output with a checklist in minutes, not vibes? Third, repeatability: will this shape return within two weeks, worth the cost of a stable pattern?',
        'Handle extremes first; the middle clarifies. High risk—no matter how repeatable—defaults away from AI-only finals. At most, AI supports research and drafts; humans own sign-off and external voice. The golden AI-led zone is low risk, verifiable, and frequent: formatting, summaries, first-pass drafting, bulk restructuring.',
        'A common misread is “mechanical-looking but dangerous.” Example: an apology email to a major customer. It is short and template-adjacent, yet a wrong phrase becomes a brand incident. It may still be verifiable by structure, yet belongs in hybrid: AI proposes three drafts, humans choose tone and approve.',
        'Another misread treats one-off exploration like a repeatable task. AI can help on the first industry scan, but without a question list and citation norms, the second pass repeats the same failure. Repeatability is not “same title twice.” It means stable inputs and stable acceptance. If unstable, do not automate pride.',
        'Map to three tags. A human-led: trade-offs, negotiations, external commitments, incidents. B AI-led: scaled text and data work under a clear brief, always with spot checks. C hybrid: AI widens the option surface, humans lock direction, AI propagates edits. Prefix tags on task titles beat policy PDFs for adherence.',
        'Add two guardrails or the framework decays into theater. Guardrail one: every external final needs a named owner, not “the model did it.” Guardrail two: every B task ships with a minimal acceptance list (three checks or fewer); otherwise downgrade to hybrid by default. Ownership granularity matters more than taxonomy.',
        'If you also read the routing scorecard article, treat this piece as fast triage: three dimensions for daily intake; the scorecard for quarterly task-family reviews and disputes. They stack like a thermometer versus a full check-up—both useful, different cadence.',
        'For practice, classify fifteen real tasks this week. Skip grand governance. Wrong labels are data: misroutes reveal missing constraints faster than a hundred “correct” guesses.',
        'After two weeks, discussions shift from “do we trust AI?” to “which field is missing on this task card.” The second question is fixable; the first one mostly devolves into argument.',
      ],
    },
  },
  {
    id: 'from-chat-to-sop-system',
    slug: 'from-chat-to-sop-system',
    publishedAt: '2026-04-09',
    zh: {
      title: '从聊天到 SOP：把一次性产出变成可复用流程',
      summary: '聊天里“这次挺顺”不算资产；把目标、输入、约束、步骤和可验收标准写成 SOP，下一次协作才不从零解释。',
      readingTime: '10 分钟',
      content: [
        '我遇到过最可惜的工作方式，是团队把 AI 当成“临时打字员”。某次对话产出了一版不错的会议纪要，群里夸两句，然后文件进了聊天记录的坟场。下周还来一份纪要，同事又重新讲一遍背景、口径和风险点。',
        '问题不在于模型记不住你——而在于你没有把“成功的协作方式”留下。聊天天然是线性的，今天顺，明天不一定顺；SOP 的价值，是把顺的那次背后默会知识，变成下一个人、下一次、甚至另一个 Agent 都能照抄的结构。',
        '你可以把 SOP 理解成工程的接口文档：输入是什么、输出是什么、边界在哪里、怎样算通过。没有接口文档，系统偶尔能跑通，但会在边缘条件下随机崩溃。',
        '最小可用版本不需要很长。我建议固定五段，顺序别乱：任务目标（为解决什么问题）、输入材料（链接/文件/历史任务）、关键约束（时间、合规、禁改项）、执行步骤（三到七步，尽量可照做）、验收标准（能在五分钟内客观检查）。',
        '最容易写成空话的是“验收标准”。别说“语气专业”“更有说服力”，那只是在描述审美。要说“必须包含：背景一句、结论一句、三条行动项、负责人、截止时间”；或“每个建议都要附对应材料段落编号”。验收写得像测试用例，协作才会稳定。',
        '另一个常见坑是把 SOP 写成“百科”。上下文不是越长越好，而是刚好够决策：优先放结论、口径、反例；背景故事可以折叠成两三句，或单独用文档链接承接。SOP 的目标是降低启动成本，不是把读者淹没。',
        '落地节奏上，别贪多。每周挑两到三个“真的要反复做”的任务：周报整理、竞品对比表、Release Notes、客户回复草稿。判定标准也简单：同类任务在两周内出现三次以上，且结构基本一致，它就值得 SOP 化。',
        '沉淀之后，关键是回写。每次返工你不是在“骂模型”，而是在给 SOP 补短板：补一条禁词、补一条必须引用的来源、补一条只能由人点的确认环节。翻一次车，系统就硬一度；这比换十个 prompt 技巧都管用。',
        '你还可以给 SOP 加一个轻量的“版本号”习惯：在文件或任务里写 `SOP v0.3`，每次只改一处规则。团队会更容易接受迭代——大家怕的不是规则，而是规则天天推翻重来。',
        '把这事放到个人层面也一样：如果你总在同一种任务上重复解释，你不是缺时间，你是缺一份可复用的协作骨架。先从你最烦、最常做的那件开始写五段式，跑一周你就会明白：省下来的不是打字时间，是注意力。',
      ],
    },
    en: {
      title: 'From Chat Output to SOP: Turning One-Off Wins into Reusable Workflows',
      summary:
        'A good chat turn is not an asset. Turn objectives, inputs, constraints, steps, and testable acceptance into a lightweight SOP so the next run starts from a baseline.',
      readingTime: '10 min',
      content: [
        'The saddest pattern I see is teams treating AI like a temporary typist. One thread produces a solid meeting summary, people react with praise, then the artifact disappears into chat history. Next week the same summary appears again, with the same context re-explained from zero.',
        'The failure is not “the model forgot you.” The failure is that you never captured what made the collaboration work. Chat is linear: smooth today, fragile tomorrow. An SOP turns implicit know-how into a structure the next person—or the next session—can reuse.',
        'Think of an SOP as an interface contract for work: inputs, outputs, boundaries, and pass criteria. Without a contract, the system sometimes works and sometimes surprises you at the edges.',
        'Keep the first version small. Use five blocks in this order: objective (what problem you are solving), inputs (links, files, prior tasks), constraints (time, compliance, forbidden edits), steps (three to seven executable moves), and definition of done (objective checks you can run in minutes).',
        'The most common weakness is vague “done.” Replace taste language like “more professional” with tests: “must include one context line, one decision line, three actions with owners and dates,” or “every recommendation references a source paragraph.” Done should read like QA, not poetry.',
        'Another trap is encyclopedic context. Context should be “enough to decide,” not a biography. Lead with conclusions, definitions, and counterexamples; move long backstory into a linked doc. The goal is faster starts, not longer documents.',
        'On cadence, do not boil the ocean. Pick two or three recurring tasks each week: weekly updates, competitive matrices, release notes, customer reply drafts. If the same shape shows up three times in two weeks, it earns an SOP.',
        'After capture, prioritize write-back. Rework is not a personality conflict with the model; it is a signal to patch the SOP—add a banned phrase, require a citation, or mark a human-only approval gate. One incident should harden the system once. That beats prompt tinkering.',
        'A lightweight version habit also helps: label it `SOP v0.3` and change one rule per update. Teams tolerate iteration better when rules evolve predictably rather than resetting daily.',
        'At the individual level, if you keep re-explaining the same task type, you are rarely short on time—you are short on a reusable skeleton. Start with your most annoying repeat workflow, use the five-block shape for one week, and you will feel the difference: what you reclaim is attention, not keystrokes.',
      ],
    },
  },
  {
    id: 'weekly-human-ai-review-template',
    slug: 'weekly-human-ai-review-template',
    publishedAt: '2026-04-08',
    zh: {
      title: '一周一次的人机协作复盘：可直接套用的模板',
      summary:
        '固定 30 分钟、同一套议程：先看交付与拖延，再盯返工热点与分工前置，最后用完成率/返工率/可替代率决定下周只改哪一两处流程。',
      readingTime: '10 分钟',
      content: [
        '如果把 AI 只用在截止前夜的救火上，你会得到一种幻觉：有时特别神，有时特别拖。其实不是模型不稳定，是你的协作节奏不稳定。救急模式下，Brief 省略、验收含糊、上下文临时拼出来，质量当然像抽签。',
        '周复盘的目的不是写漂亮总结，而是把协作从“应激反应”拉回可预期区间。它只需要 30 分钟，但要求同一套议程、同一张表格、同一种记录方式，否则你会陷入“聊了很多，没有版本”的无效循环。',
        '我习惯把时间切成四块，每块大概 7~8 分钟。第一块看结果：这周计划了什么、真正交付了什么、哪些是硬延期。这里不要评判人，只标记任务：哪些卡在输入不齐，哪些卡在验收摇摆。',
        '第二块看质量：挑出本周返工次数最多的两到三个任务类型。返工不一定是 AI 的锅，常常是目标漂移——写着写着发现“要做的不是这个”。把类型记下来比追责更重要，因为你下周要改的是流程，不是谁的印象分。',
        '第三块看分工：有没有“本可以更早交给 AI 做草稿”的事情，被人手拖到后半周才启动。反过来也看：有没有“本该人先拍板”的事情，过早丢给模型导致方向走偏。分工复盘看的不是道德立场，而是时序是否合理。',
        '第四块只定动作，而且强硬限量：下周最多改一到两条规则。可以小到“凡是外部文案必须带三条件验收”，也可以大到“会议纪要必须链接原始录音/文档”。规则要少，但要能被执行、能被抽查。',
        '数据不用做得很科学，但要可重复。我建议这周只跟踪三个比率：完成率（完成/计划）、返工率（二轮以上修改的占比）、可替代率（你诚实评估后认为可以 AI 主导草稿的任务占比）。用整数、用本周样本，不追求小数点后两位。',
        '很多人复盘失败，是因为把它开成吐槽会。吐槽爽，但对系统没有补丁。你可以允许最后留三分钟“情绪卸货”，但前 27 分钟必须产出可写进文档的一条改动，否则这周复盘视为没发生。',
        '另一个典型失败是一次想改十条。结果下周一条都没落地。宁可连续四周每周只改一条，也不要一个月集中“大革命”。人机协作的规则和小公司产品一样，迭代比革命更接近真相。',
        '如果你已经在用 Brief 或 SOP（见本站其他文章），周复盘就是它们的“发布窗口”：把好用的约束写进模板，把翻车教训写成反例条款。没有回写，模板永远停在 v0.1。',
        '一周后你会看到变化不一定体现在“AI 更聪明”，而体现在“更少重复解释、更少夜战、更少同类型的二次修改”。这才是复盘该换回来的东西：不是激情，是可重复的省力。',
      ],
    },
    en: {
      title: 'A Weekly Human-AI Review Template You Can Run in 30 Minutes',
      summary:
        'Use a fixed 30-minute agenda: outcomes and slips first, then rework hotspots and routing timing, then let completion, rework, and replaceability rates choose one or two process tweaks for next week.',
      readingTime: '10 min',
      content: [
        'If AI only shows up during pre-deadline panic, you get a misleading pattern: sometimes magical, sometimes miserable. Usually it is not model instability. It is rhythm instability. Under fire, briefs shrink, acceptance criteria blur, and context gets stitched together at the last minute. Quality becomes lottery-like.',
        'A weekly review is not a performance essay. It is a control loop that moves collaboration from reactive firefighting toward predictable throughput. It can stay at thirty minutes as long as the agenda, sheet, and logging format stay consistent. Otherwise you get long conversations with no version history.',
        'Split the time into four slices, roughly seven to eight minutes each. Slice one: outcomes—what was planned, what shipped, what slipped hard. Do not judge people; tag tasks: blocked by missing inputs versus blocked by ambiguous acceptance.',
        'Slice two: quality—pick two or three task types with the most revision rounds this week. Rework is often goal drift, not “bad AI.” You discover midstream that the real ask was different. Recording patterns matters more than assigning blame, because next week you patch process, not reputations.',
        'Slice three: routing timing—what could have started earlier as an AI draft, but waited until humans were already behind. Also scan the reverse: what needed a human decision first, but was delegated too early and wandered off-course. This is sequencing, not ideology.',
        'Slice four: actions, with a hard cap—one or two rule changes for next week. Small is fine: “external copy must include three acceptance checks,” or “meeting notes must link to the source recording.” Rules must be enforceable and auditable.',
        'Metrics do not need academic precision; they need repeatability. Track three ratios for the week: completion (done over planned), rework (share of tasks with two or more revision rounds), and replaceability (honest estimate of tasks that could be AI-led for drafting). Use integers and the weekly sample. Skip false precision.',
        'Reviews fail when they become venting sessions. Venting feels good and upgrades nothing. You can reserve three minutes at the end for emotion, but the first twenty-seven minutes must produce one written change. If not, the review did not happen.',
        'The other classic failure is a ten-item transformation plan. Next week, zero items stick. Four weeks of one change each beats one month of “big revolution.” Routing rules behave like product: iteration beats theater.',
        'If you already use briefs or SOPs, treat the weekly review as their release window: promote stable constraints into templates, promote failures into anti-pattern clauses. Without write-back, templates freeze at v0.1 forever.',
        'After a few cycles, the win may not look like “smarter AI.” It looks like less repeated explanation, fewer night shifts, and fewer second passes on the same failure mode. That is what a review should trade for—not motivation, but repeatable leverage.',
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
      summary:
        '冷启动别追 30 篇突击；用选题、起草、校对、分发、复盘五步做成固定周循环，并配最小验收，让 AI 增产不实增“水稿”。',
      readingTime: '11 分钟',
      content: [
        '很多小团队一立项内容就想“上来就规模化”。结果常见剧本是：第一周熬夜写三篇，第二周改需求、写不动了，第三周账号安静得像离职交接。问题通常不是懒，而是把内容当成了战役，没有当成系统。',
        '冷启动阶段唯一值得优先优化的指标，是你能不能扛住“可重复的一周”。不算加班的前提下，能否连续四周按同一节奏产出？能，再谈扩量；不能，先缩范围，别让 AI 单独背锅。',
        '我用的循环就五步，顺序别轻易调换。一、选题：从用户原话出发——搜索词、客服工单、销售异议、社群提问——而不是从“我们想树立什么形象”出发。形象是结果，问题是入口。',
        '二、起草：让 AI 做结构和素材拼图，别让它直接替你拍板结论。给它 Brief：读者是谁、读完要采取什么动作、必须覆盖哪三个争论点、哪些事实必须引用来源。写法与《一个能降低返工的 AI Brief 模板》那篇是同一套“接口思维”，只是场景换成文章。',
        '三、校对：这是决定去 AI 味的一刀。至少人工补四样东西：一个具体场景（时间、人物、约束）、一个失败或遗憾、一个可执行 checklist、以及你明确反对的做法。缺一，文章就容易飘。',
        '四、分发：一篇长文至少拆两个出口：一个偏搜索（标题含问题、首段先答结论）、一个偏社交（故事切口、清单体）。同一观点，两种读法，不等于水文重复，而是尊重不同场景的注意力。',
        '五、复盘：小团队别迷信大而全的仪表盘，每周只看三件事就够：有没有稳定发出去；哪篇带来了有效互动或线索；下周选题库里新增了什么真实问题。把结论写进“下周 Brief 前缀”，这和《一周一次的人机协作复盘》是同一套控制回路，只是对象换成内容管线。',
        '建议固定最小矩阵，别随心情加码：每周一篇方法论长文（承搜索）、一篇场景案例（承信任）、一条短复盘或更新（承活跃）。长文不等于字数竞赛，宁可一千五百字写透一个问题，也不要四千字堆术语。',
        '只有当起草、校对、分发都能在固定时间盒里跑完，才值得上自动化：模板库、检查清单、批处理提示。否则你只是自动化了废话，搜索表现和风险会一起上来。',
        '最后一句话给负责人：内容冷启动的终点，不是“我们用过 AI”，而是“我们每周都能把一种用户困惑讲清楚，并留下可维护的公开口径”。这与把对话沉淀成 SOP 是同一类资产，只是阵地从任务系统换到了公开发布。',
        '若你已经在业务里搭好了人机分流与 SOP，把它们平移到内容团队，成本会很低；若还没有，把这条内容循环当作最小演练场，通常比开一场全公司 AI 转型大会更实在。',
      ],
    },
    en: {
      title: 'Content Cold Start for Small Teams: Build a Weekly AI-Assisted Content Loop',
      summary:
        'Skip the thirty-post sprint. Run a five-step weekly loop—topics, drafting, editing, distribution, review—with minimal acceptance checks so AI scales throughput without scaling slop.',
      readingTime: '11 min',
      content: [
        'Small teams often launch content like a battle campaign. The usual arc: week one ships three heroic posts, week two absorbs real work and stalls, week three the feed goes quiet as if the account changed owners. The bottleneck is rarely laziness. It is missing systems.',
        'During cold start, optimize one metric first: whether you can survive a repeatable week without overtime theater. Can you ship for four straight weeks on the same rhythm? If yes, raise volume. If no, shrink scope before blaming the model.',
        'Keep five steps in order. One, topic selection: start from user language—search queries, support tickets, sales objections, community questions—not from “brand pillars.” Brand is an outcome; questions are the inlet.',
        'Two, drafting: let AI assemble structure and evidence, not invent your conclusions. Give a brief—audience, desired action after reading, three debate points to cover, and which facts require citations. Same interface mindset as a strong task brief; the article on brief templates on this site is a usable starting pattern.',
        'Three, editing: this is where “AI flavor” dies or survives. Humans should add at least four elements: one concrete scene (time, people, constraints), one failure or regret, one executable checklist, and one explicit anti-pattern you reject. Skip any, and the piece floats.',
        'Four, distribution: split one article into at least two surfaces—search-first (question-led title, answer-led intro) and social-first (story hook or checklist). Same insight, different attention economics—not duplicate spam.',
        'Five, review: ignore vanity overload. Track three signals weekly: did we ship on rhythm, which piece sparked useful engagement or leads, and what new real questions entered the topic backlog. Write conclusions into next-week brief prefixes—the same control loop as a team retro, applied to the content pipeline.',
        'Hold the matrix small: one methodology article (search), one scenario case (trust), one short retrospective or changelog-style post (cadence). Clarity beats word count. Fifteen hundred words that resolve one doubt beat four thousand words of jargon karaoke.',
        'Automate only after drafting, editing, and distribution fit a predictable time box. Otherwise automation multiplies weak output and drags search risk along.',
        'For owners, cold start finishes when the team can name one user confusion cleared every week—and leave a maintainable public stance in writing. That asset class matches SOP thinking, just published outward instead of staying in task tools.',
        'If you already route human–AI work and capture SOPs elsewhere, porting the same habits to content is cheap. If not, treat this loop as the smallest rehearsal stage. It usually beats a company-wide “AI transformation” memo.',
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

export const getRelatedBlogPosts = (slug: string, limit = 3): BlogPost[] => {
  return getBlogPostsSorted()
    .filter((post) => post.slug !== slug)
    .slice(0, limit);
};

export const pickBlogLocale = (post: BlogPost, language: Language): BlogPostLocale => {
  return post[language];
};
