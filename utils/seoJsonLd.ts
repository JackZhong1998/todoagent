import type { Language, translations } from '../i18n/locales';
import type { BlogPost } from '../content/blogPosts';
import { getSiteOrigin } from './siteOrigin';

type AppTranslations = (typeof translations)[Language];

export function buildHomePageJsonLd(language: Language, t: AppTranslations): Record<string, unknown>[] {
  const origin = getSiteOrigin();
  const inLang = language === 'zh' ? 'zh-CN' : 'en';
  const faq = t.seo.faq;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'TodoAgent',
      url: `${origin}/`,
      inLanguage: inLang,
      description: t.seo.home.description,
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

export function buildBlogPostingJsonLd(
  post: BlogPost,
  path: string,
  language: Language
): Record<string, unknown> {
  const origin = getSiteOrigin();
  const url = `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  const body = post[language];
  const inLanguage = language === 'zh' ? 'zh-CN' : 'en';

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: body.title,
    description: body.summary,
    datePublished: post.publishedAt,
    inLanguage,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: {
      '@type': 'Organization',
      name: 'TodoAgent',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TodoAgent',
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/favicon.svg`,
      },
    },
  };
}
