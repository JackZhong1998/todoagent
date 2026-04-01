import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  const a = t.about;
  usePageSeo({
    title: t.seo.about.title,
    description: t.seo.about.description,
    path: '/about',
  });

  return (
    <MarketingLayout>
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <h1 className="text-4xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950">{a.title}</h1>
        <p className="mt-8 text-[17px] text-neutral-500 leading-relaxed">{a.p1}</p>
        <p className="mt-6 text-[17px] text-neutral-500 leading-relaxed">{a.p2}</p>
        <p className="mt-6 text-[17px] text-neutral-500 leading-relaxed">{a.p3}</p>
      </section>
    </MarketingLayout>
  );
};
