import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Check, Globe } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { setShowLoginModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              TodoAgent
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              {t.nav.home}
            </Link>
            <Link to="/blog" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              {t.nav.blog}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            >
              <Globe size={16} />
              <span className="font-medium">{language === 'zh' ? 'EN' : '中文'}</span>
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              {t.nav.signIn}
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              {t.nav.getStarted}
            </button>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/blog"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              {t.nav.blog}
            </Link>
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center space-x-2 w-full px-3 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
              <Globe size={18} />
              <span>{language === 'zh' ? 'English' : '中文'}</span>
            </button>
            <button
              onClick={() => {
                setShowLoginModal(true);
                setIsMenuOpen(false);
              }}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg"
            >
              {t.nav.getStarted}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
