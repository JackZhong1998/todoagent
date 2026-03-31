import React from 'react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { blogPosts } from '../content/blogPosts';

export const BlogListPage: React.FC = () => {
  return (
    <MarketingLayout>
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-black text-gray-900">TodoAgent 博客</h1>
        <p className="mt-3 text-gray-600">
          聚焦 Attention 工作法、Agent 协作实践与 context 资产化方法论。
        </p>

        <div className="mt-10 space-y-5">
          {blogPosts.map((post) => (
            <article key={post.id} className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                {post.publishedAt} · {post.readingTime}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{post.title}</h2>
              <p className="mt-3 text-gray-600">{post.summary}</p>
              <Link to={`/blog/${post.slug}`} className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                阅读全文 →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
};
