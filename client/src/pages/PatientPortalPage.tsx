import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import PatientDashboard from '@/components/patient/PatientDashboard';
import Sidebar from '@/components/layout/Sidebar';

const PatientPortalPage = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-patients to login
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'PATIENT')) {
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

  // If the user is not authenticated or not a patient, we return null
  // The useEffect above will handle the redirect
  if (!isAuthenticated || user?.role !== 'PATIENT') {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 p-6">
        <PatientDashboard />
      </div>
    </div>
  );
};

export default PatientPortalPage;
