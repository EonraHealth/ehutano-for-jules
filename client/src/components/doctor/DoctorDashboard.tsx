import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Prescription, PrescriptionStatus } from '@/types';

// Define custom types for the doctor dashboard
interface Patient {
  id: number;
  name: string;
  lastVisit: string;
  conditions?: string[];
  upcomingAppointment?: string;
}

interface Appointment {
  id: number;
  patientName: string;
  time: string;
  reason: string;
  isCompleted: boolean;
}

const DoctorDashboard = () => {
  const { user } = useAuth();

  // Fetch today's appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/v1/doctor/appointments/today'],
  });

  // Fetch recent prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ['/api/v1/doctor/erx'],
  });

  // Fetch recent patients
  const { data: recentPatients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ['/api/v1/doctor/patients/recent'],
  });

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time function
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get prescription status badge
  const getPrescriptionStatusBadge = (status: PrescriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'FILLED':
        return <Badge className="bg-blue-100 text-blue-800">Filled</Badge>;
      case 'PENDING_REVIEW':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome back, Dr. {user?.fullName}</h2>
              <p className="text-muted-foreground">
                Here's your schedule and patient information for today.
              </p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/doctor-portal/erx/create">
                <Button>Create E-Prescription</Button>
              </Link>
              <Link href="/doctor-portal/appointments">
                <Button variant="outline">View All Appointments</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M8 2v4M16 2v4M3 10h18M21 8v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointmentsLoading ? <Skeleton className="h-8 w-16" /> : appointments?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentsLoading ? <Skeleton className="h-3 w-32" /> : 
                appointments && appointments.length > 0 
                  ? `Next: ${appointments[0].patientName} at ${formatTime(appointments[0].time)}`
                  : 'No appointments scheduled for today'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
              <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {prescriptionsLoading ? <Skeleton className="h-8 w-16" /> : 
                prescriptions?.filter(p => p.status === 'PENDING_REVIEW').length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {prescriptionsLoading ? <Skeleton className="h-3 w-32" /> : 'Requiring your attention'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patientsLoading ? <Skeleton className="h-8 w-16" /> : '254'}
            </div>
            <p className="text-xs text-muted-foreground">
              {patientsLoading ? <Skeleton className="h-3 w-32" /> : '+5 new patients this month'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultations (Monthly)</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointmentsLoading ? <Skeleton className="h-8 w-16" /> : '87'}
            </div>
            <p className="text-xs text-muted-foreground">
              {appointmentsLoading ? <Skeleton className="h-3 w-32" /> : '+8.2% from last month'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's Appointments - Larger */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                ))}
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{appointment.patientName}</h4>
                        {appointment.isCompleted ? (
                          <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                            {new Date(`2000-01-01T${appointment.time}`).getTime() <= new Date().getTime() ? 'Current' : 'Upcoming'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatTime(appointment.time)} • {appointment.reason}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/doctor-portal/appointments/${appointment.id}`}>
                        <Button size="sm" variant={appointment.isCompleted ? "outline" : "default"}>
                          {appointment.isCompleted ? 'View Notes' : 'Start'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No appointments scheduled for today</p>
                <div className="mt-4">
                  <Link href="/doctor-portal/appointments/create">
                    <Button>Schedule Appointment</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients - Smaller */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {patientsLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            ) : recentPatients && recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">{patient.name}</h4>
                      <p className="text-sm text-gray-500">
                        Last visit: {formatDate(patient.lastVisit)}
                      </p>
                      {patient.upcomingAppointment && (
                        <p className="text-xs text-blue-600">
                          Upcoming: {patient.upcomingAppointment}
                        </p>
                      )}
                    </div>
                    <Link href={`/doctor-portal/patients/${patient.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent patients</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent">
            <TabsList className="mb-4">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent">
              {prescriptionsLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-9 w-20 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : prescriptions && prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.slice(0, 5).map((prescription) => (
                    <div key={prescription.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium">Patient: {prescription.patientName || 'ID: ' + prescription.patientId}</h4>
                          {getPrescriptionStatusBadge(prescription.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                          Issued: {formatDate(prescription.dateIssued)} • 
                          {prescription.items && prescription.items.length > 0 
                            ? ` ${prescription.items.length} medications`
                            : ' No medication details'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/doctor-portal/erx/${prescription.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No prescriptions found</p>
                  <div className="mt-4">
                    <Link href="/doctor-portal/erx/create">
                      <Button>Create E-Prescription</Button>
                    </Link>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending">
              {prescriptionsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : prescriptions && prescriptions.filter(p => p.status === 'PENDING_REVIEW').length > 0 ? (
                <div className="space-y-4">
                  {prescriptions
                    .filter(p => p.status === 'PENDING_REVIEW')
                    .map((prescription) => (
                      <div key={prescription.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium">Patient: {prescription.patientName || 'ID: ' + prescription.patientId}</h4>
                            {getPrescriptionStatusBadge(prescription.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Requires your review • Issued: {formatDate(prescription.dateIssued)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/doctor-portal/erx/${prescription.id}/review`}>
                            <Button size="sm">Review</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No prescriptions pending review</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="active">
              {prescriptionsLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : prescriptions && prescriptions.filter(p => p.status === 'ACTIVE').length > 0 ? (
                <div className="space-y-4">
                  {prescriptions
                    .filter(p => p.status === 'ACTIVE')
                    .map((prescription) => (
                      <div key={prescription.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium">Patient: {prescription.patientName || 'ID: ' + prescription.patientId}</h4>
                            {getPrescriptionStatusBadge(prescription.status)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Issued: {formatDate(prescription.dateIssued)} • 
                            Refills left: {prescription.refillsLeft}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/doctor-portal/erx/${prescription.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active prescriptions</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;
