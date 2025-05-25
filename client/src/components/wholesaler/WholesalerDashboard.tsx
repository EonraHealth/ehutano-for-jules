import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define custom types for the wholesaler dashboard
interface WholesalerOrder {
  id: number;
  pharmacyName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}

interface InventoryItem {
  id: number;
  name: string;
  availableStock: number;
  wholesalePrice: number;
  minimumOrderQuantity: number;
  category: string;
}

const WholesalerDashboard = () => {
  const { user } = useAuth();

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<WholesalerOrder[]>({
    queryKey: ['/api/v1/wholesaler/orders'],
  });

  // Fetch inventory
  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/v1/wholesaler/catalog'],
  });

  // Fetch sales data for charts
  const { data: salesData, isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ['/api/v1/wholesaler/analytics/sales'],
  });
  
  // Fetch supply chain analytics
  const { data: supplyChainData, isLoading: supplyChainLoading } = useQuery<any[]>({
    queryKey: ['/api/v1/wholesaler/analytics/supply-chain'],
  });
  
  // Fetch market demand forecasts
  const { data: demandForecastData, isLoading: demandForecastLoading } = useQuery<any[]>({
    queryKey: ['/api/v1/wholesaler/analytics/demand-forecast'],
  });
  
  // Fetch pharmacy distribution data
  const { data: distributionData, isLoading: distributionLoading } = useQuery<any[]>({
    queryKey: ['/api/v1/wholesaler/analytics/distribution'],
  });
  
  // Fetch medical aid claims impact on wholesale
  const { data: medicalAidData, isLoading: medicalAidLoading } = useQuery<{
    claimsImpact: number;
    preferredProviders: { provider: string; volume: number }[];
    topMedicines: { name: string; claimVolume: number }[];
    growth: number;
  }>({
    queryKey: ['/api/v1/wholesaler/analytics/medical-aid-impact'],
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

  // Mock data for trending medicines
  const trendingMedicines = [
    { name: 'Amoxicillin 500mg', trend: '+18%', category: 'Antibiotics' },
    { name: 'Paracetamol 500mg', trend: '+12%', category: 'Pain Relief' },
    { name: 'Metformin 850mg', trend: '+8%', category: 'Diabetes' },
    { name: 'Atorvastatin 20mg', trend: '+7%', category: 'Cholesterol' },
  ];

  // Mock data for low stock alerts
  const lowStockAlerts = [
    { name: 'Ciprofloxacin 500mg', stock: 15, threshold: 50, category: 'Antibiotics' },
    { name: 'Insulin Glargine', stock: 8, threshold: 20, category: 'Diabetes' },
    { name: 'Salbutamol Inhaler', stock: 12, threshold: 30, category: 'Respiratory' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.fullName}</h2>
              <p className="text-muted-foreground">
                Here's an overview of your wholesale operations.
              </p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/wholesaler-portal/catalog/add">
                <Button>Add Product</Button>
              </Link>
              <Link href="/wholesaler-portal/orders">
                <Button variant="outline">View All Orders</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders (Monthly)</CardTitle>
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
              {ordersLoading ? <Skeleton className="h-8 w-16" /> : '128'}
            </div>
            <p className="text-xs text-muted-foreground">
              +14% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (Monthly)</CardTitle>
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
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesLoading ? <Skeleton className="h-8 w-16" /> : '$42,500'}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catalog Items</CardTitle>
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
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M16 2v6M8 2v6M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryLoading ? <Skeleton className="h-8 w-16" /> : inventory?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventoryLoading ? <Skeleton className="h-3 w-32" /> : 
                `${lowStockAlerts.length} items low in stock`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersLoading ? <Skeleton className="h-8 w-16" /> : 
                orders?.filter(order => order.status === 'PENDING_CONFIRMATION').length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring your attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Orders - Larger */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
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
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{order.pharmacyName}</h4>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${
                            order.status === 'PENDING_CONFIRMATION' 
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : order.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : order.status === 'SHIPPED'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : order.status === 'DELIVERED'
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Order date: {formatDate(order.orderDate)} • 
                        {order.items.length} items • 
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <Link href={`/wholesaler-portal/orders/${order.id}`}>
                      <Button size="sm" variant={order.status === 'PENDING_CONFIRMATION' ? 'default' : 'outline'}>
                        {order.status === 'PENDING_CONFIRMATION' ? 'Process' : 'View'}
                      </Button>
                    </Link>
                  </div>
                ))}
                {orders.length > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/wholesaler-portal/orders">
                      <Button variant="link">View all {orders.length} orders</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts - Smaller */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                ))}
              </div>
            ) : lowStockAlerts.length > 0 ? (
              <div className="space-y-4">
                {lowStockAlerts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        Stock: <span className="text-red-600 font-medium">{item.stock}</span> / {item.threshold} • {item.category}
                      </p>
                    </div>
                    <Link href={`/wholesaler-portal/catalog/${item.name.replace(/\s+/g, '-').toLowerCase()}`}>
                      <Button size="sm" variant="outline">Restock</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No low stock alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly">
            <TabsList className="mb-4">
              <TabsTrigger value="monthly">Monthly Revenue</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="trending">Trending Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly">
              {salesLoading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <Skeleton className="h-[300px] w-full rounded-md" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={salesData || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" name="Revenue ($)" />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" name="Order Count" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            
            <TabsContent value="categories">
              {salesLoading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <Skeleton className="h-[300px] w-full rounded-md" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={[
                      { name: 'Antibiotics', sales: 12000 },
                      { name: 'Pain Relief', sales: 9500 },
                      { name: 'Vitamins', sales: 7800 },
                      { name: 'Diabetes', sales: 6300 },
                      { name: 'Cardiac', sales: 5500 },
                      { name: 'Respiratory', sales: 4900 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales ($)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
            
            <TabsContent value="trending">
              <div className="space-y-4">
                {trendingMedicines.map((medicine, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">{medicine.name}</h4>
                      <p className="text-sm text-gray-500">{medicine.category}</p>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-green-100 text-green-800 mr-3">
                        {medicine.trend}
                      </Badge>
                      <Link href={`/wholesaler-portal/catalog/${medicine.name.replace(/\s+/g, '-').toLowerCase()}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pharmacy Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pharmacy Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This would be dynamic data from the API in a real implementation */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h4 className="font-medium">Bonvie Pharmacy</h4>
                <p className="text-sm text-gray-500">Harare Central • 24 orders this month</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$7,850</p>
                <p className="text-xs text-gray-500">Monthly average</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h4 className="font-medium">Pulse Pharmacy</h4>
                <p className="text-sm text-gray-500">Avondale • 18 orders this month</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$6,320</p>
                <p className="text-xs text-gray-500">Monthly average</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h4 className="font-medium">Green Cross Pharmacy</h4>
                <p className="text-sm text-gray-500">Bulawayo • 15 orders this month</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$5,180</p>
                <p className="text-xs text-gray-500">Monthly average</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h4 className="font-medium">HealthFirst Pharmacy</h4>
                <p className="text-sm text-gray-500">Mutare • 12 orders this month</p>
              </div>
              <div className="text-right">
                <p className="font-medium">$4,250</p>
                <p className="text-xs text-gray-500">Monthly average</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Link href="/wholesaler-portal/pharmacies">
              <Button variant="outline">View All Clients</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WholesalerDashboard;
