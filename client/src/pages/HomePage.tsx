import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, Pill, UserRound, Stethoscope, Building2, HeartPulse, ShieldCheck } from 'lucide-react';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect the user to their appropriate portal if they're already logged in
  const getStartedLink = () => {
    if (!isAuthenticated) return '/register';
    
    switch (user?.role) {
      case UserRole.PATIENT:
        return '/patient-portal';
      case UserRole.PHARMACY_STAFF:
        return '/pharmacy-portal';
      case UserRole.DOCTOR:
        return '/doctor-portal';
      case UserRole.WHOLESALER_STAFF:
        return '/wholesaler-portal';
      default:
        return '/';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-purple-50 py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Zimbabwe's Integrated <span className="text-primary">Healthcare</span> Platform
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Connecting patients, pharmacies, doctors, and wholesalers for better healthcare access
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={getStartedLink()}>
              <Button size="lg" className="text-base px-6">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/medicines">
              <Button size="lg" variant="outline" className="text-base px-6">
                Browse Medicines
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Pill className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Online Pharmacy</h3>
              <p className="text-gray-600 mb-4">
                Order medications online and have them delivered to your doorstep or pick them up from your nearest pharmacy.
              </p>
              <Link href="/patient-portal/order-medicine">
                <Button variant="link" className="mt-auto">
                  Order Medicine
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Stethoscope className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Doctor Consultations</h3>
              <p className="text-gray-600 mb-4">
                Connect with healthcare professionals, get e-prescriptions, and manage your medical history.
              </p>
              <Link href="/doctor-portal">
                <Button variant="link" className="mt-auto">
                  Find a Doctor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <HeartPulse className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Wellness Hub</h3>
              <p className="text-gray-600 mb-4">
                Join community wellness activities, access health resources, and stay informed with our health blog.
              </p>
              <Link href="/wellness-hub">
                <Button variant="link" className="mt-auto">
                  Explore Wellness
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Medicine Verification Section */}
      <div className="w-full bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-4">Verify Your Medicine</h2>
              <p className="text-gray-700 mb-6">
                Our medicine verification system helps you check the authenticity of your medications. 
                Scan the QR code on your medicine package to ensure it's genuine and safe to use.
              </p>
              <Link href="/patient-portal/verify-medicine">
                <Button>
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Verify Medicine Now
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Scan QR Code</h3>
                    <p className="text-sm text-gray-600">Use our app to scan the QR code on your medicine</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Verify Authenticity</h3>
                    <p className="text-sm text-gray-600">Our system checks if the medicine is genuine</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Get Results</h3>
                    <p className="text-sm text-gray-600">See detailed information about your medicine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* For Professionals Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">For Healthcare Professionals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserRound className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Doctors</h3>
              <p className="text-gray-600 mb-4">
                Manage patient records, issue e-prescriptions, and track patient progress all in one place.
              </p>
              <Link href="/doctor-portal">
                <Button variant="outline" className="mt-auto">Join as a Doctor</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Pill className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Pharmacies</h3>
              <p className="text-gray-600 mb-4">
                Streamline inventory management, process orders, and connect with wholesalers efficiently.
              </p>
              <Link href="/pharmacy-portal">
                <Button variant="outline" className="mt-auto">Join as a Pharmacy</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Wholesalers</h3>
              <p className="text-gray-600 mb-4">
                Manage your product catalog, fulfill pharmacy orders, and track market trends.
              </p>
              <Link href="/wholesaler-portal">
                <Button variant="outline" className="mt-auto">Join as a Wholesaler</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="w-full bg-primary-600 text-white py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience Better Healthcare?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of Zimbabweans who are already benefiting from our integrated healthcare platform.
          </p>
          <Link href={getStartedLink()}>
            <Button size="lg" variant="secondary" className="text-base px-6">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
