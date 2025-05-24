import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import PharmacyDashboard from '@/components/pharmacy/PharmacyDashboard';
import Sidebar from '@/components/layout/Sidebar';

const PharmacyPortalPage = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-pharmacy staff to login
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'PHARMACY_STAFF')) {
      setLocation('/login');
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user is not authenticated or not pharmacy staff, we return null
  // The useEffect above will handle the redirect
  if (!isAuthenticated || user?.role !== 'PHARMACY_STAFF') {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 p-6">
        <PharmacyDashboard />
      </div>
    </div>
  );
};

export default PharmacyPortalPage;
