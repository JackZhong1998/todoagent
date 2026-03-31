export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string[];
  publishedAt: string;
  readingTime: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: 'attention-workflow-j-plan',
    title: 'Attention 工作法：如何用 TodoAgent 实现上四休三',
    slug: 'awf-s4x3',
    summary:
      '把注意力管理和待办协作结合起来，用两周建立一个可持续迭代的个人执行系统。',
    publishedAt: '2026-03-30',
    readingTime: '6 min',
    content: [
      'TodoAgent 的核心不是把任务写得更漂亮，而是把注意力切片和上下文沉淀结合起来。你不再只是在勾选任务，而是在记录自己和 Agent 如何协作做成事情。',
      '第一周建议只做三件事：固定每天 2 次回顾、所有任务都写清楚下一步动作、每个任务都补充上下文。这样可以让 Agent 在下一次协作时理解你的真实状态。',
      '第二周开始引入节奏实验：把高强度任务压缩到 4 天，保留 3 天做恢复、总结和学习。关键点是每个任务结束后都要留下可复用的知识片段。',
      '两周之后你会得到一套真正可持续的工作系统：任务不再越积越乱，AI 协作效率也会随着上下文资产积累而持续提升。',
    ],
  },
  {
    id: 'agent-collaboration-pattern',
    title: '和 Agent 紧密协作的 5 个实践',
    slug: 'acp-5p',
    summary:
      '从需求拆解到结果复盘，5 个可直接套用的协作模式，帮助你把 AI 从工具变成队友。',
    publishedAt: '2026-03-25',
    readingTime: '5 min',
    content: [
      '第一，先给 Agent 明确的工作边界。任务目标、验收标准、上下文来源缺一不可。',
      '第二，任务拆成半天内能完成的小闭环。闭环越短，协作反馈越快。',
      '第三，每次交互都补一段“为什么这么做”的说明，这能显著提升后续连续协作质量。',
      '第四，建立你的个人提示模板库，把高频场景标准化；第五，复盘失败案例，把问题映射回上下文缺口，而不是只怪模型表现。',
    ],
  },
  {
    id: 'context-asset-method',
    title: '把 ToDo 变成 Context 资产',
    slug: 'tca-method',
    summary:
      '任务完成后如何积累可复用 context，让下一次执行更快、更稳、更有质量。',
    publishedAt: '2026-03-18',
    readingTime: '7 min',
    content: [
      '很多人使用待办系统时只关注“做完没”，而忽略“为什么做、怎么做、下次怎么更快做”。',
      'TodoAgent 的方式是把每个任务视为一次知识生产：任务目标、关键决策、踩坑记录、最终结果，这四项就是最小 context 单元。',
      '当 context 形成资产，你会看到两个变化：一是 Agent 对你的偏好理解越来越准；二是你自己做决策的速度越来越快。',
      '长期来看，任务清单不再只是执行列表，而是你和 Agent 共同维护的“工作记忆系统”。',
    ],
  },
];

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find((post) => post.slug === slug);
};
