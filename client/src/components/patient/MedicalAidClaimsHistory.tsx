import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle2, Clock, FileText, Ban } from 'lucide-react';

// Map of status codes to display properties
const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'NOT_APPLICABLE': { 
    label: 'Not Applicable',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FileText className="h-4 w-4" />
  },
  'PENDING_PATIENT_AUTH': { 
    label: 'Pending Your Authorization',
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

export default function MedicalAidClaimsHistory() {
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch medical aid claims
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['/api/v1/patient/medical-aid/claims'],
    enabled: true,
  });

  // View claim details
  const handleViewClaim = (claim: any) => {
    setSelectedClaim(claim);
    setIsViewDialogOpen(true);
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
          <CardTitle>Medical Aid Claims History</CardTitle>
          <CardDescription>
            View and track the status of your medical aid claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No claims yet</p>
              <p className="text-sm mt-1">
                You haven't submitted any medical aid claims yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim: any) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                    <TableCell>{formatDate(claim.claimDate)}</TableCell>
                    <TableCell>{claim.providerName}</TableCell>
                    <TableCell>{formatCurrency(claim.totalAmount)}</TableCell>
                    <TableCell>{renderStatusBadge(claim.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewClaim(claim)}
                      >
                        View Details
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
                <TabsTrigger value="status">Status & Timeline</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
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
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Patient Responsibility</h4>
                    <p className="text-base">{selectedClaim.patientResponsibility 
                      ? formatCurrency(selectedClaim.patientResponsibility) 
                      : 'Pending'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Current Status</h4>
                    <div className="mt-1">{renderStatusBadge(selectedClaim.status)}</div>
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
              
              <TabsContent value="status" className="space-y-4 pt-4">
                <div className="relative border-l-2 border-muted pl-6 pb-2 space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[30px] p-1 bg-primary text-primary-foreground rounded-full">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h4 className="text-base font-medium">Claim Created</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedClaim.claimDate)}</p>
                    <p className="text-sm mt-1">Claim #{selectedClaim.claimNumber} was submitted</p>
                  </div>
                  
                  {selectedClaim.status !== 'PENDING_PATIENT_AUTH' && (
                    <div className="relative">
                      <div className="absolute -left-[30px] p-1 bg-primary text-primary-foreground rounded-full">
                        <FileText className="h-4 w-4" />
                      </div>
                      <h4 className="text-base font-medium">Claim Submitted</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedClaim.lastUpdated)}</p>
                      <p className="text-sm mt-1">Submitted to {selectedClaim.providerName} for processing</p>
                    </div>
                  )}
                  
                  {selectedClaim.status === 'APPROVED' || selectedClaim.status === 'PAID' && (
                    <div className="relative">
                      <div className="absolute -left-[30px] p-1 bg-green-500 text-white rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h4 className="text-base font-medium">Claim Approved</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedClaim.lastUpdated)}</p>
                      <p className="text-sm mt-1">
                        Approved for {formatCurrency(selectedClaim.coveredAmount)} coverage
                        {selectedClaim.approvalCode && ` (Approval code: ${selectedClaim.approvalCode})`}
                      </p>
                    </div>
                  )}
                  
                  {selectedClaim.status === 'REJECTED' && (
                    <div className="relative">
                      <div className="absolute -left-[30px] p-1 bg-red-500 text-white rounded-full">
                        <Ban className="h-4 w-4" />
                      </div>
                      <h4 className="text-base font-medium">Claim Rejected</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedClaim.lastUpdated)}</p>
                      {selectedClaim.rejectionReason && (
                        <p className="text-sm mt-1">Reason: {selectedClaim.rejectionReason}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedClaim.status === 'PAID' && (
                    <div className="relative">
                      <div className="absolute -left-[30px] p-1 bg-green-500 text-white rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <h4 className="text-base font-medium">Payment Processed</h4>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedClaim.lastUpdated)}</p>
                      <p className="text-sm mt-1">
                        Payment of {formatCurrency(selectedClaim.coveredAmount)} was processed
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4 pt-4">
                {!selectedClaim.attachments || selectedClaim.attachments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-base">No documents attached</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedClaim.attachments.map((attachment: string, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span>Document {index + 1}</span>
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}