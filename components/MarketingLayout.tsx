import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

type Props = {
  children: React.ReactNode;
};

const Logo: React.FC<{ tagline: string }> = ({ tagline }) => {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 group rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
    >
      <BrandMark
        size={36}
        className="shrink-0 rounded-lg overflow-hidden transition-opacity duration-200 group-hover:opacity-90"
      />
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-400 font-medium">TodoAgent</p>
        <p className="text-[15px] font-semibold text-neutral-900 tracking-tight -mt-0.5 leading-snug">{tagline}</p>
      </div>
    </Link>
  );
};

export const MarketingLayout: React.FC<Props> = ({ children }) => {
  const { login, isLoggedIn, user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const m = t.marketing;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navLinks = (
    <>
      <Link
        to="/solutions"
        className="text-[15px] text-neutral-500 hover:text-neutral-900 py-2.5 md:py-0 transition-colors duration-150"
        onClick={() => setMobileNavOpen(false)}
      >
        {m.navSolutions}
      </Link>
      <Link
        to="/blog"
        className="text-[15px] text-neutral-500 hover:text-neutral-900 py-2.5 md:py-0 transition-colors duration-150"
        onClick={() => setMobileNavOpen(false)}
      >
        {m.navBlog}
      </Link>
      <Link
        to="/about"
        className="text-[15px] text-neutral-500 hover:text-neutral-900 py-2.5 md:py-0 transition-colors duration-150"
        onClick={() => setMobileNavOpen(false)}
      >
        {m.navAbout}
      </Link>
      <Link
        to="/privacy"
        className="text-[15px] text-neutral-500 hover:text-neutral-900 py-2.5 md:py-0 transition-colors duration-150"
        onClick={() => setMobileNavOpen(false)}
      >
        {m.navPrivacy}
      </Link>
      <Link
        to="/terms"
        className="text-[15px] text-neutral-500 hover:text-neutral-900 py-2.5 md:py-0 transition-colors duration-150"
        onClick={() => setMobileNavOpen(false)}
      >
        {m.navTerms}
      </Link>
    </>
  );

  return (
    <div className="min-h-dvh bg-white text-neutral-900 font-sans antialiased selection:bg-neutral-200/80">
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between gap-6">
          <Logo tagline={m.logoTagline} />

          <nav className="hidden md:flex items-center gap-10" aria-label="Main">
            {navLinks}
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="min-h-11 px-3.5 rounded-full text-[13px] font-medium text-neutral-700 border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors duration-150"
            >
              {m.langSwitch}
            </button>

            <button
              type="button"
              className="md:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 transition-colors duration-150"
              aria-expanded={mobileNavOpen}
              aria-controls="marketing-mobile-nav"
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? <X size={20} strokeWidth={1.75} aria-hidden /> : <Menu size={20} strokeWidth={1.75} aria-hidden />}
              <span className="sr-only">{mobileNavOpen ? 'Close menu' : 'Open menu'}</span>
            </button>

            {isLoggedIn ? (
              <>
                <Link
                  to="/app"
                  className="hidden sm:inline-flex items-center justify-center min-h-11 px-5 rounded-full text-[13px] font-medium bg-neutral-950 text-white hover:bg-neutral-800 transition-colors duration-150"
                >
                  {m.workspace}
                </Link>
                <Link
                  to="/app"
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
                  to="/app"
                  className="hidden sm:inline-flex items-center justify-center min-h-11 px-5 rounded-full text-[13px] font-medium bg-neutral-950 text-white hover:bg-neutral-800 transition-colors duration-150"
                >
                  {m.startFree}
                </Link>
                <button
                  type="button"
                  onClick={login}
                  className="hidden sm:inline-flex items-center justify-center min-h-11 px-5 rounded-full text-[13px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors duration-150"
                >
                  {m.logIn}
                </button>
              </>
            )}
          </div>
        </div>

        <div
          id="marketing-mobile-nav"
          className={`md:hidden border-neutral-200/80 bg-white overflow-hidden transition-[max-height] duration-300 ease-out ${
            mobileNavOpen ? 'max-h-[22rem] border-t' : 'max-h-0 border-t-0'
          }`}
          aria-hidden={!mobileNavOpen}
          inert={!mobileNavOpen ? true : undefined}
        >
          <nav className="max-w-5xl mx-auto px-6 py-6 flex flex-col" aria-label="Mobile">
            {navLinks}
            <div className="flex flex-col gap-2 pt-6 mt-4 border-t border-neutral-100">
              <Link
                to="/app"
                className="inline-flex min-h-11 items-center justify-center px-5 rounded-full text-[13px] font-medium bg-neutral-950 text-white"
                onClick={() => setMobileNavOpen(false)}
              >
                {isLoggedIn ? m.workspace : m.startFree}
              </Link>
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileNavOpen(false);
                    login();
                  }}
                  className="inline-flex min-h-11 items-center justify-center px-5 rounded-full text-[13px] font-medium text-[#0071e3]"
                >
                  {m.logIn}
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main>{children}</main>

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
          </div>
        </div>
      </footer>
    </div>
  );
};
