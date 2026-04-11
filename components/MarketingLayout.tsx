import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

type Props = {
  children: React.ReactNode;
};

/** “To” + do 标 + “Agent”，无倾斜、挨近图标 */
const BrandWordmark: React.FC = () => {
  const type = 'text-[1.5rem] font-semibold leading-none tracking-tight font-sans';

  return (
    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-neutral-950 select-none">
      <span className={`inline-flex items-baseline ${type}`}>
        <span>T</span>
        <span className="-ml-px">o</span>
      </span>
      <BrandMark
        size={36}
        className="shrink-0 rounded-lg overflow-hidden transition-opacity duration-200 group-hover:opacity-90"
      />
      <span className={type}>Agent</span>
    </span>
  );
};

export const MarketingLayout: React.FC<Props> = ({ children }) => {
  const { login, isLoggedIn, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const m = t.marketing;

  return (
    <div className="min-h-dvh bg-white text-neutral-900 font-sans antialiased selection:bg-neutral-200/80">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-neutral-900 focus:px-3 focus:py-2 focus:rounded-md focus:shadow"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <div
          className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4"
        >
          <div className="min-w-0 shrink">
            <Link
              to="/"
              className="group inline-flex items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
              aria-label="TodoAgent Home"
            >
              <BrandWordmark />
            </Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className={`min-h-11 rounded-full font-medium text-neutral-700 border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors duration-150 ${
                language === 'en' ? 'px-2.5 text-[12px] sm:px-3.5 sm:text-[13px]' : 'px-3.5 text-[13px]'
              }`}
            >
              {m.langSwitch}
            </button>

            {isLoggedIn ? (
              <>
                <Link
                  to="/app/todo"
                  className={`hidden sm:inline-flex items-center justify-center min-h-11 rounded-full font-medium bg-neutral-950 text-white hover:bg-neutral-800 transition-colors duration-150 ${
                    language === 'en' ? 'px-3.5 text-[12px] xl:px-5 xl:text-[13px]' : 'px-5 text-[13px]'
                  }`}
                >
                  {m.workspace}
                </Link>
                <Link
                  to="/app/todo"
                  className="hidden sm:block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
                >
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.firstName || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-sm font-semibold">
                      {(user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/app/todo"
                  className={`hidden sm:inline-flex items-center justify-center min-h-11 rounded-full font-medium bg-neutral-950 text-white hover:bg-neutral-800 transition-colors duration-150 ${
                    language === 'en' ? 'px-3.5 text-[12px] xl:px-5 xl:text-[13px]' : 'px-5 text-[13px]'
                  }`}
                >
                  {m.startFree}
                </Link>
                <button
                  type="button"
                  onClick={login}
                  className={`hidden sm:inline-flex items-center justify-center min-h-11 rounded-full font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors duration-150 ${
                    language === 'en' ? 'px-3 text-[12px] xl:px-5 xl:text-[13px]' : 'px-5 text-[13px]'
                  }`}
                >
                  {m.logIn}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="border-t border-neutral-200/80 mt-24 sm:mt-32 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-14 sm:py-16 flex flex-col sm:flex-row flex-wrap gap-8 sm:gap-6 items-start sm:items-center justify-between text-[13px] text-neutral-500 leading-relaxed">
          <p className="max-w-md">
            © {new Date().getFullYear()} TodoAgent. {m.footerTagline}
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <Link to="/solutions" className="text-neutral-600 hover:text-[#0071e3] transition-colors duration-150">
              {m.footerSolutions}
            </Link>
            <Link to="/blog" className="text-neutral-600 hover:text-[#0071e3] transition-colors duration-150">
              {m.footerBlog}
            </Link>
            <Link to="/privacy" className="text-neutral-600 hover:text-[#0071e3] transition-colors duration-150">
              {m.footerPrivacy}
            </Link>
            <Link to="/terms" className="text-neutral-600 hover:text-[#0071e3] transition-colors duration-150">
              {m.footerTerms}
            </Link>
            <Link to="/editorial-policy" className="text-neutral-600 hover:text-[#0071e3] transition-colors duration-150">
              Editorial Policy
            </Link>
            <Link to="/contact" className="text-neutral-600 hover:text-[#0071e3] transition-colors duration-150">
              {m.footerContact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
