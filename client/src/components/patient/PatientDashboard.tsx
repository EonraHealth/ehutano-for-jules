import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ShoppingBag, Shield, Calendar, CreditCard } from 'lucide-react';
import RecentOrders from './RecentOrders';
import MedicineVerification from './MedicineVerification';
import Prescriptions from './Prescriptions';
import WellnessActivities from './WellnessActivities';
import HealthBlog from './HealthBlog';
import PartnerLogos from './PartnerLogos';
import MedicalAidSection from './MedicalAidSection';
import MedicalAidClaimsHistory from './MedicalAidClaimsHistory';

const PatientDashboard = () => {
  const { user } = useAuth();

  const { data: patientProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/v1/patient/profile'],
  });

  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['/api/v1/patient/reminders'],
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Sidebar */}
      <div className="md:col-span-1">
        {/* User Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {user?.profilePictureUrl ? (
                <img
                  className="h-16 w-16 rounded-full"
                  src={user.profilePictureUrl}
                  alt="User profile"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">{user?.fullName}</h2>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Medical Aid:</span>
                  {profileLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : patientProfile?.medicalAidVerified ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                      Unverified
                    </span>
                  )}
                </div>
                {profileLoading ? (
                  <Skeleton className="h-4 w-32 mt-1" />
                ) : (
                  <p className="text-sm text-gray-500">
                    {patientProfile?.medicalAidProvider 
                      ? `${patientProfile.medicalAidProvider} - ${patientProfile.medicalAidMemberId}` 
                      : 'No medical aid information'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/patient-portal/upload-prescription">
                <a className="block p-3 bg-blue-50 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition duration-150">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-3" />
                    Upload a Prescription
                  </div>
                </a>
              </Link>
              <Link href="/patient-portal/order-medicine">
                <a className="block p-3 bg-green-50 rounded-lg text-green-700 font-medium hover:bg-green-100 transition duration-150">
                  <div className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    Order Medicine
                  </div>
                </a>
              </Link>
              <Link href="/patient-portal/verify-medicine">
                <a className="block p-3 bg-purple-50 rounded-lg text-purple-700 font-medium hover:bg-purple-100 transition duration-150">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 mr-3" />
                    Verify Medicine
                  </div>
                </a>
              </Link>
              <Link href="/wellness-hub/activities">
                <a className="block p-3 bg-yellow-50 rounded-lg text-yellow-700 font-medium hover:bg-yellow-100 transition duration-150">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3" />
                    Book Wellness Activity
                  </div>
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Medication Reminders */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Medication Reminders</h3>
            <div className="space-y-4">
              {remindersLoading ? (
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className="flex-grow">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                ))
              ) : reminders && reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <div 
                    key={reminder.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg ${
                      reminder.type === 'REFILL' 
                        ? 'bg-red-50' 
                        : reminder.type === 'MEDICATION' 
                          ? 'bg-blue-50' 
                          : 'bg-yellow-50'
                    }`}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${
                          reminder.type === 'REFILL' 
                            ? 'text-red-500' 
                            : reminder.type === 'MEDICATION' 
                              ? 'text-blue-500' 
                              : 'text-yellow-500'
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        reminder.type === 'REFILL' 
                          ? 'text-red-700' 
                          : reminder.type === 'MEDICATION' 
                            ? 'text-blue-700' 
                            : 'text-yellow-700'
                      }`}>
                        {reminder.type === 'REFILL' 
                          ? 'Refill Reminder' 
                          : reminder.type === 'MEDICATION' 
                            ? 'Take Medication' 
                            : 'Doctor Appointment'}
                      </p>
                      <p className={`text-xs ${
                        reminder.type === 'REFILL' 
                          ? 'text-red-600' 
                          : reminder.type === 'MEDICATION' 
                            ? 'text-blue-600' 
                            : 'text-yellow-600'
                      }`}>
                        {reminder.details}
                      </p>
                    </div>
                    <button 
                      className={`flex-shrink-0 ml-auto rounded-full p-1 ${
                        reminder.type === 'REFILL' 
                          ? 'text-red-400 hover:bg-red-200' 
                          : reminder.type === 'MEDICATION' 
                            ? 'text-blue-400 hover:bg-blue-200' 
                            : 'text-yellow-400 hover:bg-yellow-200'
                      } focus:outline-none`}
                      onClick={() => {
                        // Dismiss reminder API call
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No reminders at the moment
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="md:col-span-2">
        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search for medicines, symptoms, health topics..."
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <RecentOrders />

        {/* Medicine Verification */}
        <MedicineVerification />

        {/* Prescriptions */}
        <Prescriptions />

        {/* Wellness Activities and Health Blog */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <WellnessActivities />
          <HealthBlog />
        </div>

        {/* Partner Logos */}
        <PartnerLogos />
      </div>
    </div>
  );
};

export default PatientDashboard;
