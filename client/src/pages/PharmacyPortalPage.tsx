import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import PharmacyDashboard from '@/components/pharmacy/PharmacyDashboard';
import PharmacyOperations from '@/components/pharmacy/PharmacyOperations';
import PharmacyInventory from '@/components/pharmacy/PharmacyInventory';
import PharmacyFinancial from '@/components/pharmacy/PharmacyFinancial';
import PharmacyAnalytics from '@/components/pharmacy/PharmacyAnalytics';
import DeliveryManagement from '@/components/pharmacy/DeliveryManagement';
import PharmacyAssistantChat from '@/components/pharmacy/PharmacyAssistantChat';
import OnboardingTour from '@/components/common/OnboardingTour';
import Sidebar from '@/components/layout/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  PackageSearch, 
  ClipboardList, 
  FileText,
  PieChart,
  Truck,
  Shield,
  Scan,
  Package,
  DollarSign,
  Sparkles
} from 'lucide-react';

type TabValue = 'dashboard' | 'operations' | 'inventory' | 'financial' | 'analytics' | 'delivery';

const PharmacyPortalPage = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');
  const { showOnboarding, completeOnboarding, closeOnboarding, restartOnboarding } = useOnboarding();

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
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Pharmacy Management Portal</h1>
            <p className="text-gray-500">
              Welcome back, {user?.username || 'Pharmacy Staff'}. Manage your pharmacy operations.
            </p>
          </div>
          <Button
            onClick={restartOnboarding}
            variant="outline"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Take Tour</span>
          </Button>
        </div>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="mb-6 grid grid-cols-6 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              <span className="hidden sm:inline">Operations</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PharmacyDashboard />
          </TabsContent>

          <TabsContent value="operations">
            <PharmacyOperations />
          </TabsContent>

          <TabsContent value="inventory">
            <PharmacyInventory />
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryManagement />
          </TabsContent>

          <TabsContent value="financial">
            <PharmacyFinancial />
          </TabsContent>

          <TabsContent value="analytics">
            <PharmacyAnalytics />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* AI Assistant Chat - Floating */}
      <PharmacyAssistantChat />
      
      {/* Onboarding Tour */}
      <OnboardingTour 
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

export default PharmacyPortalPage;
