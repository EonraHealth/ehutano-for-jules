import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FileText, Eye, CheckCircle, XCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react';

interface Prescription {
  id: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  prescriptionDate: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'READY_FOR_PICKUP' | 'DISPENSED' | 'CANCELLED';
  medicines: Array<{
    id: number;
    name: string;
    dosage: string;
    quantity: number;
    instructions: string;
    price?: number;
  }>;
  totalAmount?: number;
  notes?: string;
  verificationNotes?: string;
}

const PrescriptionManagement = () => {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch prescriptions using working analytics pattern
  const { data: prescriptions, isLoading, error } = useQuery<Prescription[]>({
    queryKey: ['/api/v1/pharmacy/analytics/prescriptions'],
    staleTime: 30000 // 30 seconds
  });

  // Update prescription status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: { prescriptionId: number; status: string; notes?: string }) =>
      apiRequest(`/api/v1/pharmacy/prescriptions/${data.prescriptionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: data.status, notes: data.notes })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/prescriptions'] });
      toast({
        title: "Success",
        description: "Prescription status updated successfully",
        variant: "default",
      });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prescription status",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING_REVIEW':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'VERIFIED':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'READY_FOR_PICKUP':
        return <Badge className="bg-green-100 text-green-800"><AlertTriangle className="w-3 h-3 mr-1" />Ready for Pickup</Badge>;
      case 'DISPENSED':
        return <Badge className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Dispensed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleStatusUpdate = (prescriptionId: number, newStatus: string, notes?: string) => {
    updateStatusMutation.mutate({ prescriptionId, status: newStatus, notes });
  };

  const filteredPrescriptions = prescriptions?.filter(prescription => {
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusCount = (status: string) => {
    return prescriptions?.filter(p => p.status === status).length || 0;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-700 mb-2">Unable to Load Prescriptions</h3>
            <p className="text-red-600 mb-4">There was an error loading prescription data.</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{getStatusCount('PENDING_REVIEW')}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{getStatusCount('VERIFIED')}</p>
                <p className="text-sm text-gray-600">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{getStatusCount('READY_FOR_PICKUP')}</p>
                <p className="text-sm text-gray-600">Ready for Pickup</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{prescriptions?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Prescription Management</CardTitle>
          <CardDescription>Process and verify patient prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by patient name, doctor, or prescription ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="READY_FOR_PICKUP">Ready for Pickup</SelectItem>
                  <SelectItem value="DISPENSED">Dispensed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prescriptions Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Medicines</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPrescriptions.length > 0 ? (
                  filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-medium">#{prescription.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prescription.patientName}</div>
                          <div className="text-sm text-gray-500">{prescription.patientPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{prescription.doctorName}</TableCell>
                      <TableCell>{new Date(prescription.prescriptionDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                      <TableCell>{prescription.medicines.length} items</TableCell>
                      <TableCell>
                        {prescription.totalAmount ? `$${prescription.totalAmount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Dialog open={detailsOpen && selectedPrescription?.id === prescription.id} onOpenChange={setDetailsOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPrescription(prescription)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Prescription Details - #{prescription.id}</DialogTitle>
                              <DialogDescription>
                                Process and verify prescription details
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPrescription && (
                              <PrescriptionDetails 
                                prescription={selectedPrescription}
                                onStatusUpdate={handleStatusUpdate}
                                isUpdating={updateStatusMutation.isPending}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No prescriptions found</p>
                      {searchTerm || filterStatus !== 'all' ? (
                        <p className="text-sm text-gray-400 mt-2">
                          Try adjusting your search or filter criteria
                        </p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface PrescriptionDetailsProps {
  prescription: Prescription;
  onStatusUpdate: (id: number, status: string, notes?: string) => void;
  isUpdating: boolean;
}

const PrescriptionDetails = ({ prescription, onStatusUpdate, isUpdating }: PrescriptionDetailsProps) => {
  const [notes, setNotes] = useState(prescription.verificationNotes || '');

  return (
    <div className="space-y-6">
      {/* Patient and Doctor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Name:</strong> {prescription.patientName}</div>
              <div><strong>Phone:</strong> {prescription.patientPhone}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Prescription Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Doctor:</strong> {prescription.doctorName}</div>
              <div><strong>Date:</strong> {new Date(prescription.prescriptionDate).toLocaleDateString()}</div>
              <div><strong>Status:</strong> {prescription.status}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medicines */}
      <Card>
        <CardHeader>
          <CardTitle>Prescribed Medicines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Instructions</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.medicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.dosage}</TableCell>
                  <TableCell>{medicine.quantity}</TableCell>
                  <TableCell>{medicine.instructions}</TableCell>
                  <TableCell>
                    {medicine.price ? `$${medicine.price.toFixed(2)}` : 'TBD'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {prescription.totalAmount && (
            <div className="mt-4 text-right">
              <strong>Total: ${prescription.totalAmount.toFixed(2)}</strong>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add verification notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex gap-2 mt-4">
            {prescription.status === 'PENDING_REVIEW' && (
              <>
                <Button
                  onClick={() => onStatusUpdate(prescription.id, 'VERIFIED', notes)}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Prescription
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onStatusUpdate(prescription.id, 'CANCELLED', notes)}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
            
            {prescription.status === 'VERIFIED' && (
              <Button
                onClick={() => onStatusUpdate(prescription.id, 'READY_FOR_PICKUP', notes)}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Mark Ready for Pickup
              </Button>
            )}
            
            {prescription.status === 'READY_FOR_PICKUP' && (
              <Button
                onClick={() => onStatusUpdate(prescription.id, 'DISPENSED', notes)}
                disabled={isUpdating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Dispensed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionManagement;