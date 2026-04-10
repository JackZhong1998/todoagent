/** 生产站点根 URL，用于 canonical、OG、sitemap。可在 .env 中设置 VITE_SITE_URL。 */
export function getSiteOrigin(): string {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined;
  if (raw?.trim()) return raw.trim().replace(/\/$/, '');
  return 'https://www.todoagent.cc';
}

export function absoluteUrl(pathname: string): string {
  const origin = getSiteOrigin();
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${origin}${path}`;
}
