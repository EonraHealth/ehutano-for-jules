import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, Clock, FileText, Ban, Search } from 'lucide-react';

// Map of status codes to display properties
const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'NOT_APPLICABLE': { 
    label: 'Not Applicable',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FileText className="h-4 w-4" />
  },
  'PENDING_PATIENT_AUTH': { 
    label: 'Pending Patient Auth',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="h-4 w-4" />
  },
  'CLAIM_SUBMITTED': { 
    label: 'Claim Submitted',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <FileText className="h-4 w-4" />
  },
  'PENDING_APPROVAL': { 
    label: 'Pending Approval',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Clock className="h-4 w-4" />
  },
  'AWAITING_INFORMATION': { 
    label: 'Awaiting Information',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <AlertCircle className="h-4 w-4" />
  },
  'UNDER_REVIEW': { 
    label: 'Under Review',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: <FileText className="h-4 w-4" />
  },
  'APPROVED': { 
    label: 'Approved',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  'RECEIVED': { 
    label: 'Received',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  'PAID': { 
    label: 'Paid',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  'REJECTED': { 
    label: 'Rejected',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: <Ban className="h-4 w-4" />
  },
  'APPEALED': { 
    label: 'Appealed',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <FileText className="h-4 w-4" />
  }
};

export default function MedicalAidClaimsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [searchClaimNumber, setSearchClaimNumber] = useState('');
  const [updateFormData, setUpdateFormData] = useState({
    status: '',
    coveredAmount: '',
    rejectionReason: '',
    approvalCode: '',
    notes: ''
  });
  
  // Fetch all pending medical aid claims
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['/api/v1/pharmacy/medical-aid/claims'],
    enabled: true,
  });

  // View claim details
  const handleViewClaim = (claim: any) => {
    setSelectedClaim(claim);
    setIsViewDialogOpen(true);
  };

  // Open update claim dialog
  const handleOpenUpdateDialog = (claim: any) => {
    setSelectedClaim(claim);
    setUpdateFormData({
      status: claim.status,
      coveredAmount: claim.coveredAmount ? String(claim.coveredAmount) : '',
      rejectionReason: claim.rejectionReason || '',
      approvalCode: claim.approvalCode || '',
      notes: claim.notes || ''
    });
    setIsUpdateDialogOpen(true);
  };

  // Handle input change for update form
  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select change for update form
  const handleStatusChange = (value: string) => {
    setUpdateFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  // Update claim status mutation
  const updateMutation = useMutation({
    mutationFn: async (claimId: number) => {
      return await apiRequest(`/api/v1/pharmacy/medical-aid/claims/${claimId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: updateFormData.status,
          coveredAmount: updateFormData.coveredAmount ? parseFloat(updateFormData.coveredAmount) : undefined,
          rejectionReason: updateFormData.rejectionReason || undefined,
          approvalCode: updateFormData.approvalCode || undefined,
          notes: updateFormData.notes || undefined
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Claim updated',
        description: 'The claim status has been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/pharmacy/medical-aid/claims'] });
      setIsUpdateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update claim',
        variant: 'destructive',
      });
    },
  });

  // Submit update form
  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    
    // Validation
    if (!updateFormData.status) {
      toast({
        title: 'Missing information',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }
    
    // If status is APPROVED or PAID, coveredAmount is required
    if ((updateFormData.status === 'APPROVED' || updateFormData.status === 'PAID') && !updateFormData.coveredAmount) {
      toast({
        title: 'Missing information',
        description: 'Please enter the covered amount',
        variant: 'destructive',
      });
      return;
    }
    
    // If status is REJECTED, rejectionReason is required
    if (updateFormData.status === 'REJECTED' && !updateFormData.rejectionReason) {
      toast({
        title: 'Missing information',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }
    
    updateMutation.mutate(selectedClaim.id);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusInfo = statusMap[status] || statusMap.NOT_APPLICABLE;
    
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  // Filter claims based on search
  const filteredClaims = searchClaimNumber
    ? claims.filter((claim: any) => claim.claimNumber.includes(searchClaimNumber))
    : claims;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Medical Aid Claims Management</CardTitle>
          <CardDescription>
            Process and track medical aid claims for patient orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by claim number..."
                className="pl-8"
                value={searchClaimNumber}
                onChange={(e) => setSearchClaimNumber(e.target.value)}
              />
            </div>
          </div>

          {filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No claims found</p>
              <p className="text-sm mt-1">
                {searchClaimNumber ? 'No claims match your search criteria' : 'There are no pending medical aid claims to process'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim: any) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                    <TableCell>{formatDate(claim.claimDate)}</TableCell>
                    <TableCell>{claim.patientName}</TableCell>
                    <TableCell>{claim.providerName}</TableCell>
                    <TableCell>{formatCurrency(claim.totalAmount)}</TableCell>
                    <TableCell>{renderStatusBadge(claim.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewClaim(claim)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleOpenUpdateDialog(claim)}
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Claim Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              Claim #{selectedClaim?.claimNumber} - Submitted on {selectedClaim && formatDate(selectedClaim.claimDate)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Claim Details</TabsTrigger>
                <TabsTrigger value="patient">Patient Info</TabsTrigger>
                <TabsTrigger value="order">Order Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Medical Aid Provider</h4>
                    <p className="text-base">{selectedClaim.providerName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Membership Number</h4>
                    <p className="text-base">{selectedClaim.membershipNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h4>
                    <p className="text-base font-medium">{formatCurrency(selectedClaim.totalAmount)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Covered Amount</h4>
                    <p className="text-base">{selectedClaim.coveredAmount 
                      ? formatCurrency(selectedClaim.coveredAmount) 
                      : 'Pending'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Current Status</h4>
                    <div className="mt-1">{renderStatusBadge(selectedClaim.status)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                    <p className="text-base">{formatDate(selectedClaim.lastUpdated)}</p>
                  </div>
                </div>

                {selectedClaim.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                    <p className="text-sm p-3 bg-muted rounded-md">{selectedClaim.notes}</p>
                  </div>
                )}

                {selectedClaim.rejectionReason && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Rejection Reason</h4>
                    <p className="text-sm p-3 bg-red-50 text-red-700 rounded-md">{selectedClaim.rejectionReason}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="patient" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Patient Name</h4>
                    <p className="text-base">{selectedClaim.patientName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                    <p className="text-base">{selectedClaim.patientEmail}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                    <p className="text-base">{selectedClaim.patientPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Medical Aid Member ID</h4>
                    <p className="text-base">{selectedClaim.membershipNumber}</p>
                  </div>
                  {selectedClaim.dependentCode && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Dependent Code</h4>
                      <p className="text-base">{selectedClaim.dependentCode}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="order" className="space-y-4 pt-4">
                {selectedClaim.orderId ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Order Number</h4>
                        <p className="text-base">{selectedClaim.orderNumber}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Order Date</h4>
                        <p className="text-base">{formatDate(selectedClaim.orderDate)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Order Status</h4>
                        <p className="text-base">{selectedClaim.orderStatus}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Order Total</h4>
                        <p className="text-base font-medium">{formatCurrency(selectedClaim.totalAmount)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Order Items</h4>
                      {selectedClaim.orderItems?.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedClaim.orderItems.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.medicineName}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{formatCurrency(item.pricePerUnit)}</TableCell>
                                <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">No detailed order items available</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No order information available for this claim</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Claim Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Claim Status</DialogTitle>
            <DialogDescription>
              Update the status for claim #{selectedClaim?.claimNumber}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitUpdate}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="status">Claim Status</Label>
                <Select
                  value={updateFormData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLAIM_SUBMITTED">Claim Submitted</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="AWAITING_INFORMATION">Awaiting Information</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(updateFormData.status === 'APPROVED' || updateFormData.status === 'PAID') && (
                <div className="space-y-2">
                  <Label htmlFor="coveredAmount">Covered Amount (ZWL)</Label>
                  <Input
                    id="coveredAmount"
                    name="coveredAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={updateFormData.coveredAmount}
                    onChange={handleUpdateInputChange}
                  />
                </div>
              )}
              
              {updateFormData.status === 'APPROVED' && (
                <div className="space-y-2">
                  <Label htmlFor="approvalCode">Approval Code</Label>
                  <Input
                    id="approvalCode"
                    name="approvalCode"
                    placeholder="Enter approval code"
                    value={updateFormData.approvalCode}
                    onChange={handleUpdateInputChange}
                  />
                </div>
              )}
              
              {updateFormData.status === 'REJECTED' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">Rejection Reason</Label>
                  <Textarea
                    id="rejectionReason"
                    name="rejectionReason"
                    placeholder="Provide reason for rejection"
                    value={updateFormData.rejectionReason}
                    onChange={handleUpdateInputChange}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any notes or comments"
                  value={updateFormData.notes}
                  onChange={handleUpdateInputChange}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline" 
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Claim
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}