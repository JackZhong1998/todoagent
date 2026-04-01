import { useEffect } from 'react';
import { absoluteUrl, getSiteOrigin } from './siteOrigin';

const JSON_LD_ID = 'todoagent-jsonld';

export type PageSeoInput = {
  title: string;
  description: string;
  /** pathname，如 `/about` */
  path: string;
  /** 默认使用 favicon；可传绝对 URL */
  ogImage?: string;
  /** 工作台等页面建议 noindex */
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = attr === 'name' ? `meta[name="${key}"]` : `meta[property="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

function setRobots(content: string) {
  setMeta('name', 'robots', content);
}

function removeJsonLdScript() {
  document.getElementById(JSON_LD_ID)?.remove();
}

function injectJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  removeJsonLdScript();
  const script = document.createElement('script');
  script.id = JSON_LD_ID;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * 更新 title、description、canonical、Open Graph、Twitter Card、robots、可选 JSON-LD。
 */
export function applyPageSeo(input: PageSeoInput): void {
  const { title, description, path, noindex, jsonLd } = input;
  const origin = getSiteOrigin();
  const url = absoluteUrl(path);
  const defaultOg = `${origin}/favicon.svg`;
  const ogImage = input.ogImage ?? defaultOg;

  document.title = title;
  setMeta('name', 'description', description);
  setCanonical(url);

  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:image', ogImage);
  setMeta('property', 'og:locale', document.documentElement.lang?.startsWith('zh') ? 'zh_CN' : 'en_US');

  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', ogImage);

  setRobots(noindex ? 'noindex, nofollow' : 'index, follow');

  if (jsonLd) {
    injectJsonLd(jsonLd);
  } else {
    removeJsonLdScript();
  }
}

export function usePageSeo(input: PageSeoInput): void {
  const { title, description, path, ogImage, noindex, jsonLd } = input;
  useEffect(() => {
    applyPageSeo({ title, description, path, ogImage, noindex, jsonLd });
    return () => {
      removeJsonLdScript();
    };
  }, [title, description, path, ogImage, noindex, jsonLd]);
}
