import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const { isLoggedIn } = useAuth();
  const isZh = language === 'zh';
  const features = [
    {
      title: isZh ? 'Attention 工作法驱动' : 'Powered by Attention Workflow',
      description: isZh
        ? '以 ToDo 为核心组织你的注意力流，把任务拆成可执行动作，让你和 Agent 始终聚焦当下最关键的下一步。'
        : 'Turn every task into an actionable step so you and your Agent always stay focused on the most important next move.',
      icon: Target,
    },
    {
      title: isZh ? '人机协作持续积累 context' : 'Compound Context Through Collaboration',
      description: isZh
        ? '每一次协作都沉淀上下文，Agent 会越来越懂你的目标、偏好和工作节奏，形成长期复利。'
        : 'Each collaboration builds reusable context, so your Agent gets better at matching your goals, style, and rhythm.',
      icon: Sparkles,
    },
    {
      title: isZh ? '两周建立高质量执行系统' : 'Build Your System in Two Weeks',
      description: isZh
        ? '通过可复盘、可追踪的任务机制，在两周内搭建稳定 workflow，向“上四休三”的节奏迈进。'
        : 'With reviewable and trackable loops, build a reliable execution system in two weeks and work toward a 4-day week.',
      icon: CheckCircle2,
    },
  ];

  return (
    <MarketingLayout>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              {isZh ? '面向深度工作的协作 SaaS' : 'SaaS for Focused Work Collaboration'}
            </span>
            <h1 className="mt-5 text-4xl md:text-5xl font-black leading-tight text-gray-900">
              TodoAgent
              <br />
              {isZh ? '与你在工作上紧密协作的 Agent' : 'Your Agent for Deep Work Collaboration'}
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              {isZh
                ? '运用超适合 J 人和 LLMs 的 Attention 工作法，以 Todolist 为核心完成协作和积累 context，两周帮你实现上四休三。'
                : 'Use an attention-first workflow built for planners and LLMs. Collaborate through your todo list, compound context, and move toward a 4-day workweek in two weeks.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black transition-colors"
              >
                {isLoggedIn
                  ? (isZh ? '开始与 AI 工作' : 'Start Working with AI')
                  : (isZh ? '立即免费使用' : 'Start for Free')}
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition-colors"
              >
                {isZh ? '阅读博客' : 'Read Blog'}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-xl shadow-gray-200/50">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Today Focus</p>
                <p className="mt-2 font-semibold text-gray-900">
                  {isZh ? '拆解本周目标并生成可执行 ToDo' : 'Break weekly goals into actionable todos'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {isZh ? 'Agent 已基于你的历史 context 生成下一步建议。' : 'Agent generates next steps from your historical context.'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100">
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Collaboration Loop</p>
                <p className="mt-2 font-semibold text-gray-900">
                  {isZh ? '任务执行 - 反馈 - 复盘 - 沉淀' : 'Execute - Feedback - Review - Compound'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {isZh ? '让每次协作都成为下一次高效工作的基础。' : 'Turn each session into a stronger base for the next one.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid md:grid-cols-3 gap-5">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Icon size={18} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
};
