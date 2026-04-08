import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';
import { ClerkProvider } from '@clerk/clerk-react';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClerkAuthProvider, FallbackAuthProvider, useAuth } from './contexts/AuthContext';
import AppShell from './components/AppShell';
import { LoginModal } from './components/LoginModal';
import { HomePage } from './pages/HomePage';
import { BlogListPage } from './pages/BlogListPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AboutPage } from './pages/AboutPage';
import { SolutionsHubPage } from './pages/SolutionsHubPage';
import { SolutionsDetailPage } from './pages/SolutionsDetailPage';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

interface ProtectedAppRouteProps {
  children?: React.ReactNode;
}

const ProtectedAppRoute: React.FC<ProtectedAppRouteProps> = ({ children }) => {
  const { isAuthLoaded, isLoggedIn, requireLogin } = useAuth();

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isLoggedIn) {
      requireLogin('signIn', 'clerk');
    }
  }, [isAuthLoaded, isLoggedIn, requireLogin]);

  if (!isAuthLoaded) return null;
  if (!isLoggedIn) return <Navigate to="/" replace />;

  return <>{children}</>;
};

/** SPA：在 pathname/search 变化时向 GA4 上报 page_view（gtag 在 index.html 中已加载）。 */
const GtagRouteListener: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView();
  }, [location.pathname, location.search]);
  return null;
};

const AppRouter: React.FC = () => {
  const hasClerkKey = !!clerkPublishableKey;

  const routes = (
    <Router>
      <GtagRouteListener />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<Navigate to="/app/todo" replace />} />
        <Route path="/app/todo" element={<ProtectedAppRoute><AppShell /></ProtectedAppRoute>} />
        <Route path="/app/stats" element={<ProtectedAppRoute><AppShell /></ProtectedAppRoute>} />
        <Route path="/app/docs" element={<ProtectedAppRoute><AppShell /></ProtectedAppRoute>} />
        <Route path="/app/focus" element={<ProtectedAppRoute><AppShell /></ProtectedAppRoute>} />
        <Route path="/app/analysis" element={<Navigate to="/app/stats" replace />} />
        <Route path="/solutions" element={<SolutionsHubPage />} />
        <Route path="/solutions/:slug" element={<SolutionsDetailPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogDetailPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LoginModal />
    </Router>
  );

  if (hasClerkKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <LanguageProvider>
          <ClerkAuthProvider>{routes}</ClerkAuthProvider>
        </LanguageProvider>
      </ClerkProvider>
    );
  }

  return (
    <LanguageProvider>
      <FallbackAuthProvider>{routes}</FallbackAuthProvider>
    </LanguageProvider>
  );
};

export default AppRouter;
