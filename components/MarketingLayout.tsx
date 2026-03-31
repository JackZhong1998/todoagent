import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

type Props = {
  children: React.ReactNode;
};

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-black">
        TA
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gray-400 font-semibold">TodoAgent</p>
        <p className="text-base font-semibold text-gray-900 -mt-1">与你紧密协作的 Agent</p>
      </div>
    </Link>
  );
};

export const MarketingLayout: React.FC<Props> = ({ children }) => {
  const { login, isLoggedIn, user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isZh = language === 'zh';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <Link to="/blog" className="hover:text-gray-900 transition-colors">{isZh ? '博客' : 'Blog'}</Link>
            <Link to="/about" className="hover:text-gray-900 transition-colors">{isZh ? '关于我' : 'About'}</Link>
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">{isZh ? '隐私协议' : 'Privacy'}</Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">{isZh ? '用户协议' : 'Terms'}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage(isZh ? 'en' : 'zh')}
              className="px-3 py-2 rounded-xl text-sm font-semibold border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              {isZh ? 'EN' : '中文'}
            </button>
            {isLoggedIn ? (
              <>
                <Link
                  to="/app"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black transition-colors"
                >
                  {isZh ? '工作台' : 'Workspace'}
                </Link>
                <Link to="/app" className="block">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.firstName || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center text-sm font-bold">
                      {(user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/app"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black transition-colors"
                >
                  {isZh ? '免费使用' : 'Start Free'}
                </Link>
                <button
                  type="button"
                  onClick={login}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {isZh ? '登录' : 'Log in'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-gray-500 flex flex-wrap gap-4 items-center justify-between">
          <p>
            © {new Date().getFullYear()} TodoAgent. {isZh ? '为深度专注的创造者而生。' : 'Built for focused builders.'}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="hover:text-gray-700">{isZh ? '博客' : 'Blog'}</Link>
            <Link to="/privacy" className="hover:text-gray-700">{isZh ? '隐私协议' : 'Privacy'}</Link>
            <Link to="/terms" className="hover:text-gray-700">{isZh ? '用户协议' : 'Terms'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
