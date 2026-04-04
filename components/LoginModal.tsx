import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';

const LoginModalClerk: React.FC = () => {
  const { t } = useLanguage();
  const { showLoginModal, setShowLoginModal, loginMode, loginStep } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState<'prompt' | 'clerk'>('prompt');

  const targetPath = '/app';

  useEffect(() => {
    if (showLoginModal) setStep(loginStep);
  }, [showLoginModal, loginStep]);

  useEffect(() => {
    if (!showLoginModal || !user) return;
    setShowLoginModal(false);
    navigate(targetPath, { replace: true });
  }, [showLoginModal, user, navigate, setShowLoginModal]);

  const isSignUp = useMemo(() => loginMode === 'signUp', [loginMode]);
  const title = useMemo(
    () => (isSignUp ? t.loginModal.actionSignUp : t.loginModal.actionSignIn),
    [isSignUp, t]
  );

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

        {step === 'prompt' ? (
          <div className="p-6">
            <div className="pt-2 pb-5">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{t.loginModal.promptBeforeAuth}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('clerk')}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                去{isSignUp ? '注册/登录' : '登录'}
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 h-[560px]">
            {isSignUp ? (
              <SignUp
                forceRedirectUrl={targetPath}
                appearance={{
                  elements: {
                    form: { marginTop: '20px' },
                  },
                }}
              />
            ) : (
              <SignIn
                forceRedirectUrl={targetPath}
                appearance={{
                  elements: {
                    form: { marginTop: '20px' },
                  },
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/** 无 Clerk 时展示，不调用 useUser */
const LoginModalFallback: React.FC = () => {
  const { t } = useLanguage();
  const { showLoginModal, setShowLoginModal } = useAuth();

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowLoginModal(false)}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <button
          type="button"
          onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold text-gray-900 pr-8">{t.loginModal.clerkUnavailableTitle}</h3>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{t.loginModal.clerkNotConfigured}</p>
        <button
          type="button"
          onClick={() => setShowLoginModal(false)}
          className="mt-5 w-full py-2.5 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200"
        >
          {t.loginModal.close}
        </button>
      </div>
    </div>
  );
};

export const LoginModal: React.FC = () => {
  const { clerkEnabled } = useAuth();
  if (!clerkEnabled) {
    return <LoginModalFallback />;
  }
  return <LoginModalClerk />;
};
