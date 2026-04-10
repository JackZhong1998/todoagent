import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { getBlogPostBySlug, getRelatedBlogPosts, pickBlogLocale } from '../content/blogPosts';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageSeo } from '../utils/pageSeo';
import { buildBlogPostingJsonLd } from '../utils/seoJsonLd';

export const BlogDetailPage: React.FC = () => {
  const { slug = '' } = useParams();
  const post = getBlogPostBySlug(slug);
  const { t, language } = useLanguage();
  const path = `/blog/${slug}`;
  const jsonLd = useMemo(
    () => (post ? buildBlogPostingJsonLd(post, path, language) : undefined),
    [post, path, language]
  );
  const localized = post ? pickBlogLocale(post, language) : null;
  const pageTitle = localized ? `${localized.title}${t.seo.blogArticleSuffix}` : t.seo.blog.title;

  usePageSeo({
    title: pageTitle,
    description: localized?.summary ?? t.seo.blog.description,
    path,
    jsonLd,
  });

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const L = pickBlogLocale(post, language);
  const b = t.seo.blog;
  const relatedPosts = getRelatedBlogPosts(post.slug, 3);
  const labels =
    language === 'zh'
      ? { home: '首页', blog: '博客', related: '相关文章' }
      : { home: 'Home', blog: 'Blog', related: 'Related Articles' };

  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <nav
          aria-label={language === 'zh' ? '面包屑导航' : 'Breadcrumb'}
          className="text-[13px] text-neutral-400 mb-6 flex items-center gap-2"
        >
          <Link to="/" className="hover:text-neutral-600">
            {labels.home}
          </Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-neutral-600">
            {labels.blog}
          </Link>
          <span>/</span>
          <span className="text-neutral-500 line-clamp-1">{L.title}</span>
        </nav>

        <Link
          to="/blog"
          className="text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] rounded-full"
        >
          {b.backToBlog}
        </Link>
        <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
          {post.publishedAt} · {L.readingTime}
        </p>
        <h1 className="mt-4 text-4xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950">{L.title}</h1>
        <p className="mt-5 text-[17px] text-neutral-500 leading-relaxed">{L.summary}</p>

        <div className="mt-12 space-y-6 text-[17px] text-neutral-500 leading-relaxed">
          {L.content.map((paragraph, i) => (
            <p key={`${post.id}-${i}`}>{paragraph}</p>
          ))}
        </div>

        <section className="mt-16 border-t border-neutral-200 pt-10">
          <h2 className="text-lg font-semibold text-neutral-900">{labels.related}</h2>
          <div className="mt-6 space-y-5">
            {relatedPosts.map((item) => {
              const localizedItem = pickBlogLocale(item, language);
              return (
                <article key={item.id}>
                  <Link
                    to={`/blog/${item.slug}`}
                    className="text-[16px] font-medium text-neutral-900 hover:text-[#0071e3] transition-colors"
                  >
                    {localizedItem.title}
                  </Link>
                  <p className="mt-1 text-sm text-neutral-500">{localizedItem.summary}</p>
                </article>
              );
            })}
          </div>
        </section>
      </article>
    </MarketingLayout>
  );
};
