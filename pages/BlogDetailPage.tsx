import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { getBlogPostBySlug } from '../content/blogPosts';

export const BlogDetailPage: React.FC = () => {
  const { slug = '' } = useParams();
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-6 py-14">
        <Link to="/blog" className="text-sm text-blue-600 font-semibold hover:text-blue-700">
          ← 返回博客
        </Link>
        <p className="mt-6 text-xs uppercase tracking-widest text-gray-400 font-semibold">
          {post.publishedAt} · {post.readingTime}
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">{post.title}</h1>
        <p className="mt-4 text-lg text-gray-600">{post.summary}</p>

        <div className="mt-8 space-y-5 text-gray-700 leading-relaxed">
          {post.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </MarketingLayout>
  );
};
