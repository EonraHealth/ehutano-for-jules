import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileNavbar from "./components/layout/MobileNavbar";
import { useAuth } from "./hooks/useAuth";
import { AuthProvider } from "./components/auth/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import NetworkErrorHandler from "./components/common/NetworkErrorHandler";
import ContextualHelp from "./components/common/ContextualHelp";

// Main Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientPortalPage from "./pages/PatientPortalPage";
import PharmacyPortalPage from "./pages/PharmacyPortalPage";
import DoctorPortalPage from "./pages/DoctorPortalPage";
import WholesalerPortalPage from "./pages/WholesalerPortalPage";
import WellnessHubPage from "./pages/WellnessHubPage";
import MobilePatientApp from "./pages/MobilePatientApp";
import MedicalAidClaimsPage from "./pages/MedicalAidClaimsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import GenericPage from "./pages/GenericPage";
import PriceComparisonPage from "./pages/PriceComparisonPage";
import Sidebar from "./components/layout/Sidebar";
import PharmacyAnalytics from "./components/pharmacy/PharmacyAnalytics";
import PrescriptionManagement from "@/components/pharmacy/PrescriptionManagement";
import PharmacyAssistant from "./components/pharmacy/PharmacyAssistant";
import EfficientDispensingWorkflow from "./components/pharmacy/EfficientDispensingWorkflow";
import WholesalerCatalog from "./components/wholesaler/WholesalerCatalog";
import WholesalerOrders from "./components/wholesaler/WholesalerOrders";
import PharmacyClients from "./components/wholesaler/PharmacyClients";
import WholesalerAnalytics from "./components/wholesaler/WholesalerAnalytics";
import DoctorPatients from "./components/doctor/DoctorPatients";
import DoctorPrescriptions from "./components/doctor/DoctorPrescriptions";
import DoctorAppointments from "./components/doctor/DoctorAppointments";

// Access Denied Component
const AccessDenied = ({ role }: { role: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
      <p className="mb-4">You don't have permission to access the {role} Portal.</p>
      <p className="text-sm text-gray-600">Please log in with a {role.toLowerCase()} account to access this area.</p>
    </div>
  </div>
);

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          
          {/* Access Denied component to reduce repetition */}
          {/* Common routes */}
          <Route path="/profile">
            {isAuthenticated ? <ProfilePage /> : <LoginPage />}
          </Route>
          <Route path="/settings">
            {isAuthenticated ? <SettingsPage /> : <LoginPage />}
          </Route>
          

        
          {/* Mobile Patient App */}
          <Route path="/mobile-app">
            <MobilePatientApp />
          </Route>

          {/* Medical Aid Claims */}
          <Route path="/medical-aid-claims">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? <MedicalAidClaimsPage /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>

          {/* Patient Portal Routes */}
          <Route path="/patient-portal">
            {isAuthenticated && user?.role === "PATIENT" ? <PatientPortalPage /> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          <Route path="/patient-portal/prescriptions">
            {isAuthenticated && user?.role === "PATIENT" ? 
             <GenericPage title="My Prescriptions" description="View and manage your prescriptions here" /> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          <Route path="/patient-portal/order-medicine">
            {isAuthenticated && user?.role === "PATIENT" ? 
             <GenericPage title="Order Medicine" description="Search and order medicines from our catalog" /> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          <Route path="/patient-portal/orders">
            {isAuthenticated && user?.role === "PATIENT" ? 
             <GenericPage title="My Orders" description="Track and view your medicine orders" /> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          <Route path="/patient-portal/verify-medicine">
            {isAuthenticated && user?.role === "PATIENT" ? 
             <GenericPage title="Verify Medicine" description="Verify the authenticity of your medicine" /> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          <Route path="/patient-portal/cart">
            {isAuthenticated && user?.role === "PATIENT" ? 
             <GenericPage title="Shopping Cart" description="Review and checkout your selected medicines" /> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          <Route path="/patient-portal/price-comparison">
            {isAuthenticated && user?.role === "PATIENT" ? 
             <PriceComparisonPage /> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          
          {/* Pharmacy Portal Routes */}
          <Route path="/pharmacy-portal">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? <PharmacyPortalPage /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/orders">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Manage Orders" description="View and manage customer orders" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/orders/new">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="New Orders" description="View and process new incoming orders" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/orders/processing">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Processing Orders" description="View orders currently being processed" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/orders/ready">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Ready for Pickup" description="Orders ready for customer pickup or delivery" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/orders/completed">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Completed Orders" description="View history of completed orders" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/inventory">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Inventory Management" description="Manage pharmacy medicine inventory" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/inventory/add">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Add Medicine" description="Add new medicines to inventory" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/inventory/low-stock">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Low Stock Alert" description="Monitor medicines with low stock levels" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/inventory/reports">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Stock Reports" description="Generate inventory reports and analytics" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/prescriptions">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <PrescriptionManagement />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/claims">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <GenericPage title="Medical Aid Claims" description="Process and manage medical aid claims" /> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/medical-aid">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <MedicalAidClaimsPage />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/assistant">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <PharmacyAssistant />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/dispensing">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <EfficientDispensingWorkflow />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          <Route path="/pharmacy-portal/analytics">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <PharmacyAnalytics />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Pharmacy" /> : <LoginPage />}
          </Route>
          
          {/* Doctor Portal Routes */}
          <Route path="/doctor-portal">
            {isAuthenticated && user?.role === "DOCTOR" ? <DoctorPortalPage /> : 
             isAuthenticated ? <AccessDenied role="Doctor" /> : <LoginPage />}
          </Route>
          <Route path="/doctor-portal/patients">
            {isAuthenticated && user?.role === "DOCTOR" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <DoctorPatients />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Doctor" /> : <LoginPage />}
          </Route>
          <Route path="/doctor-portal/prescriptions">
            {isAuthenticated && user?.role === "DOCTOR" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <DoctorPrescriptions />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Doctor" /> : <LoginPage />}
          </Route>
          <Route path="/doctor-portal/appointments">
            {isAuthenticated && user?.role === "DOCTOR" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <DoctorAppointments />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Doctor" /> : <LoginPage />}
          </Route>
          
          {/* Wholesaler Portal Routes */}
          <Route path="/wholesaler-portal">
            {isAuthenticated && user?.role === "WHOLESALER_STAFF" ? <WholesalerPortalPage /> : 
             isAuthenticated ? <AccessDenied role="Wholesaler" /> : <LoginPage />}
          </Route>
          <Route path="/wholesaler-portal/catalog">
            {isAuthenticated && user?.role === "WHOLESALER_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <WholesalerCatalog />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Wholesaler" /> : <LoginPage />}
          </Route>
          <Route path="/wholesaler-portal/orders">
            {isAuthenticated && user?.role === "WHOLESALER_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <WholesalerOrders />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Wholesaler" /> : <LoginPage />}
          </Route>
          <Route path="/wholesaler-portal/pharmacies">
            {isAuthenticated && user?.role === "WHOLESALER_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <PharmacyClients />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Wholesaler" /> : <LoginPage />}
          </Route>
          <Route path="/wholesaler-portal/analytics">
            {isAuthenticated && user?.role === "WHOLESALER_STAFF" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <WholesalerAnalytics />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Wholesaler" /> : <LoginPage />}
          </Route>
          
          {/* Profile & Settings Routes */}
          <Route path="/profile">
            {isAuthenticated ? <ProfilePage /> : <LoginPage />}
          </Route>
          <Route path="/settings">
            {isAuthenticated ? <SettingsPage /> : <LoginPage />}
          </Route>
          
          {/* Public Routes */}
          <Route path="/wellness-hub" component={WellnessHubPage} />
          <Route path="/wellness-hub/activities">
            {isAuthenticated && user?.role === "PATIENT" ? 
             <div className="flex">
               <Sidebar className="hidden md:block" />
               <div className="flex-1 p-6">
                 <WellnessHubPage />
               </div>
             </div> : 
             isAuthenticated ? <AccessDenied role="Patient" /> : <LoginPage />}
          </Route>
          
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <NetworkErrorHandler />
            <Toaster />
            <Router />
            <ContextualHelp />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
