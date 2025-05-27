import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react';

export default function WholesalerAnalytics() {
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

  if (salesLoading || supplyChainLoading || demandForecastLoading || distributionLoading || medicalAidLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive business intelligence and performance metrics</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">$1.2M</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products Sold</p>
                <p className="text-2xl font-bold">15,847</p>
                <p className="text-xs text-green-600">+8% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Pharmacies</p>
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-green-600">+5 new this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold">23%</p>
                <p className="text-xs text-green-600">Year over year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="supply">Supply Chain</TabsTrigger>
          <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="medical-aid">Medical Aid Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                  <Bar dataKey="orders" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supply">
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={supplyChainData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="delivery" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={demandForecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" stroke="#3b82f6" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribution Network</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pharmacies" fill="#3b82f6" />
                  <Bar dataKey="volume" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical-aid">
          <Card>
            <CardHeader>
              <CardTitle>Medical Aid Impact on Wholesale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Claims Impact: ${medicalAidData?.claimsImpact?.toLocaleString() || 0}</h4>
                  <div className="space-y-2">
                    {medicalAidData?.preferredProviders?.map((provider, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{provider.provider}</span>
                        <span className="font-medium">{provider.volume} orders</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Top Medicines by Claims</h4>
                  <div className="space-y-2">
                    {medicalAidData?.topMedicines?.map((medicine, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{medicine.name}</span>
                        <span className="font-medium">{medicine.claimVolume} claims</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}