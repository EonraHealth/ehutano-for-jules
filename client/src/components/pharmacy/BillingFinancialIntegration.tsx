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
import { CreditCard, Smartphone, DollarSign, Receipt, FileText, Users, Calendar, TrendingUp, Search, Plus, Minus, Trash2, Printer, Settings, Download, History } from "lucide-react";
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
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showSettings, setShowSettings] = useState(false);
  const [showSalesReports, setShowSalesReports] = useState(false);
  const [showReceiptHistory, setShowReceiptHistory] = useState(false);
  
  // Currency and receipt settings
  const [settings, setSettings] = useState({
    currencies: {
      USD: { rate: 1, symbol: "$" },
      ZWG: { rate: 25000, symbol: "ZWG" }
    },
    receipt: {
      size: "standard", // standard, small, large
      pharmacyName: "Ehutano Pharmacy",
      address: "123 Health Street, Harare, Zimbabwe",
      phone: "+263 4 123 4567",
      email: "info@ehutano.com",
      license: "PL-2024-001"
    }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Currency conversion helpers
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = settings.currencies[fromCurrency as keyof typeof settings.currencies]?.rate || 1;
    const toRate = settings.currencies[toCurrency as keyof typeof settings.currencies]?.rate || 1;
    return (amount / fromRate) * toRate;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyInfo = settings.currencies[currency as keyof typeof settings.currencies];
    const symbol = currencyInfo?.symbol || currency;
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPaymentCurrency = (paymentMethod: string) => {
    // Card payments and mobile money use USD conversion
    if (paymentMethod === 'card' || paymentMethod === 'ecocash' || paymentMethod === 'onemoney') {
      return 'USD';
    }
    return selectedCurrency;
  };

  // Print receipt function
  const printReceiptData = (receiptData: any) => {
    if (!receiptData) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptData.receiptNumber}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              max-width: 350px; 
              margin: 0 auto; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .customer-info {
              background: #f5f5f5;
              padding: 8px;
              margin: 10px 0;
              border-radius: 4px;
            }
            .item { 
              display: flex; 
              justify-content: space-between; 
              margin: 8px 0; 
              padding: 4px 0;
              border-bottom: 1px dotted #ccc;
            }
            .item-details {
              font-size: 10px;
              color: #666;
              margin-left: 10px;
            }
            .totals { 
              border-top: 2px solid #000; 
              margin-top: 15px; 
              padding-top: 10px; 
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .final-total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 1px solid #ccc;
              padding-top: 15px;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">EHUTANO PHARMACY</h2>
            <p style="margin: 5px 0;">Complete Healthcare Solutions</p>
            <p style="margin: 5px 0;">Receipt #${receiptData.receiptNumber}</p>
            <p style="margin: 5px 0; font-size: 10px;">${new Date(receiptData.timestamp).toLocaleString()}</p>
          </div>
          
          ${(receiptData.customerName || receiptData.customerPhone) ? `
            <div class="customer-info">
              <strong>Customer Information:</strong><br>
              ${receiptData.customerName ? `Name: ${receiptData.customerName}<br>` : ''}
              ${receiptData.customerPhone ? `Phone: ${receiptData.customerPhone}` : ''}
            </div>
          ` : ''}
          
          <div style="margin: 15px 0;">
            <strong>Items Purchased:</strong>
          </div>
          
          ${receiptData.items?.map((item: any) => `
            <div class="item">
              <div style="flex: 1;">
                <div>${item.medicineName}</div>
                <div class="item-details">
                  $${item.unitPrice.toFixed(2)} × ${item.quantity}
                  ${item.batchNumber ? ` (Batch: ${item.batchNumber})` : ''}
                </div>
              </div>
              <div style="font-weight: bold;">$${item.total.toFixed(2)}</div>
            </div>
          `).join('')}
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>$${receiptData.subtotal?.toFixed(2)}</span>
            </div>
            ${receiptData.discount > 0 ? `
              <div class="total-line" style="color: red;">
                <span>Discount:</span>
                <span>-$${receiptData.discount?.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-line">
              <span>Tax (15% VAT):</span>
              <span>$${receiptData.tax?.toFixed(2)}</span>
            </div>
            <div class="total-line final-total">
              <span>TOTAL:</span>
              <span>$${receiptData.total?.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Thank you for choosing Ehutano Pharmacy!</strong></p>
            <p>Payment Method: ${receiptData.paymentMethod?.toUpperCase()}</p>
            <p>Served by: ${receiptData.cashier}</p>
            <p style="margin-top: 10px; font-size: 10px;">
              For queries, please contact us with this receipt number
            </p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Auto-print after content loads
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

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
      console.log("Sale processed successfully:", response);
      console.log("Response sale data:", response.sale);
      console.log("Response keys:", Object.keys(response));
      
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/pharmacy/financial-analytics"] });
      
      // Set receipt data and show dialog
      if (response && response.sale) {
        setLastReceipt(response.sale);
        setShowReceiptDialog(true);
      } else {
        console.error("No sale data in response:", response);
        toast({
          title: "Warning",
          description: "Sale processed but receipt data missing",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Sale Processed",
        description: `Receipt #${response.receiptNumber} generated successfully`,
      });
      
      // Reset form
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
    onError: (error) => {
      console.error("Sale processing error:", error);
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
    printReceiptData(lastReceipt);
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
      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        <Button 
          variant="outline" 
          onClick={() => setShowReceiptHistory(true)}
          className="flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          Receipt History
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowSalesReports(true)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Sales Reports
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          POS Settings
        </Button>
      </div>

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
                    {/* Customer Information & Currency Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer-name">Customer Name (Optional)</Label>
                        <Input 
                          id="customer-name" 
                          placeholder="Enter customer name"
                          value={currentSale.customerName}
                          onChange={(e) => setCurrentSale(prev => ({...prev, customerName: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-phone">Phone Number</Label>
                        <Input 
                          id="customer-phone" 
                          placeholder="Enter phone number"
                          value={currentSale.customerPhone}
                          onChange={(e) => setCurrentSale(prev => ({...prev, customerPhone: e.target.value}))}
                        />
                      </div>
                    </div>

                    {/* Currency Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sale Currency</Label>
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(settings.currencies).map(([code, info]) => (
                              <SelectItem key={code} value={code}>
                                {code} ({info.symbol}) - Rate: {info.rate}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowSettings(true)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </div>

                    {/* Medicine Search and Add - Using Zimbabwe Database */}
                    <div>
                      <Label htmlFor="medicine-search">Add Medicine</Label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search Zimbabwe medicines by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => setIsNewSaleDialogOpen(true)}
                            variant="outline"
                          >
                            Browse All
                          </Button>
                        </div>
                        
                        {/* Quick Medicine Results */}
                        {searchTerm && (
                          <div className="border rounded-lg max-h-32 overflow-y-auto">
                            {medicinesLoading ? (
                              <div className="p-3 text-center text-sm text-gray-500">Loading...</div>
                            ) : filteredMedicines.length === 0 ? (
                              <div className="p-3 text-center text-sm text-gray-500">No medicines found</div>
                            ) : (
                              filteredMedicines.slice(0, 5).map((medicine: any) => (
                                <div
                                  key={medicine.id}
                                  className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    addItemToSale(medicine);
                                    setSearchTerm("");
                                    toast({
                                      title: "Medicine Added",
                                      description: `${medicine.name} added to sale`
                                    });
                                  }}
                                >
                                  <div className="font-medium text-sm">{medicine.name}</div>
                                  <div className="text-xs text-gray-600">${medicine.price} - {medicine.category}</div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
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
                    {/* Sale Summary with Currency Display */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculateSaleTotal().subtotal, selectedCurrency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{formatCurrency(calculateSaleTotal().discountAmount, selectedCurrency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (15%):</span>
                        <span>{formatCurrency(calculateSaleTotal().taxAmount, selectedCurrency)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateSaleTotal().total, selectedCurrency)}</span>
                      </div>
                      {selectedCurrency !== "USD" && (
                        <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                          <div className="flex justify-between">
                            <span>USD Equivalent:</span>
                            <span>{formatCurrency(convertCurrency(calculateSaleTotal().total, selectedCurrency, "USD"), "USD")}</span>
                          </div>
                        </div>
                      )}
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
                      onClick={handleProcessSale}
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

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Completed - Receipt Preview</DialogTitle>
            <DialogDescription>Your sale has been processed successfully</DialogDescription>
          </DialogHeader>
          {lastReceipt && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-800">
                  Receipt #{lastReceipt.receiptNumber}
                </div>
                <div className="text-sm text-green-600">
                  Total: ${lastReceipt.total?.toFixed(2)}
                </div>
              </div>

              {/* Receipt Preview */}
              <div className="border-2 rounded-lg p-6 bg-white shadow-inner">
                <div className="text-center border-b-2 pb-4 mb-4">
                  <h3 className="font-bold text-xl">Ehutano Pharmacy</h3>
                  <p className="text-sm text-gray-600">Complete Healthcare Solutions</p>
                  <p className="text-sm mt-2">Receipt #{lastReceipt.receiptNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(lastReceipt.timestamp).toLocaleString()}</p>
                </div>
                
                {(lastReceipt.customerName || lastReceipt.customerPhone) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold text-sm mb-1">Customer Information</h4>
                    {lastReceipt.customerName && <p className="text-sm"><strong>Name:</strong> {lastReceipt.customerName}</p>}
                    {lastReceipt.customerPhone && <p className="text-sm"><strong>Phone:</strong> {lastReceipt.customerPhone}</p>}
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2 border-b pb-1">Items Purchased</h4>
                  <div className="space-y-2">
                    {lastReceipt.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <div className="font-medium">{item.medicineName}</div>
                          <div className="text-xs text-gray-500">
                            ${item.unitPrice.toFixed(2)} × {item.quantity} {item.batchNumber && `(Batch: ${item.batchNumber})`}
                          </div>
                        </div>
                        <div className="font-semibold">${item.total.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${lastReceipt.subtotal?.toFixed(2)}</span>
                  </div>
                  {lastReceipt.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount:</span>
                      <span>-${lastReceipt.discount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax (15% VAT):</span>
                    <span>${lastReceipt.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${lastReceipt.total?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center mt-6 pt-4 border-t text-sm text-gray-600">
                  <p className="font-medium">Thank you for choosing Ehutano Pharmacy!</p>
                  <p>Payment Method: {lastReceipt.paymentMethod?.toUpperCase()}</p>
                  <p>Served by: {lastReceipt.cashier}</p>
                  <p className="text-xs mt-2">For queries, please contact us with this receipt number</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={printReceipt} 
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReceiptDialog(false)} 
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Browse All Medicines Dialog */}
      <Dialog open={isNewSaleDialogOpen} onOpenChange={setIsNewSaleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Browse Zimbabwe Medicines Database</DialogTitle>
            <DialogDescription>Select medicines to add to your sale</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search authentic Zimbabwe medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {medicinesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <div className="mt-2 text-sm text-gray-500">Loading Zimbabwe medicines...</div>
                </div>
              ) : filteredMedicines.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {searchTerm ? `No medicines found for "${searchTerm}"` : "No medicines available"}
                </div>
              ) : (
                filteredMedicines.map((medicine: any) => (
                  <div
                    key={medicine.id}
                    className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all"
                    onClick={() => {
                      addItemToSale(medicine);
                      toast({
                        title: "Medicine Added",
                        description: `${medicine.name} added to sale`
                      });
                    }}
                  >
                    <div className="font-medium text-sm text-gray-900 mb-1">{medicine.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{medicine.category}</div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-600">${medicine.price}</span>
                      {medicine.requiresPrescription && (
                        <span className="text-xs text-red-500 font-medium">Rx Required</span>
                      )}
                    </div>
                    {medicine.activeIngredient && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {medicine.activeIngredient}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewSaleDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* POS Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>POS Settings</DialogTitle>
            <DialogDescription>Configure currency rates and receipt settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Currency Settings */}
            <div>
              <h3 className="text-lg font-medium mb-3">Currency Exchange Rates</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Label>Currency</Label>
                  <Label>Exchange Rate</Label>
                  <Label>Symbol</Label>
                </div>
                {Object.entries(settings.currencies).map(([code, info]) => (
                  <div key={code} className="grid grid-cols-3 gap-3">
                    <Input value={code} disabled />
                    <Input 
                      type="number"
                      value={info.rate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) || 1;
                        setSettings(prev => ({
                          ...prev,
                          currencies: {
                            ...prev.currencies,
                            [code]: { ...info, rate: newRate }
                          }
                        }));
                      }}
                    />
                    <Input 
                      value={info.symbol}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          currencies: {
                            ...prev.currencies,
                            [code]: { ...info, symbol: e.target.value }
                          }
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Receipt Settings */}
            <div>
              <h3 className="text-lg font-medium mb-3">Receipt Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Receipt Size</Label>
                  <Select 
                    value={settings.receipt.size} 
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, size: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (58mm)</SelectItem>
                      <SelectItem value="standard">Standard (80mm)</SelectItem>
                      <SelectItem value="large">Large (A4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pharmacy Name</Label>
                  <Input 
                    value={settings.receipt.pharmacyName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, pharmacyName: e.target.value }
                    }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Textarea 
                    value={settings.receipt.address}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, address: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={settings.receipt.phone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, phone: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label>License Number</Label>
                  <Input 
                    value={settings.receipt.license}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      receipt: { ...prev.receipt, license: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowSettings(false);
                toast({
                  title: "Settings Saved",
                  description: "POS settings have been updated successfully."
                });
              }}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt History Dialog */}
      <Dialog open={showReceiptHistory} onOpenChange={setShowReceiptHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt History</DialogTitle>
            <DialogDescription>View and reprint previous receipts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Receipt #</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(sales) && sales.map((sale: Sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{sale.receiptNumber}</td>
                      <td className="px-4 py-3">{new Date(sale.timestamp).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{sale.customerName || "Walk-in Customer"}</td>
                      <td className="px-4 py-3 font-medium">${sale.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setLastReceipt(sale);
                            setShowReceiptDialog(true);
                            setShowReceiptHistory(false);
                          }}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Reprint
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowReceiptHistory(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sales Reports Dialog */}
      <Dialog open={showSalesReports} onOpenChange={setShowSalesReports}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sales Reports</DialogTitle>
            <DialogDescription>Generate and download sales reports</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Sales</SelectItem>
                    <SelectItem value="weekly">Weekly Sales</SelectItem>
                    <SelectItem value="monthly">Monthly Sales</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Report Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Sales Today:</span>
                  <span className="font-medium">${analytics?.dailySales?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Transactions:</span>
                  <span className="font-medium">{Array.isArray(sales) ? sales.length : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Transaction:</span>
                  <span className="font-medium">${analytics?.avgTransaction?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSalesReports(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Generate PDF report
                window.print();
                toast({
                  title: "Report Generated",
                  description: "Sales report has been generated and is ready for printing."
                });
              }}>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}