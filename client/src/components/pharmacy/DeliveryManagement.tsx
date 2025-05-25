import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Truck, Calendar, Clock, User, Phone, Package, Navigation, CheckCircle, Circle, AlertCircle, AlertTriangle, Check, X, List, Grid, Search } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import { apiRequest } from '@/lib/queryClient';
import { formatDate, formatTime } from '@/lib/utils';
import { mockDeliveries, mockDeliveryPartners } from '@/lib/mockData';

const DeliveryStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'DELIVERED':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
    case 'IN_TRANSIT':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">In Transit</Badge>;
    case 'PENDING':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Pending</Badge>;
    case 'ASSIGNED':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Assigned</Badge>;
    case 'PICKED_UP':
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">Picked Up</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const DeliveryTypeChip = ({ type }: { type: string }) => {
  switch (type) {
    case 'EXPRESS':
      return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">Express</Badge>;
    case 'STANDARD':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Standard</Badge>;
    case 'SAME_DAY':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Same Day</Badge>;
    case 'SCHEDULED':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Scheduled</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

const DeliveryProgressTracker = ({ status }: { status: string }) => {
  const getProgress = () => {
    switch (status) {
      case 'PENDING':
        return 10;
      case 'ASSIGNED':
        return 30;
      case 'PICKED_UP':
        return 50;
      case 'IN_TRANSIT':
        return 70;
      case 'DELIVERED':
        return 100;
      case 'FAILED':
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="w-full space-y-2">
      <Progress value={getProgress()} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Pending</span>
        <span>Assigned</span>
        <span>Picked Up</span>
        <span>In Transit</span>
        <span>Delivered</span>
      </div>
    </div>
  );
};

const DeliveryCard = ({ delivery }: { delivery: any }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const formattedDate = delivery.scheduledDate ? formatDate(new Date(delivery.scheduledDate)) : 'Not scheduled';
  const estimatedTime = delivery.estimatedDeliveryTime ? formatTime(delivery.estimatedDeliveryTime) : 'Unknown';
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Truck className="h-5 w-5 mr-2 text-primary" />
              Order #{delivery.orderNumber}
            </CardTitle>
            <CardDescription>
              Tracking: {delivery.trackingNumber || 'Not assigned'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <DeliveryStatusBadge status={delivery.status} />
            <span className="text-xs text-muted-foreground mt-1">
              {formattedDate} • {delivery.scheduledTimeSlot || 'Any time'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <DeliveryProgressTracker status={delivery.status} />
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Delivery Address</p>
              <p className="text-muted-foreground">{delivery.deliveryAddress}</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Recipient</p>
              <p className="text-muted-foreground">{delivery.recipientName}</p>
              <p className="text-muted-foreground">{delivery.recipientPhone}</p>
            </div>
          </div>
        </div>
        
        {showDetails && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-start space-x-2">
                <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Delivery Service</p>
                  <div className="flex items-center">
                    <p className="text-muted-foreground">{delivery.partnerName}</p>
                    <DeliveryTypeChip type={delivery.deliveryType} />
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Estimated Delivery</p>
                  <p className="text-muted-foreground">{estimatedTime}</p>
                </div>
              </div>
            </div>
            
            {delivery.driverName && (
              <div className="mt-4 flex items-start space-x-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Driver Information</p>
                  <p className="text-muted-foreground">{delivery.driverName} • {delivery.driverPhone}</p>
                </div>
              </div>
            )}
            
            {delivery.lastLocationUpdate && (
              <div className="mt-4 flex items-start space-x-2">
                <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Last Location Update</p>
                  <p className="text-muted-foreground">{formatDate(new Date(delivery.lastLocationUpdate))} {formatTime(delivery.lastLocationUpdate)}</p>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex items-start space-x-2">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Delivery Details</p>
                <p className="text-muted-foreground">Distance: {delivery.distance} km • Fee: ${delivery.deliveryFee.toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        <div className="flex space-x-2">
          {delivery.status === 'PENDING' && (
            <Button size="sm" variant="outline">Assign Driver</Button>
          )}
          {delivery.status === 'ASSIGNED' && (
            <Button size="sm" variant="outline">Contact Driver</Button>
          )}
          {['PENDING', 'ASSIGNED'].includes(delivery.status) && (
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">Cancel</Button>
          )}
          {delivery.status === 'DELIVERED' && (
            <Button size="sm" variant="outline">View Proof</Button>
          )}
          <Button size="sm" variant="default">Update Status</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const DeliveryPartnerCard = ({ partner }: { partner: any }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3 flex flex-row items-start space-x-4">
        <Avatar className="h-14 w-14 border">
          <AvatarImage src={partner.logoUrl} alt={partner.name} />
          <AvatarFallback>{partner.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{partner.name}</CardTitle>
          <CardDescription>
            {partner.isActive ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactive</Badge>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{partner.contactEmail}</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{partner.contactPhone}</span>
          </div>
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <span className="block">Service Areas:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {partner.supportedAreas.map((area: string) => (
                  <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">Avg. Delivery Time: {partner.averageDeliveryTime / 60} hours</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">Rate: ${partner.costPerKm}/km (min $${partner.minimumFee})</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex space-x-2 w-full">
          <Button variant="outline" className="flex-1">Edit</Button>
          {partner.isActive ? (
            <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">Deactivate</Button>
          ) : (
            <Button variant="outline" className="flex-1 text-green-600 hover:text-green-700">Activate</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const AnalyticsCard = ({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: any }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

// Mock API functions for delivery management
const fetchDeliveries = async () => {
  // In a real implementation, this would make an API call
  // return await apiRequest('/api/v1/pharmacy/deliveries');
  return mockDeliveries;
};

const fetchDeliveryPartners = async () => {
  // In a real implementation, this would make an API call
  // return await apiRequest('/api/v1/pharmacy/delivery-partners');
  return mockDeliveryPartners;
};

const updateDeliveryStatus = async ({ deliveryId, status }: { deliveryId: number; status: string }) => {
  // In a real implementation, this would make an API call
  // return await apiRequest('/api/v1/pharmacy/deliveries/' + deliveryId + '/status', {
  //   method: 'PUT',
  //   body: JSON.stringify({ status })
  // });
  
  // For now, we'll just simulate a successful update
  return { success: true, message: `Delivery #${deliveryId} status updated to ${status}` };
};

const assignDelivery = async ({ deliveryId, partnerId, driverId }: { deliveryId: number; partnerId: number; driverId?: number }) => {
  // In a real implementation, this would make an API call
  // return await apiRequest('/api/v1/pharmacy/deliveries/' + deliveryId + '/assign', {
  //   method: 'POST',
  //   body: JSON.stringify({ partnerId, driverId })
  // });
  
  // For now, we'll just simulate a successful assignment
  return { success: true, message: `Delivery #${deliveryId} assigned to partner #${partnerId}` };
};

// Main component
const DeliveryManagement = () => {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const deliveriesQuery = useQuery({
    queryKey: ['/api/v1/pharmacy/deliveries'],
    queryFn: fetchDeliveries
  });
  
  const partnersQuery = useQuery({
    queryKey: ['/api/v1/pharmacy/delivery-partners'],
    queryFn: fetchDeliveryPartners
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: updateDeliveryStatus,
    onSuccess: (data) => {
      toast({
        title: 'Status Updated',
        description: data.message,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/deliveries'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update delivery status. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const assignDeliveryMutation = useMutation({
    mutationFn: assignDelivery,
    onSuccess: (data) => {
      toast({
        title: 'Delivery Assigned',
        description: data.message,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/deliveries'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to assign delivery. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const filteredDeliveries = React.useMemo(() => {
    if (!deliveriesQuery.data) return [];
    
    let filtered = [...deliveriesQuery.data];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(delivery => 
        delivery.orderNumber.toLowerCase().includes(query) ||
        delivery.trackingNumber?.toLowerCase().includes(query) ||
        delivery.recipientName.toLowerCase().includes(query) ||
        delivery.deliveryAddress.toLowerCase().includes(query) ||
        delivery.partnerName.toLowerCase().includes(query)
      );
    }
    
    // Apply tab filter
    if (activeTab === 'ongoing') {
      filtered = filtered.filter(delivery => 
        ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status)
      );
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(delivery => delivery.status === 'DELIVERED');
    } else if (activeTab === 'issues') {
      filtered = filtered.filter(delivery => 
        ['FAILED', 'CANCELLED'].includes(delivery.status)
      );
    }
    
    return filtered;
  }, [deliveriesQuery.data, searchQuery, activeTab]);
  
  const deliveryStats = React.useMemo(() => {
    if (!deliveriesQuery.data) {
      return {
        total: 0,
        ongoing: 0,
        completed: 0,
        issues: 0,
        avgDeliveryTime: 0,
      };
    }
    
    const total = deliveriesQuery.data.length;
    const ongoing = deliveriesQuery.data.filter(d => 
      ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
    ).length;
    const completed = deliveriesQuery.data.filter(d => d.status === 'DELIVERED').length;
    const issues = deliveriesQuery.data.filter(d => 
      ['FAILED', 'CANCELLED'].includes(d.status)
    ).length;
    
    // Calculate average delivery time for completed deliveries (in hours)
    const completedDeliveries = deliveriesQuery.data.filter(d => 
      d.status === 'DELIVERED' && d.actualPickupTime && d.actualDeliveryTime
    );
    
    let avgDeliveryTime = 0;
    if (completedDeliveries.length > 0) {
      const totalTime = completedDeliveries.reduce((sum, d) => {
        const pickupTime = new Date(d.actualPickupTime).getTime();
        const deliveryTime = new Date(d.actualDeliveryTime).getTime();
        return sum + (deliveryTime - pickupTime) / (1000 * 60 * 60); // Convert to hours
      }, 0);
      avgDeliveryTime = totalTime / completedDeliveries.length;
    }
    
    return {
      total,
      ongoing,
      completed,
      issues,
      avgDeliveryTime: avgDeliveryTime.toFixed(1),
    };
  }, [deliveriesQuery.data]);
  
  if (deliveriesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading delivery information...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Delivery Management</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Delivery
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard 
          title="Total Deliveries" 
          value={deliveryStats.total.toString()} 
          subtitle="All time" 
          icon={Package} 
        />
        <AnalyticsCard 
          title="Ongoing Deliveries" 
          value={deliveryStats.ongoing.toString()} 
          subtitle="In progress" 
          icon={Truck} 
        />
        <AnalyticsCard 
          title="Completed Deliveries" 
          value={deliveryStats.completed.toString()} 
          subtitle="Successfully delivered" 
          icon={CheckCircle} 
        />
        <AnalyticsCard 
          title="Avg. Delivery Time" 
          value={`${deliveryStats.avgDeliveryTime}h`} 
          subtitle="From pickup to delivery" 
          icon={Clock} 
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="ongoing" className="relative">
              Ongoing
              {deliveryStats.ongoing > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground">{deliveryStats.ongoing}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
            </TabsTrigger>
            <TabsTrigger value="issues" className="relative">
              Issues
              {deliveryStats.issues > 0 && (
                <Badge variant="destructive" className="ml-2">{deliveryStats.issues}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="partners">
              Delivery Partners
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search deliveries..."
                className="w-[250px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setViewMode('cards')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="px-2"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <TabsContent value="ongoing" className="mt-0">
          {filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-60">
                <Truck className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                <p className="text-lg font-medium">No ongoing deliveries found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All deliveries have been completed or there are no deliveries yet.
                </p>
                <Button className="mt-4">Create New Delivery</Button>
              </CardContent>
            </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeliveries.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveries.map(delivery => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.orderNumber}</TableCell>
                        <TableCell>{delivery.trackingNumber || '—'}</TableCell>
                        <TableCell><DeliveryStatusBadge status={delivery.status} /></TableCell>
                        <TableCell>{delivery.recipientName}</TableCell>
                        <TableCell>{formatDate(new Date(delivery.scheduledDate))}</TableCell>
                        <TableCell>{delivery.partnerName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-60">
                <CheckCircle className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                <p className="text-lg font-medium">No completed deliveries found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Completed deliveries will appear here.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeliveries.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Delivered At</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveries.map(delivery => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.orderNumber}</TableCell>
                        <TableCell>{delivery.trackingNumber}</TableCell>
                        <TableCell>{delivery.actualDeliveryTime ? formatDate(new Date(delivery.actualDeliveryTime)) : '—'}</TableCell>
                        <TableCell>{delivery.recipientName}</TableCell>
                        <TableCell>{delivery.partnerName}</TableCell>
                        <TableCell>
                          {delivery.signature && (
                            <Button variant="outline" size="sm">View Proof</Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="issues" className="mt-0">
          {filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-60">
                <AlertCircle className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                <p className="text-lg font-medium">No delivery issues found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All deliveries are proceeding normally.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeliveries.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeliveries.map(delivery => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.orderNumber}</TableCell>
                        <TableCell><DeliveryStatusBadge status={delivery.status} /></TableCell>
                        <TableCell>{delivery.statusNotes || 'No details available'}</TableCell>
                        <TableCell>{delivery.recipientName}</TableCell>
                        <TableCell>{delivery.partnerName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Resolve</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="partners" className="mt-0">
          {partnersQuery.isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : partnersQuery.data?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-60">
                <Truck className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
                <p className="text-lg font-medium">No delivery partners found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add delivery partners to manage medication deliveries.
                </p>
                <Button className="mt-4">Add Delivery Partner</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partnersQuery.data?.map(partner => (
                <DeliveryPartnerCard key={partner.id} partner={partner} />
              ))}
              
              <Card className="flex flex-col items-center justify-center h-64 border-dashed">
                <Plus className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-lg font-medium">Add New Partner</p>
                <p className="text-sm text-muted-foreground text-center mt-1 mb-4 max-w-xs">
                  Partner with more delivery services to expand your reach.
                </p>
                <Button>Add Delivery Partner</Button>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Missing import icons
import { Mail, Loader2, Plus, DollarSign } from 'lucide-react';

export default DeliveryManagement;