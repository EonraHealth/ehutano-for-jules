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
  Loader2, 
  AlertTriangle, 
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  FileCheck,
  UserCircle,
  FileClock,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

type MedicalAidClaim = {
  id: number;
  claimNumber: string;
  orderId: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  medicalAidProvider: string;
  medicalAidMemberId: string;
  claimDate: string;
  claimAmount: number;
  approvedAmount: number | null;
  status: ClaimStatus;
  notes: string | null;
  submittedAt: string;
  updatedAt: string | null;
  claimItems: ClaimItem[];
};

type ClaimItem = {
  id: number;
  claimId: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  approvedAmount: number | null;
};

const MedicalAidClaimsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<MedicalAidClaim | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'ALL'>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  
  // Form state for processing a claim
  const [processingFormData, setProcessingFormData] = useState({
    status: 'APPROVED' as ClaimStatus,
    approvedAmount: 0,
    notes: '',
    claimItems: [] as Array<{
      id: number,
      medicineName: string,
      subtotal: number,
      approvedAmount: number
    }>
  });

  // Fetch claims
  const { data: claims, isLoading, isError } = useQuery({
    queryKey: ['/api/v1/pharmacy/medical-aid/claims'],
    staleTime: 60000, // 1 minute
    queryFn: async () => {
      // In a real implementation, this would be a fetch call to the API
      // For now, we'll return mock data
      const { mockMedicalAidClaims } = await import('@/lib/mockData');
      // Cast the status string to ClaimStatus to satisfy TypeScript
      return mockMedicalAidClaims.map(claim => ({
        ...claim,
        status: claim.status as ClaimStatus
      }));
    }
  });

  // Update claim status
  const updateClaimMutation = useMutation({
    mutationFn: (data: { 
      claimId: number; 
      status: ClaimStatus; 
      approvedAmount: number | null;
      notes: string | null;
      claimItems?: Array<{
        id: number,
        approvedAmount: number
      }>;
    }) => {
      return apiRequest(`/api/v1/pharmacy/medical-aid/claims/${data.claimId}/status`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/medical-aid/claims'] });
      toast({
        title: "Success",
        description: "Claim status updated successfully",
        variant: "default",
      });
      setIsProcessDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update claim status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDetails = (claim: MedicalAidClaim) => {
    setSelectedClaim(claim);
    setIsDetailsDialogOpen(true);
  };

  const handleProcessClaim = (claim: MedicalAidClaim) => {
    setSelectedClaim(claim);
    
    // Initialize form data for processing
    setProcessingFormData({
      status: 'APPROVED',
      approvedAmount: claim.claimAmount,
      notes: '',
      claimItems: claim.claimItems.map(item => ({
        id: item.id,
        medicineName: item.medicineName,
        subtotal: item.subtotal,
        approvedAmount: item.subtotal
      }))
    });
    
    setIsProcessDialogOpen(true);
  };

  const handleSubmitProcessing = () => {
    if (selectedClaim) {
      updateClaimMutation.mutate({
        claimId: selectedClaim.id,
        status: processingFormData.status,
        approvedAmount: processingFormData.status === 'APPROVED' ? processingFormData.approvedAmount : null,
        notes: processingFormData.notes || null,
        claimItems: processingFormData.status === 'APPROVED' 
          ? processingFormData.claimItems.map(item => ({
              id: item.id,
              approvedAmount: item.approvedAmount
            })) 
          : undefined
      });
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'PAID':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Paid</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Calculate the total for all approved items
  const calculateTotalApproved = () => {
    return processingFormData.claimItems.reduce((total, item) => total + item.approvedAmount, 0);
  };

  // Update the approved amount for a specific item
  const handleItemApprovedAmountChange = (id: number, value: number) => {
    const updatedItems = processingFormData.claimItems.map(item => 
      item.id === id ? { ...item, approvedAmount: value } : item
    );
    
    setProcessingFormData({
      ...processingFormData,
      claimItems: updatedItems,
      approvedAmount: updatedItems.reduce((total, item) => total + item.approvedAmount, 0)
    });
  };

  // Filter claims based on search term, status, provider, and date range
  const filteredClaims = claims
    ? claims.filter((claim: MedicalAidClaim) => {
        const matchesSearch = 
          claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.medicalAidMemberId.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;
        const matchesProvider = !providerFilter || claim.medicalAidProvider === providerFilter;
        
        const claimDate = new Date(claim.claimDate);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;
        
        const matchesDateRange = 
          (!fromDate || claimDate >= fromDate) && 
          (!toDate || claimDate <= toDate);
        
        return matchesSearch && matchesStatus && matchesProvider && matchesDateRange;
      })
    : [];

  // Extract unique providers for filtering
  const providers = claims
    ? [...new Set(claims.map((claim: MedicalAidClaim) => claim.medicalAidProvider))]
    : [];

  // Calculate statistics
  const claimStats = {
    PENDING: claims ? claims.filter((claim: MedicalAidClaim) => claim.status === 'PENDING').length : 0,
    APPROVED: claims ? claims.filter((claim: MedicalAidClaim) => claim.status === 'APPROVED').length : 0,
    REJECTED: claims ? claims.filter((claim: MedicalAidClaim) => claim.status === 'REJECTED').length : 0,
    PAID: claims ? claims.filter((claim: MedicalAidClaim) => claim.status === 'PAID').length : 0,
    total: claims ? claims.length : 0,
    pendingAmount: claims 
      ? claims
          .filter((claim: MedicalAidClaim) => claim.status === 'PENDING')
          .reduce((sum: number, claim: MedicalAidClaim) => sum + claim.claimAmount, 0)
      : 0,
    approvedAmount: claims 
      ? claims
          .filter((claim: MedicalAidClaim) => claim.status === 'APPROVED' || claim.status === 'PAID')
          .reduce((sum: number, claim: MedicalAidClaim) => sum + (claim.approvedAmount || 0), 0)
      : 0
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading medical aid claims...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-48">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Error loading medical aid claims. Please try again.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Claims Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Claims</p>
                <h3 className="text-2xl font-bold">{claimStats.PENDING}</h3>
                <p className="text-sm text-gray-600">{formatCurrency(claimStats.pendingAmount)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <FileClock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved Claims</p>
                <h3 className="text-2xl font-bold">{claimStats.APPROVED}</h3>
                <p className="text-sm text-gray-600">{formatCurrency(claimStats.approvedAmount)}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected Claims</p>
                <h3 className="text-2xl font-bold">{claimStats.REJECTED}</h3>
              </div>
              <div className="p-2 bg-red-50 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid Claims</p>
                <h3 className="text-2xl font-bold">{claimStats.PAID}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-full">
                <FileCheck className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Tabs and Filters */}
      <Tabs defaultValue="all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Claims</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
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
              placeholder="Search by claim number, order number, patient name..."
              className="pl-8"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="w-44">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ClaimStatus | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-44">
              <Select
                value={providerFilter}
                onValueChange={setProviderFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_PROVIDERS">All Providers</SelectItem>
                  {providers.map((provider: string) => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
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
          <ClaimsTable 
            claims={filteredClaims}
            onViewDetails={handleViewDetails}
            onProcessClaim={handleProcessClaim}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="pending">
          <ClaimsTable 
            claims={filteredClaims.filter((claim: MedicalAidClaim) => claim.status === 'PENDING')}
            onViewDetails={handleViewDetails}
            onProcessClaim={handleProcessClaim}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="approved">
          <ClaimsTable 
            claims={filteredClaims.filter((claim: MedicalAidClaim) => claim.status === 'APPROVED')}
            onViewDetails={handleViewDetails}
            onProcessClaim={handleProcessClaim}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="rejected">
          <ClaimsTable 
            claims={filteredClaims.filter((claim: MedicalAidClaim) => claim.status === 'REJECTED')}
            onViewDetails={handleViewDetails}
            onProcessClaim={handleProcessClaim}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="paid">
          <ClaimsTable 
            claims={filteredClaims.filter((claim: MedicalAidClaim) => claim.status === 'PAID')}
            onViewDetails={handleViewDetails}
            onProcessClaim={handleProcessClaim}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Claim Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              Claim #{selectedClaim?.claimNumber} - {formatDate(selectedClaim?.claimDate || '')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Claim Information</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Date: {formatDate(selectedClaim.claimDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Status: {getStatusBadge(selectedClaim.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Order #: {selectedClaim.orderNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        Claim Amount: {formatCurrency(selectedClaim.claimAmount)}
                      </span>
                    </div>
                    {selectedClaim.approvedAmount !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Approved Amount: {formatCurrency(selectedClaim.approvedAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedClaim.status === 'PENDING' && (
                  <Button
                    onClick={() => {
                      setIsDetailsDialogOpen(false);
                      handleProcessClaim(selectedClaim);
                    }}
                    className="gap-1"
                  >
                    Process Claim
                  </Button>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">Patient Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Name: {selectedClaim.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Medical Aid: {selectedClaim.medicalAidProvider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Member ID: {selectedClaim.medicalAidMemberId}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">Claim Items</h3>
                <div className="rounded-md border mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        {selectedClaim.status !== 'PENDING' && (
                          <TableHead className="text-right">Approved</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedClaim.claimItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.medicineName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                          {selectedClaim.status !== 'PENDING' && (
                            <TableCell className="text-right">
                              {item.approvedAmount !== null 
                                ? formatCurrency(item.approvedAmount)
                                : 'N/A'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(selectedClaim.claimAmount)}</TableCell>
                        {selectedClaim.status !== 'PENDING' && (
                          <TableCell className="text-right font-bold">
                            {selectedClaim.approvedAmount !== null 
                              ? formatCurrency(selectedClaim.approvedAmount)
                              : 'N/A'}
                          </TableCell>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {selectedClaim.notes && (
                <div>
                  <h3 className="font-semibold text-lg">Notes</h3>
                  <p className="text-sm mt-2 p-3 bg-gray-50 rounded-md">{selectedClaim.notes}</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <p>Submitted: {formatDate(selectedClaim.submittedAt)}</p>
                {selectedClaim.updatedAt && (
                  <p>Last Updated: {formatDate(selectedClaim.updatedAt)}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Claim Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Process Medical Aid Claim</DialogTitle>
            <DialogDescription>
              Claim #{selectedClaim?.claimNumber} - {formatDate(selectedClaim?.claimDate || '')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Claim Status</Label>
                  <Select
                    value={processingFormData.status}
                    onValueChange={(value) => setProcessingFormData({
                      ...processingFormData,
                      status: value as ClaimStatus
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVED">Approve Claim</SelectItem>
                      <SelectItem value="REJECTED">Reject Claim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {processingFormData.status === 'APPROVED' && (
                  <div>
                    <h3 className="font-semibold text-base mb-2">Claim Items</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Medicine</TableHead>
                            <TableHead className="text-right">Claimed</TableHead>
                            <TableHead className="text-right">Approved Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processingFormData.claimItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.medicineName}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.approvedAmount}
                                  onChange={(e) => handleItemApprovedAmountChange(
                                    item.id, 
                                    parseFloat(e.target.value) || 0
                                  )}
                                  className="text-right"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={1} className="text-right font-medium">Total</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(selectedClaim.claimAmount)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(calculateTotalApproved())}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="mt-4">
                      <Label htmlFor="totalApproved">Total Approved Amount</Label>
                      <Input
                        id="totalApproved"
                        type="number"
                        min="0"
                        step="0.01"
                        value={processingFormData.approvedAmount}
                        onChange={(e) => setProcessingFormData({
                          ...processingFormData,
                          approvedAmount: parseFloat(e.target.value) || 0
                        })}
                        className="text-right font-medium"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Processing Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this claim processing"
                    value={processingFormData.notes}
                    onChange={(e) => setProcessingFormData({
                      ...processingFormData,
                      notes: e.target.value
                    })}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitProcessing}
                  disabled={updateClaimMutation.isPending}
                  variant={processingFormData.status === 'APPROVED' ? 'default' : 'destructive'}
                >
                  {updateClaimMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {processingFormData.status === 'APPROVED' ? 'Approve Claim' : 'Reject Claim'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for the claims table
interface ClaimsTableProps {
  claims: MedicalAidClaim[];
  onViewDetails: (claim: MedicalAidClaim) => void;
  onProcessClaim: (claim: MedicalAidClaim) => void;
  getStatusBadge: (status: ClaimStatus) => React.ReactNode;
}

const ClaimsTable = ({ 
  claims, 
  onViewDetails, 
  onProcessClaim, 
  getStatusBadge
}: ClaimsTableProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Medical Aid Claims ({claims.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                    <TableCell>{formatDate(claim.claimDate)}</TableCell>
                    <TableCell>
                      {claim.patientName}
                      <div className="text-xs text-gray-500">Order #{claim.orderNumber}</div>
                    </TableCell>
                    <TableCell>
                      {claim.medicalAidProvider}
                      <div className="text-xs text-gray-500">ID: {claim.medicalAidMemberId}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      {formatCurrency(claim.claimAmount)}
                      {claim.approvedAmount !== null && claim.approvedAmount !== claim.claimAmount && (
                        <div className="text-xs text-gray-500">
                          Approved: {formatCurrency(claim.approvedAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(claim)}
                        >
                          Details
                        </Button>
                        {claim.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => onProcessClaim(claim)}
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No claims found.
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

export default MedicalAidClaimsManager;