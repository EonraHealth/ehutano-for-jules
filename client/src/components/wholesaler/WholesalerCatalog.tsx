import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, DollarSign, TrendingUp } from 'lucide-react';

interface CatalogItem {
  id: number;
  name: string;
  category: string;
  wholesalePrice: number;
  retailPrice: number;
  stockQuantity: number;
  manufacturer: string;
  batchNumber: string;
}

export default function WholesalerCatalog() {
  const { data: catalog, isLoading } = useQuery<CatalogItem[]>({
    queryKey: ['/api/v1/wholesaler/catalog'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
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
          <h1 className="text-2xl font-bold">Medicine Catalog</h1>
          <p className="text-gray-600">Manage your wholesale medicine inventory</p>
        </div>
        <Button>
          <Package className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      <div className="grid gap-4">
        {catalog?.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600">{item.manufacturer}</p>
                  <Badge variant="secondary" className="mt-2">
                    {item.category}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Wholesale Price</p>
                    <p className="font-semibold text-green-600">${item.wholesalePrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Retail Price</p>
                    <p className="font-semibold">${item.retailPrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stock</p>
                    <p className="font-semibold">{item.stockQuantity.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-6">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Batch: {item.batchNumber}</span>
                  <span>Margin: ${(item.retailPrice - item.wholesalePrice).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}