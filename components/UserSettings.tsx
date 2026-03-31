import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { User, Globe, LogOut, ChevronRight, Home, BookOpenText, Shield, FileText } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const settingsTranslations = {
  en: {
    switchLanguage: 'Switch Language',
    logout: 'Log Out',
    user: 'User',
    goHome: 'Back to Home',
    goBlog: 'Back to Blog',
    goPrivacy: 'Back to Privacy Policy',
    goTerms: 'Back to Terms',
    quickLinks: 'Quick Links',
  },
  zh: {
    switchLanguage: '切换语言',
    logout: '退出登录',
    user: '用户',
      goHome: '返回官网',
      goBlog: '返回博客页',
      goPrivacy: '返回隐私协议',
      goTerms: '返回用户协议',
      quickLinks: '快捷入口',
  },
};

export const UserSettings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { logout, isLoggedIn, isAuthLoaded } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const t = settingsTranslations[language];

  const goTo = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthLoaded || !isLoggedIn) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-2 py-2 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all"
      >
        {user?.imageUrl ? (
          <img 
            src={user.imageUrl} 
            alt={user.firstName || 'User'} 
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.firstName || 'User'} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.firstName || user?.emailAddresses?.[0]?.emailAddress || t.user
                }
              </p>
              <p className="text-sm text-gray-500">{user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'}</p>
            </div>
          </div>
        </div>

          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.quickLinks}
            </div>
            <button
              type="button"
              onClick={() => goTo('/')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.goHome}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => goTo('/blog')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <BookOpenText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.goBlog}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => goTo('/privacy')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.goPrivacy}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              type="button"
              onClick={() => goTo('/terms')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{t.goTerms}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <div className="h-px bg-gray-100 my-2" />

            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.switchLanguage}
            </div>
            <button
              type="button"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'zh' ? 'English' : '中文'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <div className="h-px bg-gray-100 my-2" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-600">{t.logout}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
