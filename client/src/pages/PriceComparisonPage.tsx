import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import PrescriptionPriceComparison from '@/components/patient/PrescriptionPriceComparison';
import Sidebar from '@/components/layout/Sidebar';

const PriceComparisonPage = () => {
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

  if (!isAuthenticated || user?.role !== 'PATIENT') {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Price Comparison</h1>
          <p className="text-muted-foreground">
            Compare prescription prices across nearby pharmacies to find the best deals
          </p>
        </div>
        <PrescriptionPriceComparison />
      </div>
    </div>
  );
};

export default PriceComparisonPage;