import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { BlogListPage } from './pages/BlogListPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AboutPage } from './pages/AboutPage';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

interface ProtectedAppRouteProps {
  initialPage?: 'todo' | 'analysis';
}

const ProtectedAppRoute: React.FC<ProtectedAppRouteProps> = ({ initialPage = 'todo' }) => {
  const { isAuthLoaded, isLoggedIn, requireLogin } = useAuth();

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isLoggedIn) {
      requireLogin('signIn', 'clerk');
    }
  }, [isAuthLoaded, isLoggedIn, requireLogin]);

  if (!isAuthLoaded) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;

  return <AppShell initialPage={initialPage} />;
};

const AppRouter: React.FC = () => {
  const hasClerkKey = !!clerkPublishableKey;

  const AppContent = (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app" element={<ProtectedAppRoute initialPage="todo" />} />
            <Route path="/app/analysis" element={<ProtectedAppRoute initialPage="analysis" />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <LoginModal />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );

  if (hasClerkKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {AppContent}
      </ClerkProvider>
    );
  }

  return AppContent;
};

export default AppRouter;
