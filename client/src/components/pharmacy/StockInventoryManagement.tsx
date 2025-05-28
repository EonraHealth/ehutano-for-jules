import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, AlertTriangle, TrendingUp, TrendingDown, Calendar, Search, Plus, Edit, History } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  stockQuantity: number;
  minimumStock: number;
  maximumStock: number;
  costPrice: number;
  sellingPrice: number;
  supplierId: number;
  supplierName: string;
  status: string;
  location: string;
  lastUpdated: string;
}

interface StockMovement {
  id: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  movementType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  timestamp: string;
  referenceNumber: string;
}

export default function StockInventoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inventory data
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/v1/pharmacy/inventory/detailed"],
    enabled: true,
  });

  // Fetch stock movements for audit trail
  const { data: stockMovements, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/v1/pharmacy/inventory/movements"],
    enabled: true,
  });

  // Fetch low stock alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/v1/pharmacy/inventory/alerts"],
    enabled: true,
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/v1/pharmacy/inventory/adjust", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/inventory/detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/inventory/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/inventory/alerts"] });
      toast({
        title: "Stock Adjusted",
        description: "Inventory has been updated successfully",
      });
      setIsAdjustDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to adjust stock",
        variant: "destructive",
      });
    },
  });

  // Add new stock mutation
  const addStockMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/v1/pharmacy/inventory/add", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/inventory/detailed"] });
      toast({
        title: "Stock Added",
        description: "New inventory item added successfully",
      });
      setIsAddDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
      });
    },
  });

  const filteredInventory = inventory?.filter((item: InventoryItem) => {
    const matchesSearch = item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           (selectedCategory === "low-stock" && item.stockQuantity <= item.minimumStock) ||
                           (selectedCategory === "expiring" && new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    return matchesSearch && matchesCategory;
  }) || [];

  const getStockStatus = (item: InventoryItem) => {
    if (item.stockQuantity <= item.minimumStock) return "low";
    if (item.stockQuantity >= item.maximumStock) return "overstock";
    return "normal";
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) return "expiring";
    if (daysUntilExpiry <= 90) return "warning";
    return "normal";
  };

  const handleStockAdjustment = (data: any) => {
    adjustStockMutation.mutate({
      ...data,
      itemId: selectedItem?.id,
    });
  };

  if (inventoryLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{alerts?.lowStock || 0}</strong> items below minimum stock
          </AlertDescription>
        </Alert>
        <Alert className="border-yellow-200 bg-yellow-50">
          <Calendar className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>{alerts?.expiring || 0}</strong> items expiring in 30 days
          </AlertDescription>
        </Alert>
        <Alert className="border-orange-200 bg-orange-50">
          <TrendingUp className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{alerts?.overstock || 0}</strong> items overstocked
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Inventory Management</CardTitle>
                  <CardDescription>
                    Manage your pharmacy stock with real-time tracking
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stock
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Stock</DialogTitle>
                      <DialogDescription>Add new inventory items to your pharmacy</DialogDescription>
                    </DialogHeader>
                    {/* Add stock form would go here */}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search medicines or batch numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Inventory Table */}
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Medicine</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Batch</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Stock</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Expiry</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInventory.map((item: InventoryItem) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{item.medicineName}</div>
                              <div className="text-sm text-gray-500">{item.supplierName}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.batchNumber}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div className="font-medium">{item.stockQuantity} units</div>
                              <div className="text-gray-500">Min: {item.minimumStock}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{new Date(item.expiryDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <Badge variant={getStockStatus(item) === "low" ? "destructive" : 
                                           getStockStatus(item) === "overstock" ? "secondary" : "default"}>
                                {getStockStatus(item) === "low" ? "Low Stock" :
                                 getStockStatus(item) === "overstock" ? "Overstock" : "Normal"}
                              </Badge>
                              {getExpiryStatus(item.expiryDate) === "expiring" && (
                                <Badge variant="destructive">Expiring</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Dialog open={isAdjustDialogOpen && selectedItem?.id === item.id} 
                                   onOpenChange={(open) => {
                                     setIsAdjustDialogOpen(open);
                                     if (open) setSelectedItem(item);
                                   }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-1" />
                                  Adjust
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Adjust Stock</DialogTitle>
                                  <DialogDescription>
                                    Adjust stock levels for {item.medicineName}
                                  </DialogDescription>
                                </DialogHeader>
                                {/* Stock adjustment form would go here */}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>
                Complete audit trail of all inventory changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Medicine</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Reason</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stockMovements?.map((movement: StockMovement) => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(movement.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{movement.medicineName}</div>
                              <div className="text-sm text-gray-500">{movement.batchNumber}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={movement.movementType === "IN" ? "default" : 
                                          movement.movementType === "OUT" ? "secondary" : "outline"}>
                              {movement.movementType === "IN" ? (
                                <><TrendingUp className="h-3 w-3 mr-1" /> Stock In</>
                              ) : movement.movementType === "OUT" ? (
                                <><TrendingDown className="h-3 w-3 mr-1" /> Stock Out</>
                              ) : (
                                <><Edit className="h-3 w-3 mr-1" /> Adjustment</>
                              )}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={movement.movementType === "OUT" ? "text-red-600" : "text-green-600"}>
                              {movement.movementType === "OUT" ? "-" : "+"}{movement.quantity}
                            </span>
                            <div className="text-gray-500 text-xs">
                              {movement.previousStock} → {movement.newStock}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{movement.reason}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{movement.performedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory?.length || 0}</div>
                <p className="text-xs text-gray-500">Active inventory items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,230</div>
                <p className="text-xs text-gray-500">Current stock value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{alerts?.lowStock || 0}</div>
                <p className="text-xs text-gray-500">Require restocking</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{alerts?.expiring || 0}</div>
                <p className="text-xs text-gray-500">Within 30 days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}