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
  Download,
  CreditCard,
  ExternalLink
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
  salutation: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  initial?: string;
  idNumber: string;
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
    salutation: '',
    firstName: '',
    middleName: '',
    lastName: '',
    initial: '',
    idNumber: '',
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
    price: '',
    medicineId: null as number | null
  });
  const [medicineSearchResults, setMedicineSearchResults] = useState<any[]>([]);
  const [showMedicineSuggestions, setShowMedicineSuggestions] = useState(false);
  const [instructionSuggestions] = useState([
    'Take with meals',
    'Take on empty stomach',
    'Take before bedtime',
    'Take as needed for pain',
    'Apply to affected area',
    'Take with plenty of water',
    'Do not crush or chew'
  ]);
  const [showInstructionSuggestions, setShowInstructionSuggestions] = useState(false);
  const [interpretedInstructions, setInterpretedInstructions] = useState('');
  
  // Medical abbreviation interpreter
  const interpretMedicalAbbreviations = (input: string): string => {
    let interpreted = input.toLowerCase();
    
    // Common medical abbreviations
    const abbreviations: { [key: string]: string } = {
      // Frequency
      'od': 'once daily',
      'bd': 'twice daily', 
      'tds': 'three times daily',
      'qds': 'four times daily',
      'qid': 'four times daily',
      'bid': 'twice daily',
      'tid': 'three times daily',
      'prn': 'when necessary',
      'stat': 'immediately',
      'sos': 'if required',
      
      // Timing
      'ac': 'before food',
      'pc': 'after food',
      'hs': 'at bedtime',
      'am': 'in the morning',
      'pm': 'in the evening',
      'nocte': 'at night',
      
      // Dosage forms
      't1': 'take one tablet',
      't2': 'take two tablets',
      'c1': 'take one capsule',
      'c2': 'take two capsules',
      'tab': 'tablet',
      'caps': 'capsule',
      'ml': 'milliliters',
      'mg': 'milligrams',
      
      // Conditions
      'pdi': 'for pain and inflammation',
      'uti': 'for urinary tract infection',
      'htn': 'for high blood pressure',
      'dm': 'for diabetes',
      'pain': 'for pain relief',
      'fever': 'for fever',
      'cough': 'for cough',
      
      // Routes
      'po': 'by mouth',
      'topical': 'apply to skin',
      'iv': 'intravenously',
      'im': 'intramuscularly'
    };
    
    // Replace abbreviations
    Object.entries(abbreviations).forEach(([abbrev, meaning]) => {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      interpreted = interpreted.replace(regex, meaning);
    });
    
    // Capitalize first letter
    return interpreted.charAt(0).toUpperCase() + interpreted.slice(1);
  };
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'CASH',
    amount: 0
  });
  const [orderTotal, setOrderTotal] = useState(0);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Medicine search functionality
  const searchMedicines = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setMedicineSearchResults([]);
      setShowMedicineSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/v1/medicines/search?q=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const results = await response.json();
        setMedicineSearchResults(results);
        setShowMedicineSuggestions(true);
      }
    } catch (error) {
      console.error('Medicine search error:', error);
    }
  };

  // Handle medicine selection
  const selectMedicine = (medicine: any) => {
    setNewMedicine(prev => ({
      ...prev,
      medicineName: medicine.name,
      dosage: medicine.dosage || '',
      price: medicine.price?.toString() || '',
      medicineId: medicine.id
    }));
    setShowMedicineSuggestions(false);
    setMedicineSearchResults([]);
  };

  // Handle instruction changes and interpretation
  const handleInstructionChange = (value: string) => {
    setNewMedicine(prev => ({ ...prev, instructions: value }));
    const interpreted = interpretMedicalAbbreviations(value);
    setInterpretedInstructions(interpreted);
  };

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
        customerName: `${walkInCustomer.salutation} ${walkInCustomer.firstName} ${walkInCustomer.middleName || ''} ${walkInCustomer.lastName}`.replace(/\s+/g, ' ').trim(),
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
          <TabsTrigger value="medical-aid" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Medical Aid
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Complete & Send to POS
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerSalutation">Salutation</Label>
                    <select
                      id="customerSalutation"
                      value={walkInCustomer.salutation}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, salutation: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select...</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                      <option value="Rev">Rev</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerFirstName">First Name *</Label>
                    <Input
                      id="customerFirstName"
                      value={walkInCustomer.firstName}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerMiddleName">Middle Name</Label>
                    <Input
                      id="customerMiddleName"
                      value={walkInCustomer.middleName}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, middleName: e.target.value }))}
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerLastName">Last Name *</Label>
                    <Input
                      id="customerLastName"
                      value={walkInCustomer.lastName}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerInitial">Initial</Label>
                    <Input
                      id="customerInitial"
                      value={walkInCustomer.initial}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, initial: e.target.value }))}
                      placeholder="e.g., J"
                      maxLength={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerIdNumber">ID Number *</Label>
                    <Input
                      id="customerIdNumber"
                      value={walkInCustomer.idNumber}
                      onChange={(e) => setWalkInCustomer(prev => ({ ...prev, idNumber: e.target.value }))}
                      placeholder="National ID Number"
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
                    disabled={!walkInCustomer.firstName || !walkInCustomer.lastName || !walkInCustomer.phone || !walkInCustomer.idNumber}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Continue to Prescription
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => saveCustomerMutation.mutate(walkInCustomer)}
                    disabled={!walkInCustomer.firstName || !walkInCustomer.lastName || !walkInCustomer.phone || !walkInCustomer.idNumber || saveCustomerMutation.isPending}
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
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    toast({
                      title: "Scan Prescription",
                      description: "Camera scanning feature coming soon. Use manual entry for now.",
                    });
                  }}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Prescription
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        toast({
                          title: "Image Upload",
                          description: `Image "${file.name}" selected. OCR processing coming soon.`,
                        });
                      }
                    };
                    input.click();
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Prescription Items</h3>
                
                {/* Add Medicine Form */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg mb-4">
                  <div className="space-y-2 relative">
                    <Label>Medicine Name</Label>
                    <Input 
                      placeholder="Start typing medicine name..."
                      value={newMedicine.medicineName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewMedicine(prev => ({ ...prev, medicineName: value }));
                        searchMedicines(value);
                      }}
                      onFocus={() => {
                        if (medicineSearchResults.length > 0) {
                          setShowMedicineSuggestions(true);
                        }
                      }}
                    />
                    {showMedicineSuggestions && medicineSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {medicineSearchResults.map((medicine) => (
                          <div
                            key={medicine.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selectMedicine(medicine)}
                          >
                            <div className="font-medium text-sm">{medicine.name}</div>
                            <div className="text-xs text-gray-500">{medicine.dosage} - ${medicine.price}</div>
                            <div className="text-xs text-gray-400">{medicine.manufacturer}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input 
                      placeholder="e.g., 500mg"
                      value={newMedicine.dosage}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                      readOnly={!!newMedicine.medicineId}
                      className={newMedicine.medicineId ? "bg-gray-50" : ""}
                    />
                    {newMedicine.medicineId && (
                      <div className="text-xs text-green-600">Auto-filled from selected medicine</div>
                    )}
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
                  <div className="space-y-2 relative">
                    <Label>Instructions</Label>
                    <Input 
                      placeholder="e.g., t1 tds pc prn pdi"
                      value={newMedicine.instructions}
                      onChange={(e) => handleInstructionChange(e.target.value)}
                      onFocus={() => setShowInstructionSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowInstructionSuggestions(false), 200)}
                    />
                    {showInstructionSuggestions && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {instructionSuggestions.map((instruction, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              setNewMedicine(prev => ({ ...prev, instructions: instruction }));
                              setInterpretedInstructions(instruction);
                              setShowInstructionSuggestions(false);
                            }}
                          >
                            {instruction}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="25.50"
                      value={newMedicine.price}
                      onChange={(e) => setNewMedicine(prev => ({ ...prev, price: e.target.value }))}
                      readOnly={!!newMedicine.medicineId}
                      className={newMedicine.medicineId ? "bg-gray-50" : ""}
                    />
                    {newMedicine.medicineId && (
                      <div className="text-xs text-green-600">Auto-filled from selected medicine</div>
                    )}
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
                          price: '',
                          medicineId: null
                        });
                        setInterpretedInstructions('');
                      }}
                      disabled={addMedicineMutation.isPending}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {addMedicineMutation.isPending ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>

                {/* Medical Abbreviation Interpretation Box */}
                {interpretedInstructions && interpretedInstructions !== newMedicine.instructions && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-1">Label Instructions Preview</h4>
                        <p className="text-sm text-blue-800 mb-2">
                          <span className="font-medium">Original:</span> {newMedicine.instructions}
                        </p>
                        <p className="text-sm text-blue-900 font-medium">
                          <span className="font-medium">On Label:</span> {interpretedInstructions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                      disabled={manualPrescription.length === 0 || !walkInCustomer.firstName || !walkInCustomer.lastName || savePrescriptionMutation.isPending}
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

        {/* Medical Aid Processing Tab */}
        <TabsContent value="medical-aid">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Medical Aid Processing
              </CardTitle>
              <CardDescription>
                Process medical aid claims or mark as private payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{`${walkInCustomer.salutation} ${walkInCustomer.firstName} ${walkInCustomer.middleName || ''} ${walkInCustomer.lastName}`.replace(/\s+/g, ' ').trim()}</span>
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
                Complete Dispensing & Send to POS
              </CardTitle>
              <CardDescription>
                Print medication labels and send patient details to POS for payment processing
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