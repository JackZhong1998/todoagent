import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const AppRouter: React.FC = () => {
  const hasClerkKey = !!clerkPublishableKey;

  const AppContent = (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/app" element={<App />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
