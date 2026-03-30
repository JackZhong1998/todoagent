import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

// 动态导入 Clerk，避免在没有 API key 时出错
let SignIn: any;
let useUser: any;
let useSignUp: any;

try {
  const clerkModule = require('@clerk/clerk-react');
  SignIn = clerkModule.SignIn;
  useUser = clerkModule.useUser;
  useSignUp = clerkModule.useSignUp;
} catch (error) {
  // Clerk 不可用，使用默认值
  SignIn = null;
  useUser = () => ({ user: null });
  useSignUp = () => ({});
}

export const LoginModal: React.FC = () => {
  const { t } = useLanguage();
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const onSignInComplete = (data: any) => {
    login(data?.user);
    navigate('/app');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      const mockUserData = {
        id: 'user-' + Date.now(),
        email: email,
        name: email.split('@')[0]
      };
      login(mockUserData);
      setIsLoading(false);
      navigate('/app');
    }, 1500);
  };

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowLoginModal(false)}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <button
          onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X size={20} />
        </button>

        {SignIn ? (
          <div className="p-4 h-[500px]">
            <SignIn 
              appearance={{
                elements: {
                  form: {
                    marginTop: '20px',
                  },
                },
              }}
              onComplete={onSignInComplete}
            />
          </div>
        ) : (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">T</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isSignUp ? (t.loginModal.signUpLink) : t.loginModal.title}
              </h2>
              <p className="text-gray-600 mt-2">
                {t.loginModal.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.loginModal.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mr-2" size={20} />
                ) : null}
                {isSignUp ? t.loginModal.signUpLink : t.loginModal.continue}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t.loginModal.signUp}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {isSignUp ? t.loginModal.title : t.loginModal.signUpLink}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
