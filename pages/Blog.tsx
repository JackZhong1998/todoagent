import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoginModal } from '../components/LoginModal';
import { ArrowRight, Calendar, Clock, Tag } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: '10 Productivity Hacks to Supercharge Your Workflow',
    titleZh: '10个生产力技巧，让您的工作流程效率翻倍',
    excerpt: 'Discover proven strategies to boost your productivity and get more done in less time.',
    excerptZh: '探索经过验证的策略，提高您的生产力，在更短的时间内完成更多工作。',
    date: '2025-03-25',
    readTime: '5 min read',
    readTimeZh: '5分钟阅读',
    category: 'Productivity',
    categoryZh: '生产力',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop',
  },
  {
    id: 2,
    title: 'How AI is Transforming Task Management',
    titleZh: 'AI如何改变任务管理',
    excerpt: 'Explore how artificial intelligence is reshaping the way we organize and prioritize our work.',
    excerptZh: '探索人工智能如何改变我们组织和优先排序工作的方式。',
    date: '2025-03-20',
    readTime: '8 min read',
    readTimeZh: '8分钟阅读',
    category: 'AI',
    categoryZh: 'AI',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
  },
  {
    id: 3,
    title: 'Introducing TodoAgent 2.0: New Features You\'ll Love',
    titleZh: 'TodoAgent 2.0 发布：您会喜欢的新功能',
    excerpt: 'Learn about the exciting new features in our latest update that will make your life easier.',
    excerptZh: '了解我们最新更新中令人兴奋的新功能，这些功能将使您的生活更轻松。',
    date: '2025-03-15',
    readTime: '6 min read',
    readTimeZh: '6分钟阅读',
    category: 'Product Updates',
    categoryZh: '产品更新',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
  },
  {
    id: 4,
    title: 'The Ultimate Guide to Time Blocking',
    titleZh: '时间块的终极指南',
    excerpt: 'Master the art of time blocking to maximize focus and achieve your goals.',
    excerptZh: '掌握时间块的艺术，最大限度地提高注意力并实现您的目标。',
    date: '2025-03-10',
    readTime: '10 min read',
    readTimeZh: '10分钟阅读',
    category: 'Tips & Tricks',
    categoryZh: '技巧',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=400&fit=crop',
  },
  {
    id: 5,
    title: 'Building Better Habits: A Step-by-Step Guide',
    titleZh: '培养更好的习惯：分步指南',
    excerpt: 'Learn how to build lasting habits that will transform your personal and professional life.',
    excerptZh: '学习如何建立持久的习惯，这些习惯将改变您的个人和职业生活。',
    date: '2025-03-05',
    readTime: '7 min read',
    readTimeZh: '7分钟阅读',
    category: 'Productivity',
    categoryZh: '生产力',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
  },
  {
    id: 6,
    title: 'Team Collaboration Best Practices in 2025',
    titleZh: '2025年团队协作最佳实践',
    excerpt: 'Discover the most effective ways to collaborate with your team in the modern workplace.',
    excerptZh: '探索在现代工作场所与团队协作的最有效方法。',
    date: '2025-03-01',
    readTime: '9 min read',
    readTimeZh: '9分钟阅读',
    category: 'Tips & Tricks',
    categoryZh: '技巧',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop',
  },
];

export const Blog: React.FC = () => {
  const { language, t } = useLanguage();
  const isZh = language === 'zh';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <LoginModal />

      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              {t.blog.title}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.blog.subtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {t.blog.categories.map((category, index) => (
              <button
                key={index}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-blue-500 hover:text-white transition-colors font-medium"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={isZh ? post.titleZh : post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                      {isZh ? post.categoryZh : post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{post.date}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{isZh ? post.readTimeZh : post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {isZh ? post.titleZh : post.title}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {isZh ? post.excerptZh : post.excerpt}
                  </p>
                  <Link
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                  >
                    {t.blog.readMore}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
