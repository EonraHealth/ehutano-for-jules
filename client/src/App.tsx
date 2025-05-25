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

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientPortalPage from "./pages/PatientPortalPage";
import PharmacyPortalPage from "./pages/PharmacyPortalPage";
import DoctorPortalPage from "./pages/DoctorPortalPage";
import WholesalerPortalPage from "./pages/WholesalerPortalPage";
import WellnessHubPage from "./pages/WellnessHubPage";

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
          
          {/* Protected Routes with strict role-based access */}
          <Route path="/patient-portal">
            {isAuthenticated && user?.role === "PATIENT" ? 
              <PatientPortalPage /> : 
              <LoginPage />
            }
          </Route>
          
          <Route path="/pharmacy-portal">
            {isAuthenticated && user?.role === "PHARMACY_STAFF" ? 
              <PharmacyPortalPage /> : 
              isAuthenticated ? 
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="mb-4">You don't have permission to access the Pharmacy Portal.</p>
                    <p className="text-sm text-gray-600">Please log in with a pharmacy staff account to access this area.</p>
                  </div>
                </div> : 
                <LoginPage />
            }
          </Route>
          
          <Route path="/doctor-portal">
            {isAuthenticated && user?.role === "DOCTOR" ? 
              <DoctorPortalPage /> : 
              isAuthenticated ? 
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="mb-4">You don't have permission to access the Doctor Portal.</p>
                    <p className="text-sm text-gray-600">Please log in with a doctor account to access this area.</p>
                  </div>
                </div> : 
                <LoginPage />
            }
          </Route>
          
          <Route path="/wholesaler-portal">
            {isAuthenticated && user?.role === "WHOLESALER_STAFF" ? 
              <WholesalerPortalPage /> : 
              isAuthenticated ? 
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="mb-4">You don't have permission to access the Wholesaler Portal.</p>
                    <p className="text-sm text-gray-600">Please log in with a wholesaler staff account to access this area.</p>
                  </div>
                </div> : 
                <LoginPage />
            }
          </Route>
          
          <Route path="/wellness-hub" component={WellnessHubPage} />
          
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
