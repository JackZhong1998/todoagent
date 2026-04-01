import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';
import { LegalMarkdown } from '../components/LegalMarkdown';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';
import privacyEn from '../content/legal/privacy.en.md?raw';
import privacyZh from '../content/legal/privacy.zh.md?raw';

export const PrivacyPage: React.FC = () => {
  const { language, t } = useLanguage();
  const content = language === 'zh' ? privacyZh : privacyEn;

  usePageSeo({
    title: t.privacy.documentTitle,
    description: t.seo.privacy.metaDescription,
    path: '/privacy',
  });

  return (
    <MarketingLayout>
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <LegalMarkdown content={content} />
      </section>
    </MarketingLayout>
  );
};
