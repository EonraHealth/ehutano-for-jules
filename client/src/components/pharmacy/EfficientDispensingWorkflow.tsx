import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Scan, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Printer, 
  Clock,
  ShieldCheck,
  BarChart3,
  Calendar,
  User,
  Pill,
  FileText,
  Eye,
  Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DispensingItem {
  id: number;
  prescriptionId: number;
  medicineId: number;
  medicineName: string;
  prescribedQuantity: number;
  dispensedQuantity: number;
  batchNumber: string;
  expiryDate: string;
  stockQuantity: number;
  scannedBarcode?: string;
  verified: boolean;
  dispensingNotes?: string;
}

interface PrescriptionForDispensing {
  id: number;
  patientName: string;
  doctorName: string;
  prescriptionDate: string;
  items: DispensingItem[];
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface WalkInCustomer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  medicalAidNumber?: string;
  medicalAidProvider?: string;
}

interface ManualPrescriptionItem {
  id: number;
  medicineName: string;
  dosage: string;
  quantity: number;
  instructions: string;
  price: number;
  medicineId?: number;
}

interface PaymentInfo {
  method: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'MEDICAL_AID';
  amount: number;
  reference?: string;
  medicalAidClaim?: boolean;
}

const EfficientDispensingWorkflow = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionForDispensing | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [dispensingProgress, setDispensingProgress] = useState(0);
  const [batchFilter, setBatchFilter] = useState('FEFO'); // First-Expiry, First-Out
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Walk-in customer workflow states
  const [walkInCustomer, setWalkInCustomer] = useState<WalkInCustomer>({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    medicalAidNumber: '',
    medicalAidProvider: ''
  });
  const [manualPrescription, setManualPrescription] = useState<ManualPrescriptionItem[]>([]);
  const [newMedicine, setNewMedicine] = useState({
    medicineName: '',
    dosage: '',
    quantity: '',
    instructions: '',
    price: ''
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'CASH',
    amount: 0
  });
  const [orderTotal, setOrderTotal] = useState(0);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending prescriptions for dispensing
  const { data: pendingPrescriptions = [], isLoading: prescriptionsLoading } = useQuery<PrescriptionForDispensing[]>({
    queryKey: ['/api/v1/pharmacy/prescriptions/pending-dispensing'],
    queryFn: async () => {
      const response = await fetch('/api/v1/pharmacy/prescriptions/pending-dispensing', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pending prescriptions');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false, // Don't retry on auth errors
  });

  // Fetch inventory with batch tracking
  const { data: inventoryBatches = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/v1/pharmacy/inventory/batches'],
    queryFn: async () => {
      const response = await fetch('/api/v1/pharmacy/inventory/batches', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inventory batches');
      }
      return response.json();
    },
    retry: false, // Don't retry on auth errors
  });

  // Barcode verification mutation
  const verifyBarcodeMutation = useMutation({
    mutationFn: async (data: { barcode: string; medicineId: number; prescriptionId: number }) => {
      const response = await apiRequest('POST', '/api/v1/pharmacy/verify-barcode', data);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Barcode Verified',
        description: `Medicine verified: ${data.medicineName || 'Medicine'}`,
        variant: 'default',
      });
      updateDispensingProgress();
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid barcode or medicine mismatch',
        variant: 'destructive',
      });
    },
  });

  // Complete dispensing mutation
  const completeDispensingMutation = useMutation({
    mutationFn: async (prescriptionId: number) => {
      return apiRequest('POST', `/api/v1/pharmacy/prescriptions/${prescriptionId}/complete-dispensing`, {
        items: currentPrescription?.items,
        labelPrinted: true,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Dispensing Complete',
        description: 'Prescription successfully dispensed and documented',
        variant: 'default',
      });
      setCurrentPrescription(null);
      setDispensingProgress(0);
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/prescriptions/pending-dispensing'] });
    },
  });

  // Print label mutation
  const printLabelMutation = useMutation({
    mutationFn: async (data: { prescriptionId: number; items: DispensingItem[] }) => {
      return apiRequest('POST', '/api/v1/pharmacy/print-medication-label', data);
    },
    onSuccess: () => {
      toast({
        title: 'Label Printed',
        description: 'Medication label printed successfully',
        variant: 'default',
      });
    },
  });

  const updateDispensingProgress = () => {
    if (!currentPrescription) return;
    const totalItems = currentPrescription.items.length;
    const verifiedItems = currentPrescription.items.filter(item => item.verified).length;
    setDispensingProgress((verifiedItems / totalItems) * 100);
  };

  // Customer save mutation
  const saveCustomerMutation = useMutation({
    mutationFn: async (customerData: WalkInCustomer) => {
      return apiRequest('POST', '/api/v1/pharmacy/customers', customerData);
    },
    onSuccess: () => {
      toast({
        title: 'Customer Saved',
        description: 'Customer information has been saved successfully',
        variant: 'default',
      });
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Failed to save customer information',
        variant: 'destructive',
      });
    }
  });

  // Add medicine to prescription mutation
  const addMedicineMutation = useMutation({
    mutationFn: async (medicineData: Omit<ManualPrescriptionItem, 'id'>) => {
      const newItem: ManualPrescriptionItem = {
        ...medicineData,
        id: Date.now() // Simple ID generation
      };
      setManualPrescription(prev => [...prev, newItem]);
      return newItem;
    },
    onSuccess: () => {
      toast({
        title: 'Medicine Added',
        description: 'Medicine has been added to prescription',
        variant: 'default',
      });
    }
  });

  // Save manual prescription mutation
  const savePrescriptionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/v1/pharmacy/prescriptions/manual', {
        customerId: walkInCustomer.id || Date.now(),
        customerName: walkInCustomer.name,
        items: manualPrescription
      });
    },
    onSuccess: () => {
      toast({
        title: 'Prescription Saved',
        description: 'Prescription has been saved and added to pending list',
        variant: 'default',
      });
      // Refresh the pending prescriptions list
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/prescriptions/pending-dispensing'] });
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Failed to save prescription',
        variant: 'destructive',
      });
    }
  });

  const handleBatchSelection = (itemId: number, batchNumber: string, expiryDate: string) => {
    setCurrentPrescription(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId 
            ? { ...item, batchNumber, expiryDate }
            : item
        )
      };
    });
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    setCurrentPrescription(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId 
            ? { ...item, dispensedQuantity: quantity }
            : item
        )
      };
    });
  };

  const handleNotesChange = (itemId: number, notes: string) => {
    setCurrentPrescription(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId 
            ? { ...item, dispensingNotes: notes }
            : item
        )
      };
    });
  };

  const handleBarcodeVerification = async () => {
    if (!scannedBarcode || !currentPrescription) return;
    
    // Find the next unverified item
    const nextItem = currentPrescription.items.find(item => !item.verified);
    if (!nextItem) {
      toast({
        title: 'All Items Verified',
        description: 'All prescription items have been verified',
        variant: 'default',
      });
      return;
    }

    try {
      const result = await verifyBarcodeMutation.mutateAsync({
        barcode: scannedBarcode,
        medicineId: nextItem.medicineId,
        prescriptionId: currentPrescription.id
      });

      if (result.success) {
        // Mark item as verified
        setCurrentPrescription(prev => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map(item => 
              item.id === nextItem.id ? { ...item, verified: true } : item
            )
          };
        });
        
        setScannedBarcode('');
        updateDispensingProgress();
        
        toast({
          title: 'Item Verified',
          description: `${result.medicineName || nextItem.medicineName} verified successfully`,
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Barcode does not match expected medicine',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Verification Error',
        description: 'Failed to verify barcode',
        variant: 'destructive',
      });
    }
  };

  const getBatchesByFEFO = (medicineId: number) => {
    if (!inventoryBatches || !Array.isArray(inventoryBatches)) return [];
    return inventoryBatches
      .filter((batch: any) => batch.medicineId === medicineId)
      .sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  };

  const getExpiryStatusColor = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 30) return 'text-red-600 bg-red-50';
    if (daysUntilExpiry <= 90) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    updateDispensingProgress();
  }, [currentPrescription?.items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Efficient Dispensing Workflow</h2>
          <p className="text-muted-foreground">
            Streamlined medicine dispensing with barcode verification and batch tracking
          </p>
        </div>
        {currentPrescription && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Dispensing Progress</div>
            <Progress value={dispensingProgress} className="w-32 mt-1" />
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round(dispensingProgress)}% Complete
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer
          </TabsTrigger>
          <TabsTrigger value="prescription" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prescription
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Scan & Verify
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Batch Select
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Complete
          </TabsTrigger>
        </TabsList>

        {/* Customer Registration & Lookup Tab */}
        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
              <CardDescription>
                Register new customer or search existing customer records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Search */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, phone, or medical aid number..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={walkInCustomer.name}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      value={walkInCustomer.phone}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+263 77 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={walkInCustomer.email}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerDOB">Date of Birth</Label>
                    <Input
                      id="customerDOB"
                      type="date"
                      value={walkInCustomer.dateOfBirth}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="customerAddress">Address</Label>
                    <Input
                      id="customerAddress"
                      value={walkInCustomer.address}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter full address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalAidProvider">Medical Aid Provider</Label>
                    <Input
                      id="medicalAidProvider"
                      value={walkInCustomer.medicalAidProvider}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, medicalAidProvider: e.target.value }))}
                      placeholder="e.g., CIMAS, Premier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalAidNumber">Medical Aid Number</Label>
                    <Input
                      id="medicalAidNumber"
                      value={walkInCustomer.medicalAidNumber}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, medicalAidNumber: e.target.value }))}
                      placeholder="Medical aid membership number"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={() => setActiveTab('prescription')}
                    disabled={!walkInCustomer.name || !walkInCustomer.phone}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Continue to Prescription
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => saveCustomerMutation.mutate(walkInCustomer)}
                    disabled={!walkInCustomer.name || !walkInCustomer.phone || saveCustomerMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {saveCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Prescription Entry Tab */}
        <TabsContent value="prescription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prescription Entry
              </CardTitle>
              <CardDescription>
                Manually enter prescription details or scan existing prescription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 mb-4">
                <Button variant="outline" className="flex-1">
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Prescription
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Prescription Items</h3>
                
                {/* Add Medicine Form */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg mb-4">
                  <div className="space-y-2">
                    <Label>Medicine Name</Label>
                    <Input 
                      placeholder="Enter medicine name"
                      value={newMedicine.medicineName}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, medicineName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input 
                      placeholder="e.g., 500mg"
                      value={newMedicine.dosage}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number" 
                      placeholder="30"
                      value={newMedicine.quantity}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Input 
                      placeholder="Take with meals"
                      value={newMedicine.instructions}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, instructions: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="25.50"
                      value={newMedicine.price}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        if (!newMedicine.medicineName || !newMedicine.quantity || !newMedicine.price) {
                          toast({
                            title: 'Missing Information',
                            description: 'Please fill in medicine name, quantity, and price',
                            variant: 'destructive',
                          });
                          return;
                        }
                        
                        addMedicineMutation.mutate({
                          medicineName: newMedicine.medicineName,
                          dosage: newMedicine.dosage,
                          quantity: Number(newMedicine.quantity),
                          instructions: newMedicine.instructions,
                          price: Number(newMedicine.price)
                        });
                        
                        // Reset form
                        setNewMedicine({
                          medicineName: '',
                          dosage: '',
                          quantity: '',
                          instructions: '',
                          price: ''
                        });
                      }}
                      disabled={addMedicineMutation.isPending}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {addMedicineMutation.isPending ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>

                {/* Prescription Items List */}
                <div className="space-y-3">
                  {manualPrescription.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      No prescription items added yet. Add medicines using the form above.
                    </div>
                  ) : (
                    manualPrescription.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.medicineName}</div>
                          <div className="text-sm text-gray-600">
                            {item.dosage} • Qty: {item.quantity} • {item.instructions}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${item.price.toFixed(2)}</div>
                          <Button variant="outline" size="sm">Remove</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-lg font-semibold">
                    Total: ${manualPrescription.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('customer')}>
                      <User className="h-4 w-4 mr-2" />
                      Back to Customer
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => savePrescriptionMutation.mutate()}
                      disabled={manualPrescription.length === 0 || !walkInCustomer.name || savePrescriptionMutation.isPending}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {savePrescriptionMutation.isPending ? 'Saving...' : 'Save Prescription'}
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('scan')}
                      disabled={manualPrescription.length === 0}
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Continue to Verification
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prescription Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Pending Prescriptions
                </CardTitle>
                <CardDescription>
                  Select a prescription to begin dispensing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {prescriptionsLoading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                ) : pendingPrescriptions && pendingPrescriptions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingPrescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          currentPrescription?.id === prescription.id
                            ? 'border-primary bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCurrentPrescription(prescription)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{prescription.patientName}</div>
                          <Badge className={getPriorityColor(prescription.priority)}>
                            {prescription.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Dr. {prescription.doctorName} • {prescription.items.length} items
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(prescription.prescriptionDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No pending prescriptions for dispensing
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Barcode Scanning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Barcode Verification
                </CardTitle>
                <CardDescription>
                  Scan medicine barcodes to verify accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentPrescription ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Dispensing for <strong>{currentPrescription.patientName}</strong>
                        <br />
                        Prescription ID: {currentPrescription.id}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="barcode">Scan Barcode</Label>
                      <div className="flex gap-2">
                        <Input
                          id="barcode"
                          ref={barcodeInputRef}
                          value={scannedBarcode}
                          onChange={(e) => setScannedBarcode(e.target.value)}
                          placeholder="Scan or enter barcode..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleBarcodeVerification();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          onClick={handleBarcodeVerification}
                          disabled={!scannedBarcode || verifyBarcodeMutation.isPending}
                        >
                          Verify
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Prescription Items</Label>
                      {currentPrescription.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`p-3 border rounded-lg ${
                            item.verified ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{item.medicineName}</div>
                              <div className="text-sm text-gray-600">
                                Qty: {item.prescribedQuantity}
                                {item.batchNumber && (
                                  <span className="ml-2">Batch: {item.batchNumber}</span>
                                )}
                              </div>
                              <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                                Barcode: {item.medicineId}
                              </div>
                            </div>
                            {item.verified ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Select a prescription to begin scanning
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                FEFO Batch Management
              </CardTitle>
              <CardDescription>
                First-Expiry, First-Out batch tracking for optimal inventory rotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentPrescription ? (
                <div className="space-y-6">
                  {currentPrescription.items.map((item) => {
                    const availableBatches = getBatchesByFEFO(item.medicineId);
                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-medium">{item.medicineName}</h3>
                          <Badge variant="outline">Qty: {item.prescribedQuantity}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Available Batches (FEFO Order)</Label>
                          {availableBatches.length > 0 ? (
                            <div className="space-y-2">
                              {availableBatches.map((batch: any, index: number) => (
                                <div
                                  key={batch.id}
                                  className={`p-3 border rounded ${
                                    index === 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">Batch: {batch.batchNumber}</div>
                                      <div className="text-sm text-gray-600">
                                        Stock: {batch.stockQuantity} units
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge className={getExpiryStatusColor(batch.expiryDate)}>
                                        Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                                      </Badge>
                                      {index === 0 && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          ← Dispense First
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                No batches available for this medicine
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a prescription to view batch information
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispensing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Complete Dispensing
              </CardTitle>
              <CardDescription>
                Finalize prescription dispensing and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentPrescription ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentPrescription.items.length}
                      </div>
                      <div className="text-sm text-blue-600">Total Items</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {currentPrescription.items.filter(item => item.verified).length}
                      </div>
                      <div className="text-sm text-green-600">Verified Items</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {Math.round(dispensingProgress)}%
                      </div>
                      <div className="text-sm text-gray-600">Complete</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dispensing Summary</h3>
                    {currentPrescription.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{item.medicineName}</div>
                          <div className="text-sm text-gray-600">
                            Quantity: {item.prescribedQuantity}
                            {item.batchNumber && (
                              <span className="ml-2">• Batch: {item.batchNumber}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => completeDispensingMutation.mutate(currentPrescription.id)}
                      disabled={
                        dispensingProgress < 100 || 
                        completeDispensingMutation.isPending
                      }
                      className="flex-1"
                    >
                      {completeDispensingMutation.isPending ? 'Processing...' : 'Complete Dispensing'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentPrescription(null);
                        setDispensingProgress(0);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No prescription selected for dispensing
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Processing Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Payment Processing
              </CardTitle>
              <CardDescription>
                Process customer payment and finalize transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{walkInCustomer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{walkInCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{manualPrescription.length} medicine(s)</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>${manualPrescription.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold">Payment Method</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant={paymentInfo.method === 'CASH' ? 'default' : 'outline'}
                    onClick={() => setPaymentInfo(prev => ({ ...prev, method: 'CASH' }))}
                    className="p-4 h-auto flex-col"
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentInfo.method === 'CARD' ? 'default' : 'outline'}
                    onClick={() => setPaymentInfo(prev => ({ ...prev, method: 'CARD' }))}
                    className="p-4 h-auto flex-col"
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Card
                  </Button>
                  <Button
                    variant={paymentInfo.method === 'MOBILE_MONEY' ? 'default' : 'outline'}
                    onClick={() => setPaymentInfo(prev => ({ ...prev, method: 'MOBILE_MONEY' }))}
                    className="p-4 h-auto flex-col"
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Mobile Money
                  </Button>
                  <Button
                    variant={paymentInfo.method === 'MEDICAL_AID' ? 'default' : 'outline'}
                    onClick={() => setPaymentInfo(prev => ({ ...prev, method: 'MEDICAL_AID' }))}
                    className="p-4 h-auto flex-col"
                  >
                    <ShieldCheck className="h-6 w-6 mb-2" />
                    Medical Aid
                  </Button>
                </div>
              </div>

              {/* Payment Details */}
              {paymentInfo.method === 'CASH' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Cash Payment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount Received ($)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Enter amount received"
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Change Due ($)</Label>
                      <Input 
                        value={(paymentInfo.amount - manualPrescription.reduce((sum, item) => sum + item.price, 0)).toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentInfo.method === 'CARD' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Card Payment</h4>
                  <div className="space-y-2">
                    <Label>Transaction Reference</Label>
                    <Input 
                      placeholder="Enter card transaction reference"
                      onChange={(e) => setPaymentInfo(prev => ({ ...prev, reference: e.target.value }))}
                    />
                  </div>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Process Card Payment
                  </Button>
                </div>
              )}

              {paymentInfo.method === 'MOBILE_MONEY' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Mobile Money Payment</h4>
                  <div className="space-y-2">
                    <Label>Transaction ID</Label>
                    <Input 
                      placeholder="Enter mobile money transaction ID"
                      onChange={(e) => setPaymentInfo(prev => ({ ...prev, reference: e.target.value }))}
                    />
                  </div>
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Verify Mobile Payment
                  </Button>
                </div>
              )}

              {paymentInfo.method === 'MEDICAL_AID' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Medical Aid Claim</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Medical Aid Provider</Label>
                      <Input 
                        value={walkInCustomer.medicalAidProvider}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Membership Number</Label>
                      <Input 
                        value={walkInCustomer.medicalAidNumber}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Submit Medical Aid Claim
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setActiveTab('batch')} className="flex-1">
                  <Package className="h-4 w-4 mr-2" />
                  Back to Batch Selection
                </Button>
                <Button 
                  onClick={() => setActiveTab('labels')}
                  className="flex-1"
                  disabled={paymentInfo.method === 'CASH' && paymentInfo.amount < manualPrescription.reduce((sum, item) => sum + item.price, 0)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Transaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Transaction Complete
              </CardTitle>
              <CardDescription>
                Finalize dispensing, print receipt and medication labels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentPrescription ? (
                <div className="space-y-6">
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertDescription>
                      Labels include: Patient info, medicine details, dosage instructions, 
                      pharmacy info, batch numbers, and regulatory compliance elements
                    </AlertDescription>
                  </Alert>

                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-3">Label Preview</h3>
                    <div className="bg-white border rounded p-4 font-mono text-sm">
                      <div className="text-center font-bold mb-2">PHARMACY DISPENSING LABEL</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div><strong>Patient:</strong> {currentPrescription.patientName}</div>
                          <div><strong>Doctor:</strong> Dr. {currentPrescription.doctorName}</div>
                          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div><strong>Rx ID:</strong> {currentPrescription.id}</div>
                          <div><strong>Pharmacy:</strong> Your Pharmacy Name</div>
                          <div><strong>Pharmacist:</strong> Current User</div>
                        </div>
                      </div>
                      <hr className="my-2" />
                      {currentPrescription.items.map((item, index) => (
                        <div key={item.id} className="mb-2">
                          <div><strong>{index + 1}. {item.medicineName}</strong></div>
                          <div>Quantity: {item.prescribedQuantity}</div>
                          <div>Batch: {item.batchNumber || 'TBA'}</div>
                          <div>Exp: {item.expiryDate || 'TBA'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => printLabelMutation.mutate({
                      prescriptionId: currentPrescription.id,
                      items: currentPrescription.items
                    })}
                    disabled={printLabelMutation.isPending}
                    className="w-full"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {printLabelMutation.isPending ? 'Printing...' : 'Print Medication Labels'}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a prescription to print labels
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EfficientDispensingWorkflow;