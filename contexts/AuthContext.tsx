import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react';

type AuthContextType = {
  isAuthLoaded: boolean;
  isLoggedIn: boolean;
  login: () => void;
  requireLogin: (mode?: 'signIn' | 'signUp', step?: 'prompt' | 'clerk') => void;
  loginMode: 'signIn' | 'signUp';
  loginStep: 'prompt' | 'clerk';
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  user: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn } = useClerkAuth();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
