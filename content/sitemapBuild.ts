import { blogPosts } from './blogPosts';
import { pseoPersonas } from './pseoPersonas';

export type SitemapUrlRow = {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
};

const STATIC: SitemapUrlRow[] = [
  { path: '/', changefreq: 'weekly', priority: 1 },
  { path: '/blog', changefreq: 'weekly', priority: 0.9 },
  { path: '/solutions', changefreq: 'weekly', priority: 0.9 },
  { path: '/about', changefreq: 'monthly', priority: 0.7 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.4 },
  { path: '/terms', changefreq: 'yearly', priority: 0.4 },
];

export function getSitemapRows(): SitemapUrlRow[] {
  const blogRows: SitemapUrlRow[] = blogPosts.map((p) => ({
    path: `/blog/${p.slug}`,
    changefreq: 'monthly' as const,
    priority: 0.8,
  }));
  const pseoRows: SitemapUrlRow[] = pseoPersonas.map((p) => ({
    path: `/solutions/${p.slug}`,
    changefreq: 'monthly' as const,
    priority: 0.85,
  }));
  return [...STATIC, ...blogRows, ...pseoRows];
}

export function buildSitemapXml(origin: string): string {
  const base = origin.replace(/\/$/, '');
  const rows = getSitemapRows();
  const body = rows
    .map(
      (r) =>
        `  <url><loc>${base}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
