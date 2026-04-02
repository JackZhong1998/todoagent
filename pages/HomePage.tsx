import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Bot, CheckCircle2, Gauge, Layers, ShieldCheck, Target, Workflow } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { usePageSeo } from '../utils/pageSeo';
import { buildHomePageJsonLd } from '../utils/seoJsonLd';
import { ProductWorkspaceIllustration } from '../components/ProductWorkspaceIllustration';

export const HomePage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isLoggedIn } = useAuth();
  const jsonLd = useMemo(() => buildHomePageJsonLd(language, t), [language, t]);
  usePageSeo({
    title: t.seo.home.title,
    description: t.seo.home.description,
    path: '/',
    jsonLd,
  });
  const isZh = language === 'zh';
  const copy = isZh
    ? {
        heroGuideTitle: '做四休三实现指南',
        focusWord: 'FOCUS',
        heroQuestion: '你知道你有多少工作能交给AI吗？',
        heroBrandLine: 'TodoAgent',
        heroSubline: '帮你专注、帮你分析、帮你干活',
        ctaPrimary: isLoggedIn ? '进入工作台' : '立即免费开始',
        ctaSecondary: '查看工作法',
        processTitle: 'Attention工作法',
        process: [
          {
            title: '你专注于任务',
            desc: '你写下目标和背景信息，让自己更清晰、让AI更懂你',
          },
          {
            title: 'AI 获得Context',
            desc: '为你分析每个todo的「AI替代性」，为你整理工作SOP，让你更懂你、更懂AI能力边界',
          },
          {
            title: 'AI主动分担',
            desc: '一周的紧密工作，形成你与AI的清晰分工思路',
          },
        ],
        featureTitle: '功能亮点',
        features: [
          ['任务专注模式', '每个任务绑定目的、约束、完成标准，避免忙而无产出。', Target],
          ['替代性分析引擎', '按任务输出可替代 / 不可替代 / 待观察三类判断。', Brain],
          ['AI 执行接管', '确认后自动执行可替代步骤，减少重复机械劳动。', Bot],
          ['SOP 自动沉淀', '每次完成任务都更新你的执行手册，形成长期资产。', Layers],
          ['重复任务分工推荐', '下次同类任务来时，直接给出人机协作建议。', Workflow],
          ['可追溯记录', '每次建议、执行、复盘都有记录，决策更可控。', ShieldCheck],
          ['效率仪表盘', '看到你专注度、替代率、自动化收益的变化趋势。', Gauge],
          ['渐进式升级', '从辅助到半自动再到自动，让系统与你一起成长。', CheckCircle2],
        ] as const,
        compareTitle: '竞品对比',
        compareColTodo: '待办工具',
        compareColAgent: '通用 Agent',
        compareRows: [
          ['任务级 context 与沉淀', '弱；多为清单本身', '散在对话里，难追溯', '强；绑定每条待办、可持续复用'],
          ['AI 可替代性判断', '基本没有', '泛泛建议，难结构化', '按任务分析、可积累、可对照'],
          ['工作法与 SOP', '不强调', '一般不形成稳定流程文档', 'Attention 工作法 + 自动沉淀 SOP'],
          ['人机分工闭环', '主要靠人自己执行', '多为单次问答', '专注 → 分析 → 分担，约一周可成型'],
          ['做四休三的减负路径', '通常不涉及', '不面向工作节奏设计', '方法论驱动、系统性地省出时间'],
        ],
        faqCta: '常见问题',
        finalTitle: '把注意力留给不可替代的判断',
        finalDesc: '把可替代的执行交给 AI，把最关键的决定留给你自己。',
        productMockNote: '示意图 · 实际界面可能略有差异',
      }
    : {
        heroGuideTitle: 'Guide to a four-day workweek',
        focusWord: 'FOCUS',
        heroQuestion: 'How much of your work could you actually hand off to AI?',
        heroBrandLine: 'TodoAgent',
        heroSubline: 'Helps you focus, analyze, and get the work done.',
        ctaPrimary: isLoggedIn ? 'Open Workspace' : 'Start Free',
        ctaSecondary: 'View methodology',
        processTitle: 'Attention methodology',
        process: [
          {
            title: 'You focus on the task',
            desc: 'Write goals and background so you think more clearly—and the AI understands you better.',
          },
          {
            title: 'AI gains context',
            desc: 'For each todo it analyzes AI replaceability and organizes your SOP, so you see yourself and AI limits more clearly.',
          },
          {
            title: 'AI shares the load',
            desc: "After a week of working closely with you, a clear split of who does what takes shape.",
          },
        ],
        featureTitle: 'Feature highlights',
        features: [
          ['Task focus mode', 'Attach goal, constraints, and done criteria to every task.', Target],
          ['Replaceability engine', 'Classifies work into replaceable, non-replaceable, and uncertain.', Brain],
          ['AI execution handoff', 'Automatically runs replaceable steps after your confirmation.', Bot],
          ['Auto SOP memory', 'Every completed task updates your reusable execution handbook.', Layers],
          ['Repeat-task recommendations', 'Instant human-AI split suggestions for similar future tasks.', Workflow],
          ['Traceable logs', 'Every recommendation and execution is reviewable and controllable.', ShieldCheck],
          ['Efficiency dashboard', 'Track focus quality, replaceability ratio, and automation gains.', Gauge],
          ['Progressive automation', 'Scale from assist to semi-auto to auto, without losing control.', CheckCircle2],
        ] as const,
        compareTitle: 'How we compare',
        compareColTodo: 'Todo apps',
        compareColAgent: 'General agents',
        compareRows: [
          ['Task-level context', 'Weak; mostly the list itself', 'Buried in chat, hard to reuse', 'Strong; tied to every todo, compounding'],
          ['AI replaceability', 'Rarely offered', 'Informal tips, not structured', 'Per-task analysis you can build on'],
          ['Method & SOP', 'Not the focus', 'Rarely a durable workflow doc', 'Attention method + auto SOP'],
          ['Human–AI loop', 'You execute alone', 'Mostly one-off Q&A', 'Focus → analyze → delegate; ~shape a week'],
          ['Path to shorter weeks', 'Not addressed', 'Not designed around work rhythm', 'Method-led load-shedding over time'],
        ],
        faqCta: 'Common questions',
        finalTitle: 'Keep attention on non-replaceable decisions',
        finalDesc: 'Delegate replaceable execution to AI and keep critical judgment human.',
        productMockNote: 'Illustrative mockup · Actual UI may vary',
      };

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden max-w-6xl mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32 text-center">
        <p className="mkt-animate-in text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">{copy.heroGuideTitle}</p>
        <h1 className="mkt-animate-in mt-5 text-[5rem] leading-none sm:text-[8rem] md:text-[10rem] lg:text-[12rem] font-semibold tracking-[-0.05em] text-neutral-950">
          {copy.focusWord}
        </h1>
        <div
          className="mkt-animate-in mx-auto mt-7 max-w-3xl space-y-4 text-[16px] sm:text-[18px] md:text-[19px] text-neutral-600 leading-relaxed"
          aria-label={isZh ? '首页主张' : 'Home value props'}
        >
          <p>{copy.heroQuestion}</p>
          <p className="text-[1.35rem] sm:text-[1.6rem] md:text-[1.75rem] font-semibold text-neutral-950 tracking-tight">
            {copy.heroBrandLine}
          </p>
          <p>{copy.heroSubline}</p>
        </div>
        <div className="mkt-animate-in mt-10 flex flex-wrap justify-center items-center gap-4">
          <Link
            to="/app/todo"
            className="inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full bg-neutral-950 text-white text-[15px] font-medium hover:bg-neutral-800 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
          >
            {copy.ctaPrimary}
            <ArrowRight size={17} strokeWidth={2} aria-hidden className="opacity-90" />
          </Link>
          <a
            href="#workflow"
            className="inline-flex items-center justify-center min-h-12 px-5 rounded-full border border-neutral-300 text-[15px] font-medium text-neutral-700 hover:border-neutral-400 hover:text-neutral-900 transition-colors duration-150"
          >
            {copy.ctaSecondary}
          </a>
        </div>

        <div className="focus-wave-bg pointer-events-none absolute inset-x-0 -bottom-24 h-72" aria-hidden />
      </section>

      <section id="workflow" className="max-w-6xl mx-auto px-6 sm:px-8 pb-24 sm:pb-32">
        <div className="h-px w-full bg-neutral-200/90 mb-14 sm:mb-16" aria-hidden />
        <h2 className="text-2xl sm:text-[2rem] font-semibold tracking-tight text-neutral-950">{copy.processTitle}</h2>
        <div className="mt-9 grid md:grid-cols-3 gap-6">
          {copy.process.map((step, idx) => (
            <article key={step.title} className="rounded-2xl border border-neutral-200 bg-[#fcfcfc] p-6">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">0{idx + 1}</p>
              <h3 className="mt-3 text-lg font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-2 text-[15px] text-neutral-600 leading-relaxed">{step.desc}</p>
            </article>
          ))}
        </div>
        <ProductWorkspaceIllustration isZh={isZh} />
        <p className="mt-3 text-center text-[12px] text-neutral-400">{copy.productMockNote}</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-24 sm:pb-32">
        <h2 className="text-2xl sm:text-[2rem] font-semibold tracking-tight text-neutral-950">{copy.featureTitle}</h2>
        <div className="mt-9 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {copy.features.map(([title, desc, Icon]) => (
            <article key={title} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-neutral-900">{title}</h3>
              <p className="mt-2 text-[14px] text-neutral-600 leading-relaxed">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-8 pb-24 sm:pb-32">
        <h2 className="text-2xl sm:text-[2rem] font-semibold tracking-tight text-neutral-950">{copy.compareTitle}</h2>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-5 py-4 font-medium">{isZh ? '维度' : 'Dimension'}</th>
                <th className="px-5 py-4 font-medium">{copy.compareColTodo}</th>
                <th className="px-5 py-4 font-medium">{copy.compareColAgent}</th>
                <th className="px-5 py-4 font-semibold text-neutral-900">TodoAgent</th>
              </tr>
            </thead>
            <tbody>
              {copy.compareRows.map((row) => (
                <tr key={row[0]} className="border-t border-neutral-200">
                  <td className="px-5 py-4 text-neutral-700">{row[0]}</td>
                  <td className="px-5 py-4 text-neutral-500">{row[1]}</td>
                  <td className="px-5 py-4 text-neutral-500">{row[2]}</td>
                  <td className="px-5 py-4 text-neutral-900 font-medium">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 sm:px-8 pb-28 sm:pb-32" aria-labelledby="home-faq-heading">
        <h2 id="home-faq-heading" className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-neutral-950">
          {copy.faqCta}
        </h2>
        <dl className="mt-10 space-y-8">
          {t.seo.faq.map((item) => (
            <div key={item.q}>
              <dt className="text-[17px] font-semibold text-neutral-900 tracking-tight">{item.q}</dt>
              <dd className="mt-2 text-[15px] text-neutral-500 leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="max-w-5xl mx-auto px-6 sm:px-8 pb-28 sm:pb-36">
        <div className="rounded-3xl border border-neutral-200 bg-neutral-950 text-white px-8 sm:px-14 py-14 text-center">
          <p className="text-[11px] tracking-[0.22em] uppercase text-neutral-400">{isZh ? '最终目标' : 'Final goal'}</p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">{copy.finalTitle}</h2>
          <p className="mt-4 text-neutral-300 text-[16px] leading-relaxed">{copy.finalDesc}</p>
          <Link
            to="/app/todo"
            className="mt-8 inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full bg-white text-neutral-950 text-[15px] font-semibold hover:bg-neutral-200 transition-colors duration-150"
          >
            {copy.ctaPrimary}
            <ArrowRight size={17} strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};
