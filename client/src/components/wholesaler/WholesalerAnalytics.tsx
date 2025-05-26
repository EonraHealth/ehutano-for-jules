import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart, 
  MapPin,
  Download,
  Loader2,
  Target,
  Truck
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  subtitle: string;
  icon: React.ReactNode;
}

const AnalyticsCard = ({ title, value, change, changeType, subtitle, icon }: AnalyticsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
        {changeType === 'increase' ? (
          <TrendingUp className="h-3 w-3 text-green-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <span className={changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
          {change > 0 ? '+' : ''}{change}%
        </span>
        <span>{subtitle}</span>
      </div>
    </CardContent>
  </Card>
);

const WholesalerAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Fetch analytics data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['/api/v1/wholesaler/analytics/sales', selectedPeriod],
  });

  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/v1/wholesaler/analytics/clients', selectedPeriod],
  });

  const { data: geographicData, isLoading: geographicLoading } = useQuery({
    queryKey: ['/api/v1/wholesaler/analytics/geographic', selectedPeriod],
  });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['/api/v1/wholesaler/analytics/products', selectedPeriod],
  });

  const { data: profitData, isLoading: profitLoading } = useQuery({
    queryKey: ['/api/v1/wholesaler/analytics/profit', selectedPeriod],
  });

  const { data: supplyChainData, isLoading: supplyChainLoading } = useQuery({
    queryKey: ['/api/v1/wholesaler/analytics/supply-chain', selectedPeriod],
  });

  const isLoading = salesLoading || clientLoading || geographicLoading || productLoading || profitLoading || supplyChainLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Wholesaler Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your distribution network and sales performance
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="harare">Harare</SelectItem>
              <SelectItem value="bulawayo">Bulawayo</SelectItem>
              <SelectItem value="mutare">Mutare</SelectItem>
              <SelectItem value="gweru">Gweru</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Sales"
          value={`$${salesData?.totalSales?.toLocaleString() || '0'}`}
          change={salesData?.salesChange || 0}
          changeType={salesData?.salesChange >= 0 ? 'increase' : 'decrease'}
          subtitle="from last period"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        
        <AnalyticsCard
          title="Active Clients"
          value={clientData?.activeClients || 0}
          change={clientData?.clientsChange || 0}
          changeType={clientData?.clientsChange >= 0 ? 'increase' : 'decrease'}
          subtitle="pharmacy partners"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        
        <AnalyticsCard
          title="Orders Fulfilled"
          value={salesData?.ordersCompleted || 0}
          change={salesData?.ordersChange || 0}
          changeType={salesData?.ordersChange >= 0 ? 'increase' : 'decrease'}
          subtitle="from last period"
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        
        <AnalyticsCard
          title="Profit Margin"
          value={`${profitData?.avgMargin || 0}%`}
          change={profitData?.marginChange || 0}
          changeType={profitData?.marginChange >= 0 ? 'increase' : 'decrease'}
          subtitle="average margin"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Performance</TabsTrigger>
          <TabsTrigger value="clients">Client Analysis</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Distribution</TabsTrigger>
          <TabsTrigger value="products">Product Demand</TabsTrigger>
          <TabsTrigger value="supply-chain">Supply Chain</TabsTrigger>
        </TabsList>

        {/* Sales Performance */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Revenue and order volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={salesData?.salesTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#8884d8" fillOpacity={0.3} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Distribution across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesData?.revenueByCategory || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {(salesData?.revenueByCategory || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Best selling products by revenue and volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData?.topProducts || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Analysis */}
        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Pharmacy Clients</CardTitle>
                <CardDescription>Highest revenue generating partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(clientData?.topClients || []).map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.location} • {client.ordersCount} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${client.revenue?.toLocaleString()}</p>
                        <Badge variant={client.growth >= 0 ? 'default' : 'secondary'}>
                          {client.growth >= 0 ? '+' : ''}{client.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
                <CardDescription>New client acquisition over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={clientData?.clientGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="newClients" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalClients" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Client Segmentation</CardTitle>
              <CardDescription>Distribution by purchase volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientData?.clientSegments || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Distribution */}
        <TabsContent value="geographic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Region</CardTitle>
                <CardDescription>Geographic distribution of revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={geographicData?.salesByRegion || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                    >
                      {(geographicData?.salesByRegion || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Performance</CardTitle>
                <CardDescription>Growth trends by geographic area</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographicData?.regionalGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="growth" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Coverage</CardTitle>
              <CardDescription>Distribution network efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {(geographicData?.deliveryCoverage || []).map((region, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium">{region.name}</h3>
                    <p className="text-sm text-muted-foreground">{region.pharmacies} pharmacies</p>
                    <p className="text-lg font-bold">{region.avgDeliveryTime}h</p>
                    <p className="text-xs text-muted-foreground">avg delivery time</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Demand */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demand Trends</CardTitle>
                <CardDescription>Product category demand over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productData?.demandTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="antibiotics" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="analgesics" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="vitamins" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Patterns</CardTitle>
                <CardDescription>Monthly demand variations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={productData?.seasonalPatterns || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="demand" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover</CardTitle>
              <CardDescription>Product movement analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(productData?.inventoryTurnover || []).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.turnoverRate}x</p>
                      <p className="text-sm text-muted-foreground">
                        {product.unitsShipped} units shipped
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supply Chain */}
        <TabsContent value="supply-chain" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Fulfillment</CardTitle>
                <CardDescription>Processing times and efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supplyChainData?.fulfillmentMetrics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
                <CardDescription>On-time delivery rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">On-time Deliveries</span>
                    <span className="text-2xl font-bold text-green-600">
                      {supplyChainData?.onTimeDeliveryRate || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Delivery Time</span>
                    <span className="text-2xl font-bold">
                      {supplyChainData?.avgDeliveryTime || 0}h
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Order Accuracy</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {supplyChainData?.orderAccuracy || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>Warehouse inventory status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={supplyChainData?.stockLevels || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="stockLevel" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WholesalerAnalytics;