import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import Sidebar from '@/components/layout/Sidebar';

const DoctorPortalPage = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-doctors to login
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'DOCTOR')) {
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

  // If the user is not authenticated or not a doctor, we return null
  // The useEffect above will handle the redirect
  if (!isAuthenticated || user?.role !== 'DOCTOR') {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 p-6">
        <DoctorDashboard />
      </div>
    </div>
  );
};

export default DoctorPortalPage;
