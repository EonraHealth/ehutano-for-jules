import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MedicalAidClaimsManagement from './MedicalAidClaimsManagement';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order } from '@/types';

// Define a custom order type for the pharmacy dashboard
interface PharmacyOrder extends Order {
  patientName: string;
  requiresAction: boolean;
}

const PharmacyDashboard = () => {
  const { user } = useAuth();

  // Fetch pending orders that require action
  const { data: pendingOrders, isLoading: ordersLoading } = useQuery<PharmacyOrder[]>({
    queryKey: ['/api/v1/pharmacy/orders?status=pending'],
  });

  // Fetch inventory status summary
  const { data: inventorySummary, isLoading: inventoryLoading } = useQuery<{
    inStock: number;
    lowStock: number;
    outOfStock: number;
    total: number;
  }>({
    queryKey: ['/api/v1/pharmacy/inventory/summary'],
  });

  // Fetch sales data for charts
  const { data: salesData, isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ['/api/v1/pharmacy/analytics/sales'],
  });
  
  // Fetch medicine category data for charts
  const { data: categoryData, isLoading: categoryLoading } = useQuery<any[]>({
    queryKey: ['/api/v1/pharmacy/analytics/categories'],
  });
  
  // Fetch trends data
  const { data: trendsData, isLoading: trendsLoading } = useQuery<any[]>({
    queryKey: ['/api/v1/pharmacy/analytics/trends'],
  });
  
  // Fetch medical aid claims analytics
  const { data: medicalAidAnalytics, isLoading: medicalAidLoading } = useQuery<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalValue: number;
  }>({
    queryKey: ['/api/v1/pharmacy/analytics/medical-aid'],
  });

  // Mock data for market watch (will be replaced with real API)
  const marketWatchData = {
    fastMoving: [
      { id: 'MED001', name: 'Paracetamol 500mg Tabs', trend: '+25% sales WoW', source: 'Aggregated POS' },
      { id: 'MED007', name: 'Ibuprofen 200mg Tabs', trend: 'High seasonal demand', source: 'AI Model' },
    ],
    highDemand: [
      { id: 'MED002', name: 'Amoxicillin 250mg Caps', reason: 'Increased Rx volume', source: 'E-Rx Trends' },
      { id: 'MED012', name: 'Azithromycin 500mg', reason: 'Seasonal infections', source: 'Nationwide Trends' },
    ],
    stockOut: [
      { id: 'MED023', name: 'Metformin 850mg', reason: 'Supply chain issues', distributor: 'MediSupply' },
      { id: 'MED045', name: 'Insulin Glargine', reason: 'High demand', distributor: 'PharmaDistro' },
    ]
  };

  // Define colors for pie chart
  const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

  // Prepare inventory data for pie chart
  const inventoryPieData = !inventoryLoading && inventorySummary ? [
    { name: 'In Stock', value: inventorySummary.inStock },
    { name: 'Low Stock', value: inventorySummary.lowStock },
    { name: 'Out of Stock', value: inventorySummary.outOfStock },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Greeting and summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.fullName}</h2>
              <p className="text-muted-foreground">
                Here's what's happening with your pharmacy today.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link href="/pharmacy-portal/inventory">
                <Button>Manage Inventory</Button>
              </Link>
              <Link href="/pharmacy-portal/orders">
                <Button variant="outline">View All Orders</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
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
              {ordersLoading ? <Skeleton className="h-8 w-16" /> : '42'}
            </div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
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
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersLoading ? <Skeleton className="h-8 w-16" /> : pendingOrders?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders?.filter(o => o.requiresAction).length || '0'} require action
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Status</CardTitle>
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
              {inventoryLoading ? <Skeleton className="h-8 w-16" /> : inventorySummary?.total || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventoryLoading ? <Skeleton className="h-3 w-32" /> : `${inventorySummary?.lowStock || '0'} items low in stock`}
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
              {salesLoading ? <Skeleton className="h-8 w-16" /> : '$8,450'}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Pending Orders section - Larger */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
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
            ) : pendingOrders && pendingOrders.length > 0 ? (
              <div className="space-y-4">
                {pendingOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{order.patientName}</h4>
                        {order.requiresAction && (
                          <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Order #{order.orderNumber} • {new Date(order.orderDate).toLocaleDateString()} • 
                        {order.medicalAidProvider ? ` ${order.medicalAidProvider} Member` : ' Cash Payment'}
                      </p>
                    </div>
                    <Link href={`/pharmacy-portal/orders/${order.id}`}>
                      <Button size="sm">Process</Button>
                    </Link>
                  </div>
                ))}
                {pendingOrders.length > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/pharmacy-portal/orders">
                      <Button variant="link">View all {pendingOrders.length} pending orders</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending orders at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Status Chart - Smaller */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="flex justify-center items-center h-[250px]">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {inventoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Link href="/pharmacy-portal/inventory?filter=low-stock">
                <Button variant="outline" className="w-full text-yellow-700 border-yellow-300 bg-yellow-50 hover:bg-yellow-100 hover:text-yellow-800">
                  Low Stock ({inventorySummary?.lowStock || 0})
                </Button>
              </Link>
              <Link href="/pharmacy-portal/inventory?filter=out-of-stock">
                <Button variant="outline" className="w-full text-red-700 border-red-300 bg-red-50 hover:bg-red-100 hover:text-red-800">
                  Out of Stock ({inventorySummary?.outOfStock || 0})
                </Button>
              </Link>
              <Link href="/pharmacy-portal/inventory">
                <Button variant="outline" className="w-full">
                  View All
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Aid Claims Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Medical Aid Claims Management</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicalAidClaimsManagement />
        </CardContent>
      </Card>

      {/* Advanced Analytics Dashboard */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Advanced Business Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales">
            <TabsList className="mb-4">
              <TabsTrigger value="sales">Sales Performance</TabsTrigger>
              <TabsTrigger value="categories">Product Categories</TabsTrigger>
              <TabsTrigger value="trends">Market Trends</TabsTrigger>
              <TabsTrigger value="medicalAid">Medical Aid Claims</TabsTrigger>
            </TabsList>
            
            {/* Sales Performance Tab */}
            <TabsContent value="sales">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sales Performance Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Current Month Revenue</div>
                      <div className="text-2xl font-bold">$8,450</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                        </svg>
                        20.1% from last month
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Average Order Value</div>
                      <div className="text-2xl font-bold">$42.80</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                        </svg>
                        5.3% from last month
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Total Transactions</div>
                      <div className="text-2xl font-bold">197</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                        </svg>
                        12.8% from last month
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {salesLoading ? (
                  <div className="h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full rounded-md" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={salesData || []}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales ($)" />
                      <Bar dataKey="transactions" fill="hsl(var(--chart-2))" name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                
                <div className="flex justify-end mt-4">
                  <Link href="/pharmacy-portal/analytics/sales">
                    <Button variant="outline" size="sm">View Detailed Sales Report</Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            {/* Product Categories Tab */}
            <TabsContent value="categories">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Category Analysis</h3>
                
                {categoryLoading ? (
                  <div className="h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full rounded-md" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData || []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-4">
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Top Performing Categories</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span>Pain Relievers</span>
                              <span className="font-medium">32%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span>Antibiotics</span>
                              <span className="font-medium">24%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '24%' }}></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span>Vitamins & Supplements</span>
                              <span className="font-medium">18%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Growth Opportunities</h4>
                          <p className="text-sm text-gray-500 mb-2">Categories with rising demand:</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Chronic Medication</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700">+15% Growth</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Diabetes Care</span>
                              <Badge variant="outline" className="bg-green-50 text-green-700">+12% Growth</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Link href="/pharmacy-portal/analytics/categories">
                    <Button variant="outline" size="sm">View Category Details</Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            {/* Market Trends Tab */}
            <TabsContent value="trends">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Market Trend Analysis</h3>
                
                {trendsLoading ? (
                  <div className="h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full rounded-md" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Seasonal Demand Forecast</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={trendsData || []}
                              margin={{
                                top: 5,
                                right: 10,
                                left: 10,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="cold_flu" stroke="#8884d8" name="Cold & Flu" />
                              <Line type="monotone" dataKey="allergy" stroke="#82ca9d" name="Allergy" />
                              <Line type="monotone" dataKey="vitamins" stroke="#ffc658" name="Vitamins" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Predicted Demand</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Cold & Flu Medication</span>
                              <span className="text-sm font-medium">High</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Allergy Medication</span>
                              <span className="text-sm font-medium">Medium</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Vitamin Supplements</span>
                              <span className="text-sm font-medium">Rising</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Pain Relievers</span>
                              <span className="text-sm font-medium">Stable</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-gray-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Link href="/pharmacy-portal/analytics/trends">
                    <Button variant="outline" size="sm">View Market Trend Report</Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
            
            {/* Medical Aid Claims Tab */}
            <TabsContent value="medicalAid">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Medical Aid Claims Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Total Claims</div>
                      <div className="text-2xl font-bold">{medicalAidAnalytics?.total || '0'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Pending Claims</div>
                      <div className="text-2xl font-bold">{medicalAidAnalytics?.pending || '0'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Approved Claims</div>
                      <div className="text-2xl font-bold">{medicalAidAnalytics?.approved || '0'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Total Value</div>
                      <div className="text-2xl font-bold">${medicalAidAnalytics?.totalValue?.toFixed(2) || '0.00'}</div>
                    </CardContent>
                  </Card>
                </div>
                
                {medicalAidLoading ? (
                  <div className="h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-full rounded-md" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Claims by Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Approved', value: medicalAidAnalytics?.approved || 0 },
                                  { name: 'Pending', value: medicalAidAnalytics?.pending || 0 },
                                  { name: 'Rejected', value: medicalAidAnalytics?.rejected || 0 },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#4ade80" />
                                <Cell fill="#facc15" />
                                <Cell fill="#f87171" />
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Claims by Provider</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">PSMAS</span>
                              <span className="text-sm font-medium">42%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">CIMAS</span>
                              <span className="text-sm font-medium">28%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">First Mutual</span>
                              <span className="text-sm font-medium">15%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Other Providers</span>
                              <span className="text-sm font-medium">15%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-gray-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Link href="/pharmacy-portal/analytics/medical-aid">
                    <Button variant="outline" size="sm">View Detailed Medical Aid Report</Button>
                  </Link>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Market Watch */}
      <Card>
        <CardHeader>
          <CardTitle>Market Watch</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fastMoving">
            <TabsList className="mb-4">
              <TabsTrigger value="fastMoving">Fast Moving</TabsTrigger>
              <TabsTrigger value="highDemand">High Demand</TabsTrigger>
              <TabsTrigger value="stockOut">Stock Out Alerts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fastMoving">
              <div className="space-y-4">
                {marketWatchData.fastMoving.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.trend}</p>
                      <p className="text-xs text-gray-400">Source: {item.source}</p>
                    </div>
                    <Link href={`/pharmacy-portal/inventory?search=${encodeURIComponent(item.name)}`}>
                      <Button variant="outline" size="sm">Check Stock</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="highDemand">
              <div className="space-y-4">
                {marketWatchData.highDemand.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">Reason: {item.reason}</p>
                      <p className="text-xs text-gray-400">Source: {item.source}</p>
                    </div>
                    <Link href={`/pharmacy-portal/inventory?search=${encodeURIComponent(item.name)}`}>
                      <Button variant="outline" size="sm">Check Stock</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="stockOut">
              <div className="space-y-4">
                {marketWatchData.stockOut.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-4">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">Reason: {item.reason}</p>
                      <p className="text-xs text-gray-400">Distributor: {item.distributor}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/pharmacy-portal/orders/new?item=${encodeURIComponent(item.name)}`}>
                        <Button variant="outline" size="sm">Order</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyDashboard;
