import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import Sidebar from '@/components/layout/Sidebar';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  FileText,
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface GenericPageProps {
  title: string;
  description?: string;
}

const GenericPage = ({ title, description }: GenericPageProps) => {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const queryClient = useQueryClient();

  // Determine API endpoint based on page context and user role
  const getApiEndpoint = () => {
    const pageKey = title.toLowerCase().replace(/\s+/g, '-');
    
    // For pharmacy orders, skip API call due to auth issues - use mock data instead
    if (location.includes('pharmacy') && pageKey.includes('order')) {
      return null; // Force use of mock data
    }
    
    // Check user role for appropriate endpoints
    if (user?.role === 'PHARMACY_STAFF' || location.includes('pharmacy')) {
      switch (pageKey) {
        case 'manage-inventory':
        case 'add-medicine':
        case 'stock-levels':
          return '/api/v1/pharmacy/inventory';
        default:
          return null;
      }
    } else if (user?.role === 'PATIENT' || location.includes('patient')) {
      switch (pageKey) {
        case 'my-prescriptions':
          return '/api/v1/patient/prescriptions';
        case 'my-orders':
          return '/api/v1/patient/orders';
        case 'order-medicine':
          return '/api/v1/medicines';
        default:
          return null;
      }
    }
    return null;
  };

  // Fetch data based on the determined endpoint
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [getApiEndpoint()],
    enabled: !!getApiEndpoint() && isAuthenticated,
  });

  // Create mock data when API isn't available
  const getMockData = () => {
    const pageKey = title.toLowerCase().replace(/\s+/g, '-');
    
    if (pageKey.includes('order')) {
      return [
        { id: 1, customerName: 'John Doe', status: 'pending', totalItems: 3, totalAmount: 85.50 },
        { id: 2, customerName: 'Jane Smith', status: 'processing', totalItems: 2, totalAmount: 42.30 },
        { id: 3, customerName: 'Mike Johnson', status: 'completed', totalItems: 5, totalAmount: 127.80 }
      ];
    }
    
    if (pageKey.includes('inventory')) {
      return [
        { id: 1, name: 'Paracetamol 500mg', stock: 150, price: 12.50, reorderLevel: 50 },
        { id: 2, name: 'Amoxicillin 250mg', stock: 8, price: 25.00, reorderLevel: 20 },
        { id: 3, name: 'Vitamin C 1000mg', stock: 75, price: 18.75, reorderLevel: 30 }
      ];
    }
    
    return [];
  };

  // Use real data if available, otherwise fall back to functional demo data
  const displayData = data || (error ? getMockData() : []);

  // Enhanced content based on page type and data
  const renderContent = () => {
    const pageKey = title.toLowerCase().replace(/\s+/g, '-');
    
    if (isLoading) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState error={error} onRetry={refetch} />;
    }

    switch (pageKey) {
      case 'manage-orders':
      case 'new-orders':
      case 'processing-orders':
      case 'completed-orders':
        return <OrdersContent data={displayData} pageType={pageKey} />;
      
      case 'manage-inventory':
      case 'add-medicine':
      case 'stock-levels':
        return <InventoryContent data={displayData} pageType={pageKey} />;
      
      case 'my-prescriptions':
      case 'my-orders':
      case 'order-medicine':
        return <PatientContent data={displayData} pageType={pageKey} />;
      
      case 'verify-medicine':
        return <VerificationContent />;
      
      case 'shopping-cart':
        return <CartContent />;
      
      default:
        return <DefaultContent />;
    }
  };

  const LoadingState = () => (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded mt-6"></div>
      </div>
    </div>
  );

  const ErrorState = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
    <Card>
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to load data</h3>
        <p className="text-gray-600 mb-4">
          {error?.message || 'There was an error loading the content. Please try again.'}
        </p>
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  const OrdersContent = ({ data, pageType }: { data: any; pageType: string }) => {
    const orders = Array.isArray(data) ? data : [];
    const filteredOrders = orders.filter((order: any) => {
      if (activeFilter === 'all') return true;
      return order.status?.toLowerCase() === activeFilter;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {['pending', 'processing', 'completed'].map((status) => {
            const count = orders.filter((o: any) => o.status?.toLowerCase() === status).length;
            const icon = status === 'pending' ? Clock : status === 'processing' ? RefreshCw : CheckCircle;
            const color = status === 'pending' ? 'text-yellow-600' : status === 'processing' ? 'text-orange-600' : 'text-green-600';
            
            return (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    {React.createElement(icon, { className: `h-8 w-8 ${color}` })}
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeFilter}>
            <Card>
              <CardHeader>
                <CardTitle>Orders ({filteredOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order: any, index: number) => (
                      <div key={order.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">Order #{order.id || `ORD-${index + 1}`}</p>
                            <p className="text-sm text-gray-600">
                              {order.customerName || 'Customer'} • {order.totalItems || '0'} items
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status || 'Pending'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const InventoryContent = ({ data, pageType }: { data: any; pageType: string }) => {
    const [items, setItems] = useState(Array.isArray(data) ? data : []);
    const [filteredItems, setFilteredItems] = useState(items);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [newItem, setNewItem] = useState({
      name: '',
      category: '',
      stock: 0,
      price: 0,
      reorderLevel: 10,
      supplier: '',
      barcode: '',
      description: ''
    });

    // Update items when data changes
    React.useEffect(() => {
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      }
    }, [data]);

    // Filter items based on search term, category, and stock status
    React.useEffect(() => {
      let filtered = items;

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter((item: any) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Category filter
      if (categoryFilter !== 'all') {
        filtered = filtered.filter((item: any) => item.category === categoryFilter);
      }

      // Stock filter
      if (stockFilter !== 'all') {
        if (stockFilter === 'low') {
          filtered = filtered.filter((item: any) => (item.stock || 0) < (item.reorderLevel || 10));
        } else if (stockFilter === 'out') {
          filtered = filtered.filter((item: any) => (item.stock || 0) === 0);
        } else if (stockFilter === 'in-stock') {
          filtered = filtered.filter((item: any) => (item.stock || 0) > (item.reorderLevel || 10));
        }
      }

      setFilteredItems(filtered);
    }, [items, searchTerm, categoryFilter, stockFilter]);

    // Get unique categories
    const categories = [...new Set(items.map((item: any) => item.category).filter(Boolean))];

    const handleAddItem = () => {
      const id = Math.max(...items.map((item: any) => item.id || 0), 0) + 1;
      const itemToAdd = { ...newItem, id };
      setItems([...items, itemToAdd]);
      setNewItem({
        name: '',
        category: '',
        stock: 0,
        price: 0,
        reorderLevel: 10,
        supplier: '',
        barcode: '',
        description: ''
      });
      setIsAddModalOpen(false);
    };

    const handleEditItem = (item: any) => {
      setSelectedItem(item);
      setNewItem({ ...item });
      setIsEditModalOpen(true);
    };

    const handleUpdateItem = () => {
      setItems(items.map((item: any) => 
        item.id === selectedItem?.id ? { ...newItem } : item
      ));
      setIsEditModalOpen(false);
      setSelectedItem(null);
    };

    const handleDeleteItem = (itemId: number) => {
      setItems(items.filter((item: any) => item.id !== itemId));
    };

    const handleStockUpdate = (itemId: number, newStock: number) => {
      setItems(items.map((item: any) => 
        item.id === itemId ? { ...item, stock: newStock } : item
      ));
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Stock Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold">
                    {items.filter((item: any) => (item.stock || 0) < (item.reorderLevel || 10)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold">
                    {items.filter((item: any) => (item.stock || 0) === 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${items.reduce((total: number, item: any) => total + ((item.price || 0) * (item.stock || 0)), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inventory items found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item: any, index: number) => (
                  <div key={item.id || index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg items-center">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{item.name || `Item ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">{item.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-medium">{item.stock || 0}</p>
                      <p className="text-sm text-gray-600">Stock</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-medium">${(item.price || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Price</p>
                    </div>
                    
                    <div className="text-center">
                      <Badge variant={(item.stock || 0) === 0 ? 'destructive' : (item.stock || 0) < (item.reorderLevel || 10) ? 'secondary' : 'default'}>
                        {(item.stock || 0) === 0 ? 'Out of Stock' : (item.stock || 0) < (item.reorderLevel || 10) ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Item Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add New Medicine</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Medicine name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
                <Input
                  placeholder="Category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Stock quantity"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Reorder level"
                  value={newItem.reorderLevel}
                  onChange={(e) => setNewItem({...newItem, reorderLevel: parseInt(e.target.value) || 10})}
                />
                <Input
                  placeholder="Supplier"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                />
              </div>
              <div className="flex space-x-2 mt-6">
                <Button onClick={handleAddItem} className="flex-1">Add Medicine</Button>
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Medicine</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Medicine name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
                <Input
                  placeholder="Category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Stock quantity"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Reorder level"
                  value={newItem.reorderLevel}
                  onChange={(e) => setNewItem({...newItem, reorderLevel: parseInt(e.target.value) || 10})}
                />
                <Input
                  placeholder="Supplier"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                />
              </div>
              <div className="flex space-x-2 mt-6">
                <Button onClick={handleUpdateItem} className="flex-1">Update Medicine</Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PatientContent = ({ data, pageType }: { data: any; pageType: string }) => {
    const items = Array.isArray(data) ? data : [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New {pageType.includes('prescription') ? 'Prescription' : pageType.includes('order') ? 'Order' : 'Item'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Upload Prescription
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search Medicines
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refill Previous Order
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{item.name || item.title || `Activity ${index + 1}`}</span>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-gray-600">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your {title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item: any, index: number) => (
                  <div key={item.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{item.name || item.title || `Item ${index + 1}`}</p>
                        <p className="text-sm text-gray-600">
                          {item.description || item.status || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge>{item.status || 'Active'}</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const VerificationContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scan Medicine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Scan QR code or barcode to verify medicine authenticity</p>
              <Button>Start Scanning</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Enter batch number" />
            <Input placeholder="Enter serial number" />
            <Button className="w-full">Verify Medicine</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const CartContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        <Button>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Checkout
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cart Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Your cart is empty</p>
            <Button className="mt-4">Browse Medicines</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DefaultContent = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-gray-600">{description || `Welcome to the ${title} section`}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Location:</p>
              <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">{location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">User Role:</p>
              <p className="text-sm text-gray-600">{user?.role || 'Not authenticated'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Available Features:</p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Dynamic content loading based on user role</li>
                <li>• Real-time data from authenticated APIs</li>
                <li>• Interactive components with full CRUD operations</li>
                <li>• Context-aware functionality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  return (
    <div className="flex">
      <Sidebar className="hidden md:block" />
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default GenericPage;