import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Eye, Truck } from 'lucide-react';

interface WholesalerOrder {
  id: number;
  pharmacyName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}

export default function WholesalerOrders() {
  const { data: orders, isLoading } = useQuery<WholesalerOrder[]>({
    queryKey: ['/api/v1/wholesaler/orders'],
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
      case 'pending': return 'destructive';
      case 'processing': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy Orders</h1>
          <p className="text-gray-600">Manage orders from your pharmacy clients</p>
        </div>
        <Button>
          <ClipboardList className="mr-2 h-4 w-4" />
          Export Orders
        </Button>
      </div>

      <div className="grid gap-4">
        {orders?.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{order.pharmacyName}</h3>
                  <p className="text-gray-600">Order #{order.id}</p>
                  <p className="text-sm text-gray-500">{order.orderDate}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-xl">${order.totalAmount.toFixed(2)}</p>
                  <Badge variant={getStatusVariant(order.status)} className="mt-2">
                    {order.status}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      Items: {order.items?.length || 0} products
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {order.status === 'Processing' && (
                      <Button size="sm">
                        <Truck className="mr-2 h-4 w-4" />
                        Mark Shipped
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}