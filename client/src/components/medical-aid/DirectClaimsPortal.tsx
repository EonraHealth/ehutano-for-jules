import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Activity,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Send,
  Zap
} from 'lucide-react';

interface MedicalAidProvider {
  id: number;
  name: string;
  code: string;
  supportsDirectClaims: boolean;
  apiEndpoint?: string;
  averageProcessingTime: number;
  successRate: number;
}

interface DirectClaim {
  id: number;
  claimNumber: string;
  patientName: string;
  membershipNumber: string;
  providerName: string;
  totalAmount: number;
  coveredAmount?: number;
  patientResponsibility?: number;
  status: string;
  submissionDate: string;
  processingTime?: number;
  authorizationNumber?: string;
  items: Array<{
    medicineName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function DirectClaimsPortal() {
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<DirectClaim | null>(null);
  const [formData, setFormData] = useState({
    providerId: '',
    membershipNumber: '',
    dependentCode: '',
    benefitType: '',
    totalAmount: '',
    diagnosisCode: '',
    treatmentCode: ''
  });
  const { toast } = useToast();

  // Fetch medical aid providers
  const { data: providers = [] } = useQuery<MedicalAidProvider[]>({
    queryKey: ['/api/v1/medical-aid/providers'],
    staleTime: 300000
  });

  // Fetch patient claims using the working endpoint pattern
  const { data: claims = [], isLoading } = useQuery<DirectClaim[]>({
    queryKey: ['/api/v1/patient/medical-aid/claims'],
    staleTime: 30000
  });

  // Submit direct claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/api/v1/medical-aid/submit-direct-claim', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/patient/medical-aid/claims'] });
      toast({
        title: "Direct Claim Submitted Successfully!",
        description: `Your claim has been processed instantly. Claim ID: ${response.claimId}`,
        variant: "default",
      });
      setIsSubmissionDialogOpen(false);
      setFormData({
        providerId: '',
        membershipNumber: '',
        dependentCode: '',
        benefitType: '',
        totalAmount: '',
        diagnosisCode: '',
        treatmentCode: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit direct claim",
        variant: "destructive",
      });
    }
  });

  // Validate membership mutation
  const validateMembershipMutation = useMutation({
    mutationFn: (data: { providerId: number; membershipNumber: string; dependentCode?: string }) =>
      apiRequest('/api/v1/medical-aid/validate-membership', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: (response) => {
      toast({
        title: response.valid ? "✓ Membership Validated" : "✗ Invalid Membership",
        description: response.message,
        variant: response.valid ? "default" : "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'PARTIAL_APPROVAL':
        return <Badge className="bg-blue-100 text-blue-800"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>;
      case 'PENDING_DOCUMENTATION':
        return <Badge className="bg-orange-100 text-orange-800"><FileText className="w-3 h-3 mr-1" />Pending Docs</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesProvider = selectedProvider === 'all' || claim.providerName === selectedProvider;
    const matchesStatus = selectedStatus === 'all' || claim.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProvider && matchesStatus && matchesSearch;
  });

  const getClaimStats = () => {
    const total = claims.length;
    const approved = claims.filter(c => c.status === 'APPROVED').length;
    const processing = claims.filter(c => c.status === 'PROCESSING').length;
    const rejected = claims.filter(c => c.status === 'REJECTED').length;
    const totalValue = claims.reduce((sum, c) => sum + c.totalAmount, 0);
    const coveredValue = claims.reduce((sum, c) => sum + (c.coveredAmount || 0), 0);

    return { total, approved, processing, rejected, totalValue, coveredValue };
  };

  const stats = getClaimStats();

  const handleSubmit = () => {
    if (!formData.providerId || !formData.membershipNumber || !formData.benefitType || !formData.totalAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      patientId: 1, // In real app, get from user context
      providerId: parseInt(formData.providerId),
      membershipNumber: formData.membershipNumber,
      dependentCode: formData.dependentCode || undefined,
      totalAmount: parseFloat(formData.totalAmount),
      benefitType: formData.benefitType,
      diagnosisCode: formData.diagnosisCode || undefined,
      treatmentCode: formData.treatmentCode || undefined,
      serviceDate: new Date(),
      items: [
        {
          medicineId: 1,
          medicineName: "Sample Medicine",
          quantity: 1,
          unitPrice: parseFloat(formData.totalAmount),
          totalPrice: parseFloat(formData.totalAmount),
          nappiCode: "123456"
        }
      ]
    };

    submitClaimMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading direct claims...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-xs text-gray-500">{stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% success rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">ZW${stats.totalValue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Covered: ZW${stats.coveredValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Claims Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Direct Claims Processing
              </CardTitle>
              <CardDescription>
                Real-time claims processing with Zimbabwe medical aid providers
              </CardDescription>
            </div>
            <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Direct Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Direct Claim</DialogTitle>
                  <DialogDescription>
                    Submit a new claim for instant processing with Zimbabwe medical aid providers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="providerId">Medical Aid Provider *</Label>
                      <Select value={formData.providerId} onValueChange={(value) => setFormData({...formData, providerId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.filter(p => p.supportsDirectClaims).map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.name} ({provider.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="membershipNumber">Membership Number *</Label>
                      <Input
                        id="membershipNumber"
                        placeholder="Enter membership number"
                        value={formData.membershipNumber}
                        onChange={(e) => setFormData({...formData, membershipNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="benefitType">Benefit Type *</Label>
                      <Select value={formData.benefitType} onValueChange={(value) => setFormData({...formData, benefitType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select benefit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHRONIC_MEDICATION">Chronic Medication</SelectItem>
                          <SelectItem value="ACUTE_MEDICATION">Acute Medication</SelectItem>
                          <SelectItem value="OVER_THE_COUNTER">Over the Counter</SelectItem>
                          <SelectItem value="CONSULTATION">Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="totalAmount">Total Amount (ZW$) *</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dependentCode">Dependent Code</Label>
                      <Input
                        id="dependentCode"
                        placeholder="Optional dependent code"
                        value={formData.dependentCode}
                        onChange={(e) => setFormData({...formData, dependentCode: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="diagnosisCode">Diagnosis Code (ICD-10)</Label>
                      <Input
                        id="diagnosisCode"
                        placeholder="Optional diagnosis code"
                        value={formData.diagnosisCode}
                        onChange={(e) => setFormData({...formData, diagnosisCode: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (formData.providerId && formData.membershipNumber) {
                          validateMembershipMutation.mutate({
                            providerId: parseInt(formData.providerId),
                            membershipNumber: formData.membershipNumber,
                            dependentCode: formData.dependentCode || undefined
                          });
                        } else {
                          toast({
                            title: "Missing Information",
                            description: "Please select provider and enter membership number",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={validateMembershipMutation.isPending}
                    >
                      {validateMembershipMutation.isPending ? 'Validating...' : 'Validate Membership'}
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={submitClaimMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitClaimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by claim number, patient name, or membership..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.name}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="PARTIAL_APPROVAL">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Claims Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.patientName}</p>
                        <p className="text-sm text-gray-500">{claim.membershipNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>{claim.providerName}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">ZW${claim.totalAmount.toFixed(2)}</p>
                        {claim.coveredAmount && (
                          <p className="text-sm text-green-600">Covered: ZW${claim.coveredAmount.toFixed(2)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      {claim.processingTime ? `${claim.processingTime}ms` : 'Instant'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClaims.length === 0 && (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No direct claims found</h3>
              <p className="text-gray-500">Submit your first direct claim for instant processing.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim Details Dialog */}
      {selectedClaim && (
        <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Claim Details - {selectedClaim.claimNumber}</DialogTitle>
              <DialogDescription>
                Complete information for this direct claim submission
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient Information</Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><strong>Name:</strong> {selectedClaim.patientName}</p>
                    <p className="text-sm"><strong>Membership:</strong> {selectedClaim.membershipNumber}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Claim Information</Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><strong>Provider:</strong> {selectedClaim.providerName}</p>
                    <p className="text-sm"><strong>Status:</strong> {getStatusBadge(selectedClaim.status)}</p>
                    {selectedClaim.authorizationNumber && (
                      <p className="text-sm"><strong>Authorization:</strong> {selectedClaim.authorizationNumber}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Financial Summary</Label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-semibold">ZW${selectedClaim.totalAmount.toFixed(2)}</p>
                  </div>
                  {selectedClaim.coveredAmount && (
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-sm text-gray-600">Covered Amount</p>
                      <p className="text-lg font-semibold text-green-600">ZW${selectedClaim.coveredAmount.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedClaim.patientResponsibility && (
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <p className="text-sm text-gray-600">Patient Responsibility</p>
                      <p className="text-lg font-semibold text-orange-600">ZW${selectedClaim.patientResponsibility.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Claim Items</Label>
                <div className="mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedClaim.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.medicineName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>ZW${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>ZW${item.totalPrice.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}