import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, User } from 'lucide-react';

interface Appointment {
  id: number;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

export default function DoctorAppointments() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/v1/doctor/appointments'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'default';
      case 'confirmed': return 'secondary';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-gray-600">Manage your patient appointments and schedule</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      <div className="grid gap-4">
        {appointments?.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{appointment.patientName}</h3>
                  <p className="text-gray-600">{appointment.type}</p>
                  <Badge variant={getStatusVariant(appointment.status)} className="mt-2">
                    {appointment.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-semibold">{new Date(appointment.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-semibold">{appointment.time}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-6">
                  <Button variant="outline" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    View Patient
                  </Button>
                  {appointment.status === 'Scheduled' && (
                    <Button size="sm">
                      Confirm
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}