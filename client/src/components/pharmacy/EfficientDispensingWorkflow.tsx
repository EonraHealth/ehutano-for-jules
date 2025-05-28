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
  Pill
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

const EfficientDispensingWorkflow = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionForDispensing | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [dispensingProgress, setDispensingProgress] = useState(0);
  const [batchFilter, setBatchFilter] = useState('FEFO'); // First-Expiry, First-Out
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending prescriptions for dispensing
  const { data: pendingPrescriptions, isLoading: prescriptionsLoading } = useQuery<PrescriptionForDispensing[]>({
    queryKey: ['/api/v1/pharmacy/prescriptions/pending-dispensing'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch inventory with batch tracking
  const { data: inventoryBatches, isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/v1/pharmacy/inventory/batches'],
  });

  // Barcode verification mutation
  const verifyBarcodeMutation = useMutation({
    mutationFn: async (data: { barcode: string; medicineId: number; prescriptionId: number }) => {
      return apiRequest('POST', '/api/v1/pharmacy/verify-barcode', data);
    },
    onSuccess: (data) => {
      toast({
        title: 'Barcode Verified',
        description: `Medicine verified: ${data.medicineName}`,
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

    await verifyBarcodeMutation.mutateAsync({
      barcode: scannedBarcode,
      medicineId: nextItem.medicineId,
      prescriptionId: currentPrescription.id,
    });

    setScannedBarcode('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const getBatchesByFEFO = (medicineId: number) => {
    if (!inventoryBatches) return [];
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Barcode Scan
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Batch Tracking
          </TabsTrigger>
          <TabsTrigger value="dispensing" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Dispensing
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Label Printing
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="labels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Medication Label Printing
              </CardTitle>
              <CardDescription>
                Generate regulatory-compliant medication labels
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