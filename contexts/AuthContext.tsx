import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react';

type AuthContextType = {
  /** 为 false 时表示未配置 VITE_CLERK_PUBLISHABLE_KEY，不得使用任何 @clerk/clerk-react 的 hook */
  clerkEnabled: boolean;
  isAuthLoaded: boolean;
  isLoggedIn: boolean;
  login: () => void;
  requireLogin: (mode?: 'signIn' | 'signUp', step?: 'prompt' | 'clerk') => void;
  loginMode: 'signIn' | 'signUp';
  loginStep: 'prompt' | 'clerk';
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  user: unknown;
  /** Clerk session token (e.g. template `supabase` for Supabase RLS). */
  getClerkToken: (options?: { template?: string }) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** 必须在 <ClerkProvider> 内使用 */
export const ClerkAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useClerkAuth();
  const clerk = useClerk();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'signIn' | 'signUp'>('signIn');
  const [loginStep, setLoginStep] = useState<'prompt' | 'clerk'>('prompt');

  const isLoggedIn = !!isSignedIn;

  const login = () => {
    setLoginMode('signIn');
    setLoginStep('clerk');
    setShowLoginModal(true);
  };

  const requireLogin = (mode: 'signIn' | 'signUp' = 'signIn', step: 'prompt' | 'clerk' = 'prompt') => {
    setLoginMode(mode);
    setLoginStep(step);
    setShowLoginModal(true);
  };

  const logout = async () => {
    await clerk.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        clerkEnabled: true,
        isAuthLoaded,
        isLoggedIn,
        login,
        requireLogin,
        loginMode,
        loginStep,
        logout,
        showLoginModal,
        setShowLoginModal,
        user,
        getClerkToken: (options) => getToken(options),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/** 未配置 Clerk 公钥时使用：不调用任何 Clerk hook，避免白屏 */
export const FallbackAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'signIn' | 'signUp'>('signIn');
  const [loginStep, setLoginStep] = useState<'prompt' | 'clerk'>('prompt');

  const login = useCallback(() => {
    setLoginMode('signIn');
    setLoginStep('prompt');
    setShowLoginModal(true);
  }, []);

  const requireLogin = useCallback(
    (mode: 'signIn' | 'signUp' = 'signIn', step: 'prompt' | 'clerk' = 'prompt') => {
      setLoginMode(mode);
      setLoginStep(step);
      setShowLoginModal(true);
    },
    []
  );

  const logout = useCallback(async () => {
    /* no-op */
  }, []);

  const getClerkToken = useCallback(async () => null, []);

  return (
    <AuthContext.Provider
      value={{
        clerkEnabled: false,
        isAuthLoaded: true,
        isLoggedIn: false,
        login,
        requireLogin,
        loginMode,
        loginStep,
        logout,
        showLoginModal,
        setShowLoginModal,
        user: null,
        getClerkToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within ClerkAuthProvider or FallbackAuthProvider');
  }
  return context;
};
