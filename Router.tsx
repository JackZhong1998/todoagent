import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';
import { ClerkProvider } from '@clerk/clerk-react';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClerkAuthProvider, FallbackAuthProvider, useAuth } from './contexts/AuthContext';
import { LoginModal } from './components/LoginModal';

const AppShell = lazy(() => import('./components/AppShell'));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const BlogListPage = lazy(() => import('./pages/BlogListPage').then((m) => ({ default: m.BlogListPage })));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const EditorialPolicyPage = lazy(() =>
  import('./pages/EditorialPolicyPage').then((m) => ({ default: m.EditorialPolicyPage }))
);
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const SolutionsHubPage = lazy(() => import('./pages/SolutionsHubPage').then((m) => ({ default: m.SolutionsHubPage })));
const SolutionsDetailPage = lazy(() =>
  import('./pages/SolutionsDetailPage').then((m) => ({ default: m.SolutionsDetailPage }))
);

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
      <Suspense fallback={null}>
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
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
