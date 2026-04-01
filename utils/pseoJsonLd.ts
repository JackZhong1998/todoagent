import type { Language } from '../i18n/locales';
import type { PseoLocaleBlock, PseoPersona } from '../content/pseoPersonas';
import { getSiteOrigin, absoluteUrl } from './siteOrigin';

export function buildPseoDetailJsonLd(
  persona: PseoPersona,
  body: PseoLocaleBlock,
  path: string,
  language: Language
): Record<string, unknown>[] {
  const origin = getSiteOrigin();
  const url = absoluteUrl(path);
  const inLanguage = language === 'zh' ? 'zh-CN' : 'en';

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: body.h1,
      description: body.metaDescription,
      url,
      inLanguage,
      isPartOf: {
        '@type': 'WebSite',
        name: 'TodoAgent',
        url: `${origin}/`,
      },
      dateModified: persona.updatedAt,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: body.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];
}
