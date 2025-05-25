import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type InventoryItem = {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  status: string;
  location: string;
  manufacturer: string;
  category: string;
};

const InventoryManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('medicineName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    medicineName: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    reorderLevel: 10,
    unitPrice: 0,
    status: 'IN_STOCK',
    location: 'Main Shelf',
    manufacturer: '',
    category: 'General'
  });

  // Fetch inventory data
  const { data: inventory, isLoading, isError } = useQuery({
    queryKey: ['/api/v1/pharmacy/inventory'],
    staleTime: 60000, // 1 minute
    queryFn: async () => {
      // In a real implementation, this would be a fetch call to the API
      // For now, we'll return mock data
      const { mockInventoryItems } = await import('@/lib/mockData');
      // Ensure all items have proper status formatting
      return mockInventoryItems.map(item => ({
        ...item,
        status: item.status || 'IN_STOCK'
      }));
    }
  });

  // Update inventory item
  const updateMutation = useMutation({
    mutationFn: (data: Partial<InventoryItem>) => {
      return apiRequest(`/api/v1/pharmacy/inventory/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/inventory'] });
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
        variant: "default",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update inventory item. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Add inventory item
  const addMutation = useMutation({
    mutationFn: (data: Partial<InventoryItem>) => {
      return apiRequest('/api/v1/pharmacy/inventory', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/inventory'] });
      toast({
        title: "Success",
        description: "Inventory item added successfully",
        variant: "default",
      });
      setIsAddDialogOpen(false);
      setFormData({
        medicineName: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 0,
        reorderLevel: 10,
        unitPrice: 0,
        status: 'IN_STOCK',
        location: 'Main Shelf',
        manufacturer: '',
        category: 'General'
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add inventory item. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete inventory item
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/v1/pharmacy/inventory/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/inventory'] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['quantity', 'reorderLevel', 'unitPrice'];
    
    if (numericFields.includes(name)) {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDeleteSubmit = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem.id);
    }
  };

  // Filter and sort the inventory items
  const filteredInventory = inventory
    ? inventory.filter((item: InventoryItem) => {
        const matchesSearch = item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
        const matchesStatus = statusFilter ? item.status === statusFilter : true;
        
        return matchesSearch && matchesCategory && matchesStatus;
      }).sort((a: InventoryItem, b: InventoryItem) => {
        if (sortBy === 'medicineName') {
          return sortOrder === 'asc' 
            ? a.medicineName.localeCompare(b.medicineName)
            : b.medicineName.localeCompare(a.medicineName);
        } else if (sortBy === 'quantity') {
          return sortOrder === 'asc' 
            ? a.quantity - b.quantity
            : b.quantity - a.quantity;
        } else if (sortBy === 'expiryDate') {
          return sortOrder === 'asc' 
            ? new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
            : new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
        } else if (sortBy === 'unitPrice') {
          return sortOrder === 'asc' 
            ? a.unitPrice - b.unitPrice
            : b.unitPrice - a.unitPrice;
        }
        return 0;
      })
    : [];

  // Extract unique categories and statuses for filtering
  const categories = inventory
    ? [...new Set(inventory.map((item: InventoryItem) => item.category))]
    : [];
  
  const statuses = inventory
    ? [...new Set(inventory.map((item: InventoryItem) => item.status))]
    : [];

  // Get items that need reordering
  const lowStockItems = inventory
    ? inventory.filter((item: InventoryItem) => item.quantity <= item.reorderLevel)
    : [];

  // Get items that are about to expire (within 30 days)
  const nearExpiryItems = inventory
    ? inventory.filter((item: InventoryItem) => {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading inventory data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-48">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Error loading inventory data. Please try again.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all-inventory">
        <TabsList className="mb-4">
          <TabsTrigger value="all-inventory">All Inventory</TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-2">{lowStockItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiring-soon">
            Expiring Soon
            {nearExpiryItems.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">{nearExpiryItems.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Inventory Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search medicines, batch numbers, manufacturers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="w-40">
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category: string) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="w-40">
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map((status: string) => (
                  <option key={status} value={status}>
                    {status === 'IN_STOCK' ? 'In Stock' : 
                     status === 'LOW_STOCK' ? 'Low Stock' : 
                     status === 'OUT_OF_STOCK' ? 'Out of Stock' : 
                     status === 'EXPIRED' ? 'Expired' : status}
                  </option>
                ))}
              </select>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new medicine inventory item.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="medicineName">Medicine Name</Label>
                        <Input
                          id="medicineName"
                          name="medicineName"
                          value={formData.medicineName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input
                          id="manufacturer"
                          name="manufacturer"
                          value={formData.manufacturer}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="batchNumber">Batch Number</Label>
                        <Input
                          id="batchNumber"
                          name="batchNumber"
                          value={formData.batchNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          name="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="0"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reorderLevel">Reorder Level</Label>
                        <Input
                          id="reorderLevel"
                          name="reorderLevel"
                          type="number"
                          min="0"
                          value={formData.reorderLevel}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">Unit Price ($)</Label>
                        <Input
                          id="unitPrice"
                          name="unitPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.unitPrice}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          name="category"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          required
                        >
                          <option value="General">General</option>
                          <option value="Antibiotics">Antibiotics</option>
                          <option value="Painkillers">Painkillers</option>
                          <option value="Chronic">Chronic</option>
                          <option value="Supplements">Supplements</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          name="status"
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          required
                        >
                          <option value="IN_STOCK">In Stock</option>
                          <option value="LOW_STOCK">Low Stock</option>
                          <option value="OUT_OF_STOCK">Out of Stock</option>
                          <option value="EXPIRED">Expired</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Storage Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addMutation.isPending}>
                      {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Item
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="all-inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px] cursor-pointer" onClick={() => handleSort('medicineName')}>
                        Medicine Name
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Batch No.</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('quantity')}>
                        Quantity
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('expiryDate')}>
                        Expiry Date
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('unitPrice')}>
                        Unit Price
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length > 0 ? (
                      filteredInventory.map((item: InventoryItem) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.medicineName}
                            <div className="text-xs text-gray-500">{item.manufacturer}</div>
                          </TableCell>
                          <TableCell>{item.batchNumber}</TableCell>
                          <TableCell>
                            {item.quantity}
                            {item.quantity <= item.reorderLevel && (
                              <Badge variant="destructive" className="ml-2">Low</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(item.expiryDate).toLocaleDateString()}
                            {(() => {
                              const expiryDate = new Date(item.expiryDate);
                              const today = new Date();
                              const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (daysUntilExpiry <= 0) {
                                return <Badge variant="destructive" className="ml-2">Expired</Badge>;
                              } else if (daysUntilExpiry <= 30) {
                                return <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">Soon</Badge>;
                              }
                              return null;
                            })()}
                          </TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>
                            {item.status === 'IN_STOCK' && <Badge>In Stock</Badge>}
                            {item.status === 'LOW_STOCK' && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Low Stock</Badge>}
                            {item.status === 'OUT_OF_STOCK' && <Badge variant="destructive">Out of Stock</Badge>}
                            {item.status === 'EXPIRED' && <Badge variant="destructive">Expired</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleEditClick(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="icon"
                                onClick={() => handleDeleteClick(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No inventory items found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items ({lowStockItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Medicine Name</TableHead>
                      <TableHead>Batch No.</TableHead>
                      <TableHead>Current Quantity</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((item: InventoryItem) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.medicineName}
                            <div className="text-xs text-gray-500">{item.manufacturer}</div>
                          </TableCell>
                          <TableCell>{item.batchNumber}</TableCell>
                          <TableCell>
                            {item.quantity}
                            <Badge variant="destructive" className="ml-2">Low</Badge>
                          </TableCell>
                          <TableCell>{item.reorderLevel}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditClick(item)}
                            >
                              Restock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No low stock items found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring-soon">
          <Card>
            <CardHeader>
              <CardTitle>Items Expiring Soon ({nearExpiryItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Medicine Name</TableHead>
                      <TableHead>Batch No.</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nearExpiryItems.length > 0 ? (
                      nearExpiryItems.map((item: InventoryItem) => {
                        const expiryDate = new Date(item.expiryDate);
                        const today = new Date();
                        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.medicineName}
                              <div className="text-xs text-gray-500">{item.manufacturer}</div>
                            </TableCell>
                            <TableCell>{item.batchNumber}</TableCell>
                            <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {daysUntilExpiry} days
                              {daysUntilExpiry <= 7 && <Badge variant="destructive" className="ml-2">Critical</Badge>}
                              {daysUntilExpiry > 7 && daysUntilExpiry <= 30 && <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">Warning</Badge>}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditClick(item)}
                              >
                                Mark Expired
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No items expiring soon.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the details of this inventory item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medicineName">Medicine Name</Label>
                  <Input
                    id="medicineName"
                    name="medicineName"
                    value={formData.medicineName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input
                    id="reorderLevel"
                    name="reorderLevel"
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="General">General</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Painkillers">Painkillers</option>
                    <option value="Chronic">Chronic</option>
                    <option value="Supplements">Supplements</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    required
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this inventory item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedItem && (
              <div className="space-y-2">
                <p><strong>Medicine:</strong> {selectedItem.medicineName}</p>
                <p><strong>Batch Number:</strong> {selectedItem.batchNumber}</p>
                <p><strong>Quantity:</strong> {selectedItem.quantity}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteSubmit}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;