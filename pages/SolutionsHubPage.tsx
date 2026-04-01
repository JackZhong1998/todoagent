import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';
import { getPseoPersonasSorted, pickPseoLocale } from '../content/pseoPersonas';

export const SolutionsHubPage: React.FC = () => {
  const { t, language } = useLanguage();
  const hub = t.seo.solutionsHub;
  const posts = getPseoPersonasSorted();

  usePageSeo({
    title: hub.title,
    description: hub.description,
    path: '/solutions',
  });

  return (
    <MarketingLayout>
      <section className="max-w-5xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <nav className="text-[13px] text-neutral-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#0071e3] transition-colors">
            {t.pseo.breadcrumbHome}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-neutral-600">{hub.h1}</span>
        </nav>

        <h1 className="mt-8 text-4xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950">{hub.h1}</h1>
        <p className="mt-5 text-[17px] text-neutral-500 leading-relaxed max-w-2xl">{hub.intro}</p>

        <ul className="mt-16 grid sm:grid-cols-2 gap-8 sm:gap-10 list-none p-0 m-0">
          {posts.map((persona) => {
            const L = pickPseoLocale(persona, language);
            return (
              <li key={persona.slug}>
                <article className="rounded-2xl border border-neutral-200/90 bg-[#fafafa] p-6 sm:p-8 h-full flex flex-col">
                  <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
                    <Link
                      to={`/solutions/${persona.slug}`}
                      className="text-inherit hover:text-[#0071e3] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] rounded-md"
                    >
                      {L.h1}
                    </Link>
                  </h2>
                  <p className="mt-3 text-[15px] text-neutral-500 leading-relaxed flex-1">{L.cardTeaser}</p>
                  <Link
                    to={`/solutions/${persona.slug}`}
                    className="mt-6 inline-flex text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed]"
                  >
                    {t.pseo.readGuide}
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </MarketingLayout>
  );
};
