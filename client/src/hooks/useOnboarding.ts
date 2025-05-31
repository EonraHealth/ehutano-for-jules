import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'pharmacy_onboarding_completed';

export function useOnboarding() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setIsOnboardingComplete(false);
      // Show onboarding after a brief delay for better UX
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
  };

  const restartOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setIsOnboardingComplete(false);
    setShowOnboarding(true);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    isOnboardingComplete,
    showOnboarding,
    completeOnboarding,
    restartOnboarding,
    closeOnboarding
  };
}