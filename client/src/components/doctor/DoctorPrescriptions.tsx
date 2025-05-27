import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Edit, Printer } from 'lucide-react';

interface Prescription {
  id: number;
  patientName: string;
  dateIssued: string;
  medicines: string[];
  status: string;
  diagnosis: string;
}

export default function DoctorPrescriptions() {
  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ['/api/v1/doctor/erx'],
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
      case 'active': return 'default';
      case 'dispensed': return 'secondary';
      case 'expired': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">E-Prescriptions</h1>
          <p className="text-gray-600">Create and manage electronic prescriptions</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          New Prescription
        </Button>
      </div>

      <div className="grid gap-4">
        {prescriptions?.map((prescription) => (
          <Card key={prescription.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{prescription.patientName}</h3>
                  <p className="text-gray-600">{prescription.diagnosis}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Issued: {new Date(prescription.dateIssued).toLocaleDateString()}
                  </p>
                  <Badge variant={getStatusVariant(prescription.status)} className="mt-2">
                    {prescription.status}
                  </Badge>
                </div>
                
                <div className="flex-1 mx-6">
                  <p className="text-sm text-gray-500 mb-2">Prescribed Medicines:</p>
                  <div className="space-y-1">
                    {prescription.medicines.map((medicine, index) => (
                      <p key={index} className="text-sm bg-gray-50 p-2 rounded">
                        {medicine}
                      </p>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
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