import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Smartphone, DollarSign, Receipt, FileText, Users, Calendar, TrendingUp, Search, Plus, Minus, Trash2, Printer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Sale {
  id: number;
  receiptNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  insuranceClaim?: InsuranceClaim;
  timestamp: string;
  cashier: string;
}

interface SaleItem {
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  batchNumber: string;
}

interface InsuranceClaim {
  providerId: number;
  providerName: string;
  membershipNumber: string;
  authorizedAmount: number;
  patientResponsibility: number;
  claimStatus: string;
}

interface CustomerCategory {
  id: string;
  name: string;
  discountPercentage: number;
  description: string;
}

export default function BillingFinancialIntegration() {
  const [activeTab, setActiveTab] = useState("pos");
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [currentSale, setCurrentSale] = useState<any>({
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    customerName: "",
    customerPhone: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sales data
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/v1/pharmacy/sales"],
    enabled: true,
  });

  // Fetch customer categories for pricing
  const { data: customerCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/v1/pharmacy/customer-categories"],
    enabled: true,
  });

  // Fetch financial analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/v1/pharmacy/financial-analytics"],
    enabled: true,
  });

  // Fetch medicines for product selection - always fetch when component loads
  const { data: medicines, isLoading: medicinesLoading } = useQuery({
    queryKey: ["/api/v1/medicines"],
    enabled: true, // Always fetch medicines
  });

  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/v1/pharmacy/sales/process", data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/financial-analytics"] });
      setLastReceipt(response.sale);
      setShowReceiptDialog(true);
      toast({
        title: "Sale Processed",
        description: `Receipt #${response.receiptNumber} generated successfully`,
      });
      setIsNewSaleDialogOpen(false);
      setCurrentSale({ 
        items: [], 
        subtotal: 0, 
        discount: 0, 
        tax: 0, 
        total: 0,
        customerName: "",
        customerPhone: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process sale",
        variant: "destructive",
      });
    },
  });

  // Process insurance claim mutation
  const processClaimMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/v1/pharmacy/insurance-claims/process", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/sales"] });
      toast({
        title: "Insurance Claim Processed",
        description: "Claim submitted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process insurance claim",
        variant: "destructive",
      });
    },
  });

  const paymentMethods = [
    { id: "cash", name: "Cash Payment", icon: DollarSign, color: "bg-green-50 border-green-200 hover:bg-green-100" },
    { id: "card", name: "Card Payment", icon: CreditCard, color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { id: "mobile_money", name: "EcoCash/OneMoney", icon: Smartphone, color: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
    { id: "insurance", name: "Medical Aid", icon: FileText, color: "bg-purple-50 border-purple-200 hover:bg-purple-100" },
  ];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const calculateSaleTotal = () => {
    const subtotal = currentSale.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const discountAmount = (subtotal * currentSale.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * 15) / 100; // 15% VAT
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total: taxableAmount + taxAmount
    };
  };

  const addItemToSale = (medicine: any) => {
    const existingIndex = currentSale.items.findIndex((item: any) => item.medicineId === medicine.id);
    
    if (existingIndex >= 0) {
      updateItemQuantity(existingIndex, currentSale.items[existingIndex].quantity + 1);
    } else {
      const newItem = {
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: 1,
        unitPrice: medicine.price,
        discount: 0,
        total: medicine.price,
        batchNumber: medicine.batchNumber || "AUTO"
      };
      
      setCurrentSale(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromSale(index);
      return;
    }
    
    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.map((item: any, i: number) => 
        i === index ? { ...item, quantity, total: item.unitPrice * quantity } : item
      )
    }));
  };

  const removeItemFromSale = (index: number) => {
    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }));
  };

  const filteredMedicines = Array.isArray(medicines) ? medicines.filter((medicine: any) =>
    medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.activeIngredient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleProcessSale = () => {
    if (currentSale.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the sale",
        variant: "destructive",
      });
      return;
    }

    const totals = calculateSaleTotal();
    const saleData = {
      items: currentSale.items,
      customerName: currentSale.customerName,
      customerPhone: currentSale.customerPhone,
      paymentMethod: selectedPaymentMethod,
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      tax: totals.taxAmount,
      total: totals.total
    };

    processSaleMutation.mutate(saleData);
  };

  const printReceipt = () => {
    if (!lastReceipt) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${lastReceipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Ehutano Pharmacy</h2>
            <p>Receipt #${lastReceipt.receiptNumber}</p>
            <p>${new Date(lastReceipt.timestamp).toLocaleString()}</p>
          </div>
          ${lastReceipt.customerName ? `<p><strong>Customer:</strong> ${lastReceipt.customerName}</p>` : ''}
          ${lastReceipt.customerPhone ? `<p><strong>Phone:</strong> ${lastReceipt.customerPhone}</p>` : ''}
          <div class="items">
            ${lastReceipt.items.map((item: any) => `
              <div class="item">
                <span>${item.medicineName} x${item.quantity}</span>
                <span>$${item.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item"><span>Subtotal:</span><span>$${lastReceipt.subtotal.toFixed(2)}</span></div>
            <div class="item"><span>Tax (15%):</span><span>$${lastReceipt.tax.toFixed(2)}</span></div>
            <div class="item"><span><strong>Total:</strong></span><span><strong>$${lastReceipt.total.toFixed(2)}</strong></span></div>
          </div>
          <p style="text-align: center; margin-top: 20px;">Thank you for your business!</p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (salesLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pos">POS System</TabsTrigger>
          <TabsTrigger value="sales">Sales History</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Models</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Sale */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Point of Sale</CardTitle>
                  <CardDescription>Process customer transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Customer Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                        <Input id="customer-name" placeholder="Enter customer name" />
                      </div>
                      <div>
                        <Label htmlFor="customer-phone">Phone Number</Label>
                        <Input id="customer-phone" placeholder="Enter phone number" />
                      </div>
                    </div>

                    {/* Medicine Search and Add */}
                    <div>
                      <Label htmlFor="medicine-search">Add Medicine</Label>
                      <div className="flex gap-2">
                        <Select>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Search medicine by name or scan barcode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Amoxicillin 500mg - $3.75</SelectItem>
                            <SelectItem value="2">Paracetamol 500mg - $1.20</SelectItem>
                            <SelectItem value="3">Vitamin D3 1000IU - $2.50</SelectItem>
                            <SelectItem value="4">Ibuprofen 400mg - $2.80</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          type="number" 
                          placeholder="Qty" 
                          className="w-20"
                          min="1"
                          defaultValue="1"
                        />
                        <Button onClick={() => {
                          setCurrentSale(prev => ({
                            ...prev,
                            items: [...prev.items, {
                              id: Date.now(),
                              medicineName: "Amoxicillin 500mg",
                              quantity: 1,
                              unitPrice: 3.75,
                              total: 3.75
                            }]
                          }));
                          toast({
                            title: "Item Added",
                            description: "Medicine added to sale"
                          });
                        }}>
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {/* Sale Items */}
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-gray-50">
                        <h3 className="font-medium">Sale Items</h3>
                      </div>
                      <div className="p-4 space-y-2">
                        {currentSale.items.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No items added to sale</p>
                        ) : (
                          currentSale.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 border rounded">
                              <div>
                                <div className="font-medium">{item.medicineName}</div>
                                <div className="text-sm text-gray-500">Qty: {item.quantity} × ${item.unitPrice}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${item.total.toFixed(2)}</div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600"
                                  onClick={() => {
                                    setCurrentSale(prev => ({
                                      ...prev,
                                      items: prev.items.filter((_, i) => i !== index)
                                    }));
                                    toast({
                                      title: "Item Removed",
                                      description: "Medicine removed from sale"
                                    });
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment and Checkout */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Payment & Checkout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sale Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateSaleTotal().subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${calculateSaleTotal().discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (15%):</span>
                        <span>${calculateSaleTotal().taxAmount.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${calculateSaleTotal().total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Customer Category */}
                    <div>
                      <Label>Customer Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {customerCategories?.map((category: CustomerCategory) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({category.discountPercentage}% discount)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {paymentMethods.map((method) => (
                          <Button
                            key={method.id}
                            variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className="flex items-center gap-2"
                          >
                            <method.icon className="h-4 w-4" />
                            {method.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Insurance Details */}
                    {selectedPaymentMethod === "insurance" && (
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="insurance-provider">Insurance Provider</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="discovery">Discovery Health</SelectItem>
                              <SelectItem value="momentum">Momentum Health</SelectItem>
                              <SelectItem value="medscheme">Medscheme</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="membership-number">Membership Number</Label>
                          <Input id="membership-number" placeholder="Enter membership number" />
                        </div>
                      </div>
                    )}

                    {/* Process Sale */}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => processSaleMutation.mutate(currentSale)}
                      disabled={currentSale.items.length === 0 || processSaleMutation.isPending}
                    >
                      {processSaleMutation.isPending ? "Processing..." : "Process Sale"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>View and manage all pharmacy transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Receipt #</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Items</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Payment</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sales?.map((sale: Sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-blue-600">{sale.receiptNumber}</td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{sale.customerName || "Walk-in Customer"}</div>
                              {sale.customerPhone && (
                                <div className="text-sm text-gray-500">{sale.customerPhone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{sale.items.length} items</td>
                          <td className="px-4 py-3 font-medium">${sale.total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {sale.paymentMethod === "cash" && <DollarSign className="h-4 w-4" />}
                              {sale.paymentMethod === "card" && <CreditCard className="h-4 w-4" />}
                              {sale.paymentMethod === "mobile_money" && <Smartphone className="h-4 w-4" />}
                              {sale.paymentMethod === "insurance" && <FileText className="h-4 w-4" />}
                              <span className="capitalize">{sale.paymentMethod.replace("_", " ")}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getPaymentStatusColor(sale.paymentStatus)}>
                              {sale.paymentStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(sale.timestamp).toLocaleDateString()}
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

        <TabsContent value="pricing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Categories</CardTitle>
                <CardDescription>Manage customer pricing tiers and discounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerCategories?.map((category: CustomerCategory) => (
                    <div key={category.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                      <Badge variant="secondary">{category.discountPercentage}% Discount</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dynamic Pricing Rules</CardTitle>
                <CardDescription>Configure automatic pricing adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Bulk Purchase Discount</div>
                    <div className="text-sm text-gray-500">5% off for orders over $100</div>
                    <Badge variant="default" className="mt-2">Active</Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Senior Citizen Discount</div>
                    <div className="text-sm text-gray-500">10% off for customers 65+</div>
                    <Badge variant="default" className="mt-2">Active</Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium">Loyalty Program</div>
                    <div className="text-sm text-gray-500">Points-based rewards system</div>
                    <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Daily Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics?.dailySales?.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-green-600">+12% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics?.monthlyRevenue?.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-green-600">+8% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Insurance Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.insuranceClaims || 0}</div>
                  <p className="text-xs text-blue-600">Pending processing</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg. Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics?.avgTransaction?.toFixed(2) || "0.00"}</div>
                  <p className="text-xs text-gray-500">Per sale</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
                <CardDescription>Transaction breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-medium">Cash</div>
                    <div className="text-2xl font-bold">45%</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium">Card</div>
                    <div className="text-2xl font-bold">30%</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-2xl font-bold">15%</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <div className="font-medium">Insurance</div>
                    <div className="text-2xl font-bold">10%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}