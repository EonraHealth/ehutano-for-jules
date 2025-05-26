import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import PharmacyDashboard from '@/components/pharmacy/PharmacyDashboard';
import InventoryManagement from '@/components/pharmacy/InventoryManagement';
import OrderProcessing from '@/components/pharmacy/OrderProcessing';
import PrescriptionManagement from '@/components/pharmacy/PrescriptionManagement';
import MedicalAidClaimsManager from '@/components/pharmacy/MedicalAidClaimsManager';
import DeliveryManagement from '@/components/pharmacy/DeliveryManagement';
import PharmacyAnalytics from '@/components/pharmacy/PharmacyAnalytics';
import Sidebar from '@/components/layout/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  PackageSearch, 
  ClipboardList, 
  FileText,
  PieChart,
  Truck
} from 'lucide-react';

type TabValue = 'dashboard' | 'inventory' | 'orders' | 'prescriptions' | 'claims' | 'delivery' | 'analytics';

const PharmacyPortalPage = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pharmacy Management Portal</h1>
          <p className="text-gray-500">
            Welcome back, {user?.username || 'Pharmacy Staff'}. Manage your pharmacy operations.
          </p>
        </div>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <TabsList className="mb-6 grid grid-cols-7 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Prescriptions</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Medical Aid</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <PharmacyDashboard />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderProcessing />
          </TabsContent>

          <TabsContent value="prescriptions">
            <PrescriptionManagement />
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryManagement />
          </TabsContent>

          <TabsContent value="claims">
            <MedicalAidClaimsManager />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  View and analyze your pharmacy performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px] flex items-center justify-center">
                <div className="text-center p-6">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium">Analytics Coming Soon</h3>
                  <p className="text-gray-500 mt-2">
                    Detailed analytics and reporting features are under development
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PharmacyPortalPage;
