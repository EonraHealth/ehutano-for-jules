import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import WholesalerDashboard from '@/components/wholesaler/WholesalerDashboard';
import Sidebar from '@/components/layout/Sidebar';

const WholesalerPortalPage = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-wholesaler staff to login
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'WHOLESALER_STAFF')) {
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

  // If the user is not authenticated or not wholesaler staff, we return null
  // The useEffect above will handle the redirect
  if (!isAuthenticated || user?.role !== 'WHOLESALER_STAFF') {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 p-6">
        <WholesalerDashboard />
      </div>
    </div>
  );
};

export default WholesalerPortalPage;
