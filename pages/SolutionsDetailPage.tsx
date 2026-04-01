import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';
import {
  getPseoPersonaBySlug,
  getRelatedPersonas,
  pickPseoLocale,
} from '../content/pseoPersonas';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';
import { buildPseoDetailJsonLd } from '../utils/pseoJsonLd';

export const SolutionsDetailPage: React.FC = () => {
  const { slug = '' } = useParams();
  const persona = getPseoPersonaBySlug(slug);
  const { t, language } = useLanguage();
  const path = `/solutions/${slug}`;

  const localized = persona ? pickPseoLocale(persona, language) : null;
  const jsonLd = useMemo(() => {
    if (!persona) return undefined;
    const body = pickPseoLocale(persona, language);
    return buildPseoDetailJsonLd(persona, body, path, language);
  }, [persona, path, language]);

  usePageSeo({
    title: localized?.pageTitle ?? t.seo.solutionsHub.title,
    description: localized?.metaDescription ?? t.seo.solutionsHub.description,
    path,
    jsonLd,
  });

  if (!persona || !localized) {
    return <Navigate to="/solutions" replace />;
  }

  const related = getRelatedPersonas(persona);
  const hub = t.seo.solutionsHub;
  const p = t.pseo;

  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#0071e3] transition-colors">
            {p.breadcrumbHome}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <Link to="/solutions" className="hover:text-[#0071e3] transition-colors">
            {hub.h1}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-neutral-600 line-clamp-1">{localized.h1}</span>
        </nav>

        <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
          {p.badgeSolutions}
        </p>
        <h1 className="mt-4 text-4xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950">{localized.h1}</h1>
        <p className="mt-6 text-[17px] text-neutral-500 leading-relaxed">{localized.audience}</p>

        <section className="mt-14" aria-labelledby="pseo-frictions">
          <h2 id="pseo-frictions" className="text-xl font-semibold text-neutral-900 tracking-tight">
            {p.sectionFrictions}
          </h2>
          <ul className="mt-4 space-y-3 text-[15px] text-neutral-500 leading-relaxed list-disc pl-5">
            {localized.frictions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="pseo-product">
          <h2 id="pseo-product" className="text-xl font-semibold text-neutral-900 tracking-tight">
            {p.sectionProduct}
          </h2>
          <p className="mt-4 text-[17px] text-neutral-500 leading-relaxed">{localized.productIntro}</p>
          <ul className="mt-4 space-y-3 text-[15px] text-neutral-500 leading-relaxed list-disc pl-5">
            {localized.productBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="pseo-loop">
          <h2 id="pseo-loop" className="text-xl font-semibold text-neutral-900 tracking-tight">
            {p.sectionLoop}
          </h2>
          <ol className="mt-4 space-y-3 text-[15px] text-neutral-500 leading-relaxed list-decimal pl-5">
            {localized.loopSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="mt-12" aria-labelledby="pseo-faq">
          <h2 id="pseo-faq" className="text-xl font-semibold text-neutral-900 tracking-tight">
            {p.sectionFaq}
          </h2>
          <dl className="mt-6 space-y-8">
            {localized.faq.map((item) => (
              <div key={item.q}>
                <dt className="text-[15px] font-semibold text-neutral-900">{item.q}</dt>
                <dd className="mt-2 text-[15px] text-neutral-500 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14 pt-10 border-t border-neutral-200/80" aria-labelledby="pseo-related">
          <h2 id="pseo-related" className="text-lg font-semibold text-neutral-900 tracking-tight">
            {p.sectionRelated}
          </h2>
          <ul className="mt-5 space-y-3">
            {related.map((r) => {
              const R = pickPseoLocale(r, language);
              return (
                <li key={r.slug}>
                  <Link
                    to={`/solutions/${r.slug}`}
                    className="text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed]"
                  >
                    {R.h1}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full bg-neutral-950 text-white text-[15px] font-medium hover:bg-neutral-800 transition-colors"
          >
            {p.ctaWorkspace}
            <ArrowRight size={17} strokeWidth={2} aria-hidden className="opacity-90" />
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center min-h-12 px-5 rounded-full text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed]"
          >
            {p.ctaBlog}
          </Link>
        </div>
      </article>
    </MarketingLayout>
  );
};
