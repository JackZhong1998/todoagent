import type { Language, translations } from '../i18n/locales';
import type { BlogPost } from '../content/blogPosts';
import { getSiteOrigin } from './siteOrigin';

type AppTranslations = (typeof translations)[Language];

export function buildHomePageJsonLd(language: Language, t: AppTranslations): Record<string, unknown>[] {
  const origin = getSiteOrigin();
  const inLang = language === 'zh' ? 'zh-CN' : 'en';
  const faq = t.seo.faq;
  const organizationId = `${origin}/#organization`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': organizationId,
      name: 'TodoAgent',
      url: `${origin}/`,
      logo: `${origin}/favicon.svg`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'TodoAgent',
      url: `${origin}/`,
      inLanguage: inLang,
      description: t.seo.home.description,
      publisher: {
        '@id': organizationId,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/blog?query={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'TodoAgent',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description: t.seo.home.description,
      url: `${origin}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    },
  ];
}

/** 博客列表页：Organization + 面包屑 + 文章 ItemList（与列表渲染顺序一致） */
export function buildBlogListPageJsonLd(posts: BlogPost[], language: Language): Record<string, unknown>[] {
  const origin = getSiteOrigin();
  const organizationId = `${origin}/#organization`;
  const blogUrl = `${origin}/blog`;
  const image = `${origin}/favicon.svg`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': organizationId,
      name: 'TodoAgent',
      url: `${origin}/`,
      logo: image,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'zh' ? '首页' : 'Home',
          item: `${origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'zh' ? '博客' : 'Blog',
          item: blogUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: language === 'zh' ? 'TodoAgent 博客' : 'TodoAgent Blog',
      url: blogUrl,
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => {
        const body = post[language];
        const itemUrl = `${origin}/blog/${post.slug}`;
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'BlogPosting',
            '@id': itemUrl,
            url: itemUrl,
            headline: body.title,
            description: body.summary,
            datePublished: post.publishedAt,
          },
        };
      }),
    },
  ];
}

export function buildBlogPostingJsonLd(
  post: BlogPost,
  path: string,
  language: Language
): Record<string, unknown>[] {
  const origin = getSiteOrigin();
  const url = `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  const body = post[language];
  const inLanguage = language === 'zh' ? 'zh-CN' : 'en';
  const organizationId = `${origin}/#organization`;
  const image = `${origin}/favicon.svg`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': organizationId,
      name: 'TodoAgent',
      url: `${origin}/`,
      logo: image,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: body.title,
      description: body.summary,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      inLanguage,
      url,
      image,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      author: {
        '@id': organizationId,
      },
      publisher: {
        '@id': organizationId,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: language === 'zh' ? '首页' : 'Home',
          item: `${origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: language === 'zh' ? '博客' : 'Blog',
          item: `${origin}/blog`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: body.title,
          item: url,
        },
      ],
    },
  ];
}
