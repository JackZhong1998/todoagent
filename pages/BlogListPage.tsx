import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { getBlogPostsSorted, pickBlogLocale } from '../content/blogPosts';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';
import { buildBlogListPageJsonLd } from '../utils/seoJsonLd';

export const BlogListPage: React.FC = () => {
  const { t, language } = useLanguage();
  const b = t.seo.blog;
  const posts = getBlogPostsSorted();
  const jsonLd = useMemo(() => buildBlogListPageJsonLd(getBlogPostsSorted(), language), [language]);
  const labels =
    language === 'zh'
      ? { home: '首页', blog: '博客' }
      : { home: 'Home', blog: 'Blog' };

  usePageSeo({
    title: b.title,
    description: b.description,
    path: '/blog',
    jsonLd,
  });

  return (
    <MarketingLayout>
      <section className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <nav
          aria-label={language === 'zh' ? '面包屑导航' : 'Breadcrumb'}
          className="text-[13px] text-neutral-400 mb-6 flex items-center gap-2"
        >
          <Link to="/" className="hover:text-neutral-600">
            {labels.home}
          </Link>
          <span>/</span>
          <span className="text-neutral-500">{labels.blog}</span>
        </nav>

        <h1 className="text-4xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950">{b.h1}</h1>
        <p className="mt-5 text-[17px] text-neutral-500 leading-relaxed">{b.intro}</p>

        <div className="mt-16 space-y-0 divide-y divide-neutral-200/80">
          {posts.map((post) => {
            const L = pickBlogLocale(post, language);
            return (
            <article key={post.id} className="py-10 first:pt-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                {post.publishedAt} · {L.readingTime}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-neutral-900 tracking-tight">{L.title}</h2>
              <p className="mt-3 text-[15px] text-neutral-500 leading-relaxed">{L.summary}</p>
              <Link
                to={`/blog/${post.slug}`}
                className="mt-5 inline-flex text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] rounded-full"
              >
                {b.readMore}
              </Link>
            </article>
            );
          })}
        </div>
      </section>
    </MarketingLayout>
  );
};
