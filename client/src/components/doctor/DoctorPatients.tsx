import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Calendar, FileText } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  age: number;
  lastVisit: string;
  condition: string;
  nextAppointment: string;
}

export default function DoctorPatients() {
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/v1/doctor/patients'],
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Patients</h1>
          <p className="text-gray-600">Manage and view patient information</p>
        </div>
        <Button>
          <User className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </div>

      <div className="grid gap-4">
        {patients?.map((patient) => (
          <Card key={patient.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{patient.name}</h3>
                  <p className="text-gray-600">Age: {patient.age}</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="mr-2">
                      {patient.condition}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Last Visit</p>
                    <p className="font-semibold">{new Date(patient.lastVisit).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next Appointment</p>
                    <p className="font-semibold text-blue-600">
                      {new Date(patient.nextAppointment).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-6">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Medical Records
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}