import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Phone, 
  User, 
  Package,
  AlertTriangle,
  CheckCircle,
  Navigation,
  DollarSign,
  Calendar,
  Map
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DeliveryOrder {
  id: number;
  orderId: number;
  patientName: string;
  patientPhone: string;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryService: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  deliveryFee: number;
  deliveryNotes?: string;
  driverName?: string;
  driverPhone?: string;
  trackingNumber?: string;
  items: {
    medicineName: string;
    quantity: number;
    specialHandling?: string;
  }[];
  createdAt: string;
}

interface DeliveryProvider {
  id: string;
  name: string;
  type: 'MOTORCYCLE' | 'CAR' | 'BICYCLE';
  coverage: string[];
  baseFee: number;
  perKmRate: number;
  estimatedTime: string;
  contactNumber: string;
  isActive: boolean;
}

const DeliveryManagement = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    patientName: '',
    patientPhone: '',
    deliveryAddress: '',
    deliveryArea: '',
    deliveryService: '',
    urgency: 'STANDARD',
    specialInstructions: '',
    preferredTime: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch delivery orders
  const { data: deliveryOrders, isLoading } = useQuery({
    queryKey: ['/api/v1/pharmacy/delivery/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/pharmacy/delivery/orders');
      return response.json();
    },
  });

  // Fetch delivery providers
  const { data: deliveryProviders } = useQuery({
    queryKey: ['/api/v1/pharmacy/delivery/providers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/pharmacy/delivery/providers');
      return response.json();
    },
  });

  // Schedule delivery mutation
  const scheduleDeliveryMutation = useMutation({
    mutationFn: async (deliveryData: any) => {
      const response = await apiRequest('POST', '/api/v1/pharmacy/delivery/schedule', deliveryData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Delivery Scheduled',
        description: 'Delivery has been successfully scheduled',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/delivery/orders'] });
      setDeliveryForm({
        patientName: '',
        patientPhone: '',
        deliveryAddress: '',
        deliveryArea: '',
        deliveryService: '',
        urgency: 'STANDARD',
        specialInstructions: '',
        preferredTime: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Scheduling Failed',
        description: error.message || 'Failed to schedule delivery',
        variant: 'destructive',
      });
    },
  });

  // Update delivery status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: { deliveryId: number; status: string; notes?: string }) => {
      const response = await apiRequest('PUT', `/api/v1/pharmacy/delivery/${data.deliveryId}/status`, {
        status: data.status,
        notes: data.notes
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Status Updated',
        description: 'Delivery status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/delivery/orders'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP': return 'bg-purple-100 text-purple-800';
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDeliveryFee = (area: string, service: string) => {
    const provider = deliveryProviders?.find((p: DeliveryProvider) => p.id === service);
    if (!provider) return 0;
    
    // Simple distance-based calculation (in a real app, this would use maps API)
    const distanceMap: Record<string, number> = {
      'HARARE_CBD': 5,
      'AVONDALE': 8,
      'BORROWDALE': 12,
      'GLEN_VIEW': 15,
      'CHITUNGWIZA': 25,
      'NORTON': 35
    };
    
    const distance = distanceMap[area] || 10;
    return provider.baseFee + (distance * provider.perKmRate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delivery Management</h2>
          <p className="text-muted-foreground">
            Manage medication deliveries and track delivery status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Truck className="h-4 w-4 mr-2" />
            {deliveryOrders?.filter((order: DeliveryOrder) => 
              ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status)
            ).length || 0} Active Deliveries
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule Delivery
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Track Orders
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Delivery Services
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Schedule Delivery Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Schedule New Delivery
              </CardTitle>
              <CardDescription>
                Arrange medication delivery for patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Patient Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="patient-name">Patient Name</Label>
                      <Input
                        id="patient-name"
                        value={deliveryForm.patientName}
                        onChange={(e) => setDeliveryForm(prev => ({ ...prev, patientName: e.target.value }))}
                        placeholder="Enter patient name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient-phone">Phone Number</Label>
                      <Input
                        id="patient-phone"
                        value={deliveryForm.patientPhone}
                        onChange={(e) => setDeliveryForm(prev => ({ ...prev, patientPhone: e.target.value }))}
                        placeholder="+263 77 123 4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery-address">Delivery Address</Label>
                      <Textarea
                        id="delivery-address"
                        value={deliveryForm.deliveryAddress}
                        onChange={(e) => setDeliveryForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                        placeholder="Complete delivery address with landmarks"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Delivery Details</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="delivery-area">Delivery Area</Label>
                      <Select 
                        value={deliveryForm.deliveryArea} 
                        onValueChange={(value) => setDeliveryForm(prev => ({ ...prev, deliveryArea: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HARARE_CBD">Harare CBD</SelectItem>
                          <SelectItem value="AVONDALE">Avondale</SelectItem>
                          <SelectItem value="BORROWDALE">Borrowdale</SelectItem>
                          <SelectItem value="GLEN_VIEW">Glen View</SelectItem>
                          <SelectItem value="CHITUNGWIZA">Chitungwiza</SelectItem>
                          <SelectItem value="NORTON">Norton</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="delivery-service">Delivery Service</Label>
                      <Select 
                        value={deliveryForm.deliveryService} 
                        onValueChange={(value) => setDeliveryForm(prev => ({ ...prev, deliveryService: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select delivery service" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryProviders?.map((provider: DeliveryProvider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name} - {provider.type} (${provider.baseFee} base)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Delivery Urgency</Label>
                      <Select 
                        value={deliveryForm.urgency} 
                        onValueChange={(value) => setDeliveryForm(prev => ({ ...prev, urgency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STANDARD">Standard (2-4 hours)</SelectItem>
                          <SelectItem value="EXPRESS">Express (1-2 hours)</SelectItem>
                          <SelectItem value="URGENT">Urgent (30-60 minutes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="preferred-time">Preferred Delivery Time</Label>
                      <Input
                        id="preferred-time"
                        type="datetime-local"
                        value={deliveryForm.preferredTime}
                        onChange={(e) => setDeliveryForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <Label htmlFor="special-instructions">Special Instructions</Label>
                <Textarea
                  id="special-instructions"
                  value={deliveryForm.specialInstructions}
                  onChange={(e) => setDeliveryForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Cold storage required, fragile items, access instructions, etc."
                  rows={2}
                />
              </div>

              {/* Delivery Cost Estimation */}
              {deliveryForm.deliveryArea && deliveryForm.deliveryService && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Estimated delivery fee: <strong>
                      ${calculateDeliveryFee(deliveryForm.deliveryArea, deliveryForm.deliveryService).toFixed(2)}
                    </strong>
                    {deliveryForm.urgency === 'EXPRESS' && ' + $2.00 express fee'}
                    {deliveryForm.urgency === 'URGENT' && ' + $5.00 urgent fee'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Schedule Button */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => scheduleDeliveryMutation.mutate(deliveryForm)}
                  disabled={!deliveryForm.patientName || !deliveryForm.patientPhone || !deliveryForm.deliveryAddress || scheduleDeliveryMutation.isPending}
                  className="flex-1"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {scheduleDeliveryMutation.isPending ? 'Scheduling...' : 'Schedule Delivery'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Track Orders Tab */}
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Delivery Tracking
              </CardTitle>
              <CardDescription>
                Monitor and update delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveryOrders?.map((order: DeliveryOrder) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{order.patientName}</div>
                            <div className="text-sm text-gray-600">
                              Order #{order.orderId} • {order.deliveryArea}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Delivery Address</div>
                          <div>{order.deliveryAddress}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Estimated Time</div>
                          <div>{new Date(order.estimatedDeliveryTime).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Delivery Fee</div>
                          <div>${order.deliveryFee.toFixed(2)}</div>
                        </div>
                      </div>

                      {order.driverName && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{order.driverName}</span>
                            <Phone className="h-4 w-4 ml-2" />
                            <span>{order.driverPhone}</span>
                          </div>
                          {order.trackingNumber && (
                            <div className="text-xs text-gray-600 mt-1">
                              Tracking: {order.trackingNumber}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        {order.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateStatusMutation.mutate({ deliveryId: order.id, status: 'ASSIGNED' })}
                          >
                            Assign Driver
                          </Button>
                        )}
                        {order.status === 'ASSIGNED' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateStatusMutation.mutate({ deliveryId: order.id, status: 'PICKED_UP' })}
                          >
                            Mark Picked Up
                          </Button>
                        )}
                        {order.status === 'PICKED_UP' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateStatusMutation.mutate({ deliveryId: order.id, status: 'IN_TRANSIT' })}
                          >
                            In Transit
                          </Button>
                        )}
                        {order.status === 'IN_TRANSIT' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateStatusMutation.mutate({ deliveryId: order.id, status: 'DELIVERED' })}
                          >
                            Mark Delivered
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <MapPin className="h-4 w-4 mr-2" />
                          Track Location
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {deliveryOrders?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No delivery orders found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Providers Tab */}
        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Service Providers
              </CardTitle>
              <CardDescription>
                Manage registered delivery service providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deliveryProviders?.map((provider: DeliveryProvider) => (
                  <div key={provider.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">{provider.name}</div>
                      <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span>{provider.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Fee:</span>
                        <span>${provider.baseFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Per KM:</span>
                        <span>${provider.perKmRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Time:</span>
                        <span>{provider.estimatedTime}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Coverage:</span>
                        <div className="mt-1">
                          {provider.coverage.map((area) => (
                            <Badge key={area} variant="outline" className="mr-1 mb-1 text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                      <Phone className="h-3 w-3" />
                      {provider.contactNumber}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                    <p className="text-2xl font-bold">{deliveryOrders?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Delivered Today</p>
                    <p className="text-2xl font-bold">
                      {deliveryOrders?.filter((order: DeliveryOrder) => 
                        order.status === 'DELIVERED' && 
                        new Date(order.createdAt).toDateString() === new Date().toDateString()
                      ).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Truck className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Transit</p>
                    <p className="text-2xl font-bold">
                      {deliveryOrders?.filter((order: DeliveryOrder) => 
                        ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status)
                      ).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                    <p className="text-2xl font-bold">
                      ${deliveryOrders?.filter((order: DeliveryOrder) => 
                        new Date(order.createdAt).toDateString() === new Date().toDateString()
                      ).reduce((sum: number, order: DeliveryOrder) => sum + order.deliveryFee, 0).toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryManagement;