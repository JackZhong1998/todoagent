import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { usePageSeo } from '../utils/pageSeo';
import { buildHomePageJsonLd } from '../utils/seoJsonLd';

export const HomePage: React.FC = () => {
  const { t, language } = useLanguage();
  const { isLoggedIn } = useAuth();
  const { home: h } = t;
  const jsonLd = useMemo(() => buildHomePageJsonLd(language, t), [language, t]);
  usePageSeo({
    title: t.seo.home.title,
    description: t.seo.home.description,
    path: '/',
    jsonLd,
  });
  const features = [
    { ...h.features.attention, icon: Target },
    { ...h.features.context, icon: Sparkles },
    { ...h.features.system, icon: CheckCircle2 },
  ];

  return (
    <MarketingLayout>
      <section className="max-w-5xl mx-auto px-6 sm:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="mkt-animate-in space-y-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">{h.badge}</p>
            <h1 className="mt-5 text-[2.5rem] sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.07] tracking-[-0.03em] text-neutral-950">
              <span className="block">TodoAgent</span>
              <span className="block mt-3 text-xl sm:text-2xl lg:text-[1.65rem] font-medium text-neutral-500 leading-snug tracking-tight max-w-lg">
                {h.headlineSub}
              </span>
            </h1>
            <p className="mt-10 text-[17px] sm:text-lg text-neutral-500 leading-relaxed max-w-xl">{h.heroDescription}</p>
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full bg-neutral-950 text-white text-[15px] font-medium hover:bg-neutral-800 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
              >
                {isLoggedIn ? h.ctaStartWithAi : h.ctaStartFree}
                <ArrowRight size={17} strokeWidth={2} aria-hidden className="opacity-90" />
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center justify-center min-h-12 px-2 text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] rounded-full"
              >
                {h.ctaReadBlog}
              </Link>
              <Link
                to="/solutions"
                className="inline-flex items-center justify-center min-h-12 px-2 text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] rounded-full"
              >
                {h.ctaBrowseSolutions}
              </Link>
            </div>
          </div>

          <div
            className="relative mkt-animate-in lg:pt-4"
            style={{ animationDelay: '80ms' }}
          >
            <div className="rounded-2xl border border-neutral-200/90 bg-[#fafafa] p-8 sm:p-10">
              <div className="space-y-6">
                <div className="pb-6 border-b border-neutral-200/80">
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-neutral-400">{h.demoTodayFocusLabel}</p>
                  <p className="mt-3 text-lg font-semibold text-neutral-900 tracking-tight">{h.demoTodayFocusTitle}</p>
                  <p className="mt-2 text-[15px] text-neutral-500 leading-relaxed">{h.demoTodayFocusDesc}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-neutral-400">{h.demoLoopLabel}</p>
                  <p className="mt-3 text-lg font-semibold text-neutral-900 tracking-tight">{h.demoLoopTitle}</p>
                  <p className="mt-2 text-[15px] text-neutral-500 leading-relaxed">{h.demoLoopDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 sm:px-8 pb-28 sm:pb-36" aria-labelledby="home-features-heading">
        <div className="h-px w-full bg-neutral-200/90 mb-16 sm:mb-20" aria-hidden />
        <h2
          id="home-features-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400 mb-12 sm:mb-14"
        >
          {h.featuresSectionTitle}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-14 lg:gap-16">
          {features.map(({ title, description, icon: Icon }, i) => (
            <article
              key={title}
              className="mkt-animate-in"
              style={{ animationDelay: `${140 + i * 60}ms` }}
            >
              <div className="w-10 h-10 flex items-center justify-center text-neutral-400" aria-hidden>
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-neutral-900 tracking-tight">{title}</h3>
              <p className="mt-3 text-[15px] text-neutral-500 leading-relaxed">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="max-w-3xl mx-auto px-6 sm:px-8 pb-28 sm:pb-36"
        aria-labelledby="home-faq-heading"
      >
        <h2
          id="home-faq-heading"
          className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-neutral-950"
        >
          {t.seo.faqTitle}
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
    </MarketingLayout>
  );
};
