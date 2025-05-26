import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  DollarSign,
  RefreshCw,
  Eye,
  Download,
  Phone
} from "lucide-react";

export default function ClaimsTracker() {
  const { data: claims = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/v1/patient/medical-aid/claims"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 25;
      case 'processing':
        return 50;
      case 'under_review':
        return 75;
      case 'approved':
      case 'rejected':
        return 100;
      default:
        return 10;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Medical Aid Claims Status
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Claims Yet</h3>
              <p className="text-gray-500 mb-4">You haven't submitted any medical aid claims.</p>
              <Button>Submit Your First Claim</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim: any) => (
                <Card key={claim.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">Claim #{claim.claimNumber}</h4>
                          <Badge className={getStatusColor(claim.status)}>
                            {getStatusIcon(claim.status)}
                            <span className="ml-1 capitalize">{claim.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Provider: {claim.providerName || 'Medical Aid Provider'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(claim.claimDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">${claim.claimAmount?.toFixed(2) || '0.00'}</p>
                        {claim.approvedAmount && (
                          <p className="text-sm text-green-600">
                            Approved: ${claim.approvedAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{getProgressValue(claim.status)}%</span>
                      </div>
                      <Progress value={getProgressValue(claim.status)} className="h-2" />
                    </div>

                    {/* Status Timeline */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-4 text-xs">
                        <div className={`flex items-center space-x-1 ${
                          ['submitted', 'processing', 'under_review', 'approved', 'rejected'].includes(claim.status.toLowerCase()) 
                            ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          <span>Submitted</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          ['processing', 'under_review', 'approved', 'rejected'].includes(claim.status.toLowerCase()) 
                            ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          <span>Processing</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          ['under_review', 'approved', 'rejected'].includes(claim.status.toLowerCase()) 
                            ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          <span>Review</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          ['approved', 'rejected'].includes(claim.status.toLowerCase()) 
                            ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          <span>Complete</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {claim.processingNotes && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Provider Note:</strong> {claim.processingNotes}
                        </p>
                      </div>
                    )}

                    {claim.status.toLowerCase() === 'rejected' && claim.rejectionReason && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {claim.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      
                      {claim.status.toLowerCase() === 'approved' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download Receipt
                        </Button>
                      )}
                      
                      {claim.status.toLowerCase() === 'rejected' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Resubmit
                        </Button>
                      )}

                      <Button variant="outline" size="sm">
                        <Phone className="h-3 w-3 mr-1" />
                        Contact Provider
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claims Summary */}
      {claims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Claims Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {claims.length}
                </p>
                <p className="text-sm text-gray-600">Total Claims</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {claims.filter((c: any) => c.status.toLowerCase() === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {claims.filter((c: any) => ['pending', 'processing', 'under_review'].includes(c.status.toLowerCase())).length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  ${claims.reduce((sum: number, claim: any) => sum + (claim.approvedAmount || 0), 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Total Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}