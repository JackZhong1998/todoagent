import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';
import { LegalMarkdown } from '../components/LegalMarkdown';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';
import termsEn from '../content/legal/terms.en.md?raw';
import termsZh from '../content/legal/terms.zh.md?raw';

export const TermsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const content = language === 'zh' ? termsZh : termsEn;

  usePageSeo({
    title: t.terms.documentTitle,
    description: t.seo.terms.metaDescription,
    path: '/terms',
  });

  return (
    <MarketingLayout>
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <LegalMarkdown content={content} />
      </section>
    </MarketingLayout>
  );
};
