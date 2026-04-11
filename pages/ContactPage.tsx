import React, { useMemo } from 'react';
import { MarketingLayout } from '../components/MarketingLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';
import { buildContactPageJsonLd } from '../utils/seoJsonLd';

export const ContactPage: React.FC = () => {
  const { t, language } = useLanguage();
  const c = t.contact;
  const jsonLd = useMemo(() => buildContactPageJsonLd(language, t), [language, t]);

  usePageSeo({
    title: t.seo.contact.title,
    description: t.seo.contact.description,
    path: '/contact',
    jsonLd,
  });

  return (
    <MarketingLayout>
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <h1 className="text-4xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950">{c.title}</h1>
        <p className="mt-8 text-[17px] text-neutral-500 leading-relaxed">{c.intro}</p>
        <p className="mt-6 text-[17px] text-neutral-500 leading-relaxed">
          <span className="text-neutral-700 font-medium">{c.emailLabel}: </span>
          <a
            href={`mailto:${c.mailtoCta}`}
            className="text-[#0071e3] hover:text-[#0077ed] underline underline-offset-2"
          >
            {c.mailtoCta}
          </a>
        </p>
        <p className="mt-4 text-[15px] text-neutral-400">{c.responseTime}</p>
      </section>
    </MarketingLayout>
  );
};
