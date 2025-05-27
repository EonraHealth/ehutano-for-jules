import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Phone, Mail } from 'lucide-react';

interface PharmacyClient {
  id: number;
  pharmacyName: string;
  location: string;
  contactPerson: string;
  monthlyOrders: number;
  totalRevenue: number;
  status: string;
  joinDate: string;
}

export default function PharmacyClients() {
  const { data: clients, isLoading } = useQuery<PharmacyClient[]>({
    queryKey: ['/api/v1/wholesaler/pharmacy-clients'],
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
          <h1 className="text-2xl font-bold">Pharmacy Clients</h1>
          <p className="text-gray-600">Manage your pharmacy client relationships</p>
        </div>
        <Button>
          <Users className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <div className="grid gap-4">
        {clients?.map((client) => (
          <Card key={client.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{client.pharmacyName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{client.location}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Contact: {client.contactPerson}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {client.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Monthly Orders</p>
                    <p className="font-semibold text-2xl">{client.monthlyOrders}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Revenue</p>
                    <p className="font-semibold text-2xl text-green-600">
                      ${client.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-6">
                  <Button variant="outline" size="sm">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Client since: {new Date(client.joinDate).toLocaleDateString()}</span>
                  <Button variant="link" size="sm" className="p-0">
                    View Order History
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