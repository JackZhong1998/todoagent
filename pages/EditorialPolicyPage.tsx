import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';

export const EditorialPolicyPage: React.FC = () => {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  usePageSeo({
    title: isZh ? '编辑政策 · TodoAgent' : 'Editorial Policy · TodoAgent',
    description: isZh
      ? 'TodoAgent 内容编辑政策：准确性、更新频率、来源标注与更正机制。'
      : 'TodoAgent editorial policy covering content quality, sourcing, updates, and corrections.',
    path: '/editorial-policy',
  });

  return (
    <MarketingLayout>
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <h1 className="text-4xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950">
          {isZh ? '编辑政策' : 'Editorial Policy'}
        </h1>
        <p className="mt-8 text-[17px] text-neutral-500 leading-relaxed">
          {isZh
            ? '我们发布的内容以真实使用经验和可复现实践为基础，避免夸张承诺。'
            : 'We publish content based on real usage experience and reproducible practices, without exaggerated claims.'}
        </p>
        <p className="mt-6 text-[17px] text-neutral-500 leading-relaxed">
          {isZh
            ? '涉及数据或方法时，我们会尽量提供来源、前提与限制条件，并定期更新过期信息。'
            : 'When we include data or methods, we provide sources, assumptions, and limitations, and we regularly update outdated information.'}
        </p>
        <p className="mt-6 text-[17px] text-neutral-500 leading-relaxed">
          {isZh
            ? '如果发现事实错误，请通过 hello@todoagent.cc 联系我们，我们会核实并更正。'
            : 'If you find factual errors, contact us at hello@todoagent.cc and we will review and correct them.'}
        </p>
      </section>
    </MarketingLayout>
  );
};
