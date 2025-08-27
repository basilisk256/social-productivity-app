import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from './AuthPage';
import OnboardingPage from './OnboardingPage';

const AuthGate = ({ children }) => {
  const { currentUser, hasCompletedOnboarding, isLoading, completeOnboarding } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If no user, show authentication page
  if (!currentUser) {
    return <AuthPage />;
  }

  // If user exists but hasn't completed onboarding, show onboarding
  if (!hasCompletedOnboarding) {
    return <OnboardingPage onComplete={completeOnboarding} />;
  }

  // User is authenticated and onboarded, show main app
  return children;
};

export default AuthGate;
