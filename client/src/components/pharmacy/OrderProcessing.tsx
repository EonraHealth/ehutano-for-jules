import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle, 
  ClipboardList,
  Package,
  Truck,
  CheckCircle,
  ArrowRight,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  MoreHorizontal,
  RefreshCw,
  FileText,
  PenLine
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';

type OrderItem = {
  id: number;
  orderId: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type Order = {
  id: number;
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  total: number;
  deliveryAddress: string;
  deliveryMethod: 'PICKUP' | 'DELIVERY';
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  notes: string;
  items: OrderItem[];
};

const OrderProcessing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [statusNotes, setStatusNotes] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Fetch orders
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['/api/v1/pharmacy/orders'],
    staleTime: 30000, // 30 seconds
    queryFn: async () => {
      // In a real implementation, this would be a fetch call to the API
      // For now, we'll return mock data
      const { mockOrders } = await import('@/lib/mockData');
      // Cast the status string to OrderStatus to satisfy TypeScript
      return mockOrders.map(order => ({
        ...order,
        status: order.status as OrderStatus,
        deliveryMethod: order.deliveryMethod as 'PICKUP' | 'DELIVERY',
        paymentStatus: order.paymentStatus as 'PAID' | 'PENDING' | 'FAILED'
      }));
    }
  });

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: (data: { orderId: number; status: OrderStatus; notes: string }) => {
      return apiRequest(`/api/v1/pharmacy/orders/${data.orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: data.status, notes: data.notes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/orders'] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
        variant: "default",
      });
      setIsUpdateStatusDialogOpen(false);
      setStatusNotes('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(getNextStatus(order.status));
    setIsUpdateStatusDialogOpen(true);
  };

  const handleStatusUpdateSubmit = () => {
    if (selectedOrder) {
      updateStatusMutation.mutate({
        orderId: selectedOrder.id,
        status: newStatus,
        notes: statusNotes
      });
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    switch (currentStatus) {
      case 'PENDING':
        return 'PROCESSING';
      case 'PROCESSING':
        return 'READY';
      case 'READY':
        return 'COMPLETED';
      default:
        return currentStatus;
    }
  };

  const getNextActionText = (status: OrderStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Process Order';
      case 'PROCESSING':
        return 'Mark Ready';
      case 'READY':
        return 'Complete Order';
      case 'COMPLETED':
        return 'View Details';
      case 'CANCELLED':
        return 'View Details';
      default:
        return 'Update Status';
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>;
      case 'PROCESSING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Processing</Badge>;
      case 'READY':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ready</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDeliveryMethodBadge = (method: string) => {
    switch (method) {
      case 'PICKUP':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Pickup</Badge>;
      case 'DELIVERY':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Delivery</Badge>;
      default:
        return <Badge>{method}</Badge>;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <ClipboardList className="h-4 w-4" />;
      case 'PROCESSING':
        return <Package className="h-4 w-4" />;
      case 'READY':
        return <CheckCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <Truck className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Filter orders based on search term, status, and date range
  const filteredOrders = orders
    ? orders.filter((order: Order) => {
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.patientEmail.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        
        const orderDate = new Date(order.orderDate);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;
        
        const matchesDateRange = 
          (!fromDate || orderDate >= fromDate) && 
          (!toDate || orderDate <= toDate);
        
        return matchesSearch && matchesStatus && matchesDateRange;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-48">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Error loading orders. Please try again.</span>
      </div>
    );
  }

  // Group orders by status for statistics
  const orderCounts = {
    PENDING: orders ? orders.filter((order: Order) => order.status === 'PENDING').length : 0,
    PROCESSING: orders ? orders.filter((order: Order) => order.status === 'PROCESSING').length : 0,
    READY: orders ? orders.filter((order: Order) => order.status === 'READY').length : 0,
    COMPLETED: orders ? orders.filter((order: Order) => order.status === 'COMPLETED').length : 0,
    CANCELLED: orders ? orders.filter((order: Order) => order.status === 'CANCELLED').length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <h3 className="text-2xl font-bold">{orderCounts.PENDING}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Processing</p>
                <h3 className="text-2xl font-bold">{orderCounts.PROCESSING}</h3>
              </div>
              <div className="p-2 bg-yellow-50 rounded-full">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Ready</p>
                <h3 className="text-2xl font-bold">{orderCounts.READY}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <h3 className="text-2xl font-bold">{orderCounts.COMPLETED}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-full">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <h3 className="text-2xl font-bold">{orderCounts.CANCELLED}</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs and Filters */}
      <Tabs defaultValue="all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="ready">Ready for Pickup/Delivery</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <FileText className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by order number, patient name or email..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="w-44">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as OrderStatus | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-40"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
              <span>to</span>
              <Input
                type="date"
                className="w-40"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>
        </div>

        <TabsContent value="all">
          <OrdersTable 
            orders={filteredOrders}
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
            getStatusBadge={getStatusBadge}
            getNextActionText={getNextActionText}
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <OrdersTable 
            orders={filteredOrders.filter((order: Order) => order.status === 'PENDING')}
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
            getStatusBadge={getStatusBadge}
            getNextActionText={getNextActionText}
          />
        </TabsContent>
        
        <TabsContent value="processing">
          <OrdersTable 
            orders={filteredOrders.filter((order: Order) => order.status === 'PROCESSING')}
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
            getStatusBadge={getStatusBadge}
            getNextActionText={getNextActionText}
          />
        </TabsContent>
        
        <TabsContent value="ready">
          <OrdersTable 
            orders={filteredOrders.filter((order: Order) => order.status === 'READY')}
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
            getStatusBadge={getStatusBadge}
            getNextActionText={getNextActionText}
          />
        </TabsContent>
        
        <TabsContent value="completed">
          <OrdersTable 
            orders={filteredOrders.filter((order: Order) => order.status === 'COMPLETED')}
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
            getStatusBadge={getStatusBadge}
            getNextActionText={getNextActionText}
          />
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.orderNumber} - {formatDate(selectedOrder?.orderDate || '')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Order Information</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Date: {formatDate(selectedOrder.orderDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Status: {getStatusBadge(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Method: {getDeliveryMethodBadge(selectedOrder.deliveryMethod)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PenLine className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Payment: {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    setNewStatus(getNextStatus(selectedOrder.status));
                    setIsUpdateStatusDialogOpen(true);
                  }}
                  disabled={selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'CANCELLED'}
                  className="gap-1"
                >
                  {getNextActionText(selectedOrder.status)}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">Customer Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{selectedOrder.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedOrder.patientPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedOrder.patientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">Order Items</h3>
                <div className="rounded-md border mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.medicineName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(selectedOrder.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-lg">Notes</h3>
                  <p className="text-sm mt-2 p-3 bg-gray-50 rounded-md">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="READY">Ready for Pickup/Delivery</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Status Update Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdateSubmit}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for the orders table
interface OrdersTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (order: Order) => void;
  getStatusBadge: (status: OrderStatus) => React.ReactNode;
  getNextActionText: (status: OrderStatus) => string;
}

const OrdersTable = ({ 
  orders, 
  onViewDetails, 
  onUpdateStatus, 
  getStatusBadge,
  getNextActionText
}: OrdersTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Orders ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>
                      {order.patientName}
                      <div className="text-xs text-gray-500">{order.patientEmail}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.deliveryMethod === 'PICKUP' ? 'Pickup' : 'Delivery'}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(order)}
                        >
                          Details
                        </Button>
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            onClick={() => onUpdateStatus(order)}
                          >
                            {getNextActionText(order.status)}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderProcessing;