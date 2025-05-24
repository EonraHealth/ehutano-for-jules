import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Prescription, PrescriptionStatus } from '@/types';

const Prescriptions = () => {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: prescriptions, isLoading, error } = useQuery<Prescription[]>({
    queryKey: ['/api/v1/patient/prescriptions'],
  });

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status: PrescriptionStatus) => {
    switch(status) {
      case 'QUOTE_READY':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Quote Ready</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case 'FILLED':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Filled</Badge>;
      case 'PENDING_REVIEW':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Pending Review</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Prescriptions</h3>
          <Link href="/patient-portal/upload-prescription">
            <Button variant="link" className="text-primary-600 hover:text-primary-700">Upload New</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-500">Error loading prescriptions. Please try again.</p>
          </div>
        ) : prescriptions && prescriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((prescription) => (
              <div 
                key={prescription.id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {prescription.doctorNameManual || (prescription.doctorId ? 'Dr. from system' : 'Uploaded Prescription')}
                    </h4>
                    <p className="text-xs text-gray-500">Issued: {formatDate(prescription.dateIssued)}</p>
                  </div>
                  {getStatusBadge(prescription.status)}
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {prescription.items && prescription.items.length > 0
                    ? `Medications: ${prescription.items.map(item => item.medicineNameManual || 'Unknown').join(', ')}`
                    : 'Medications details in uploaded document'}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <Button 
                    variant="link" 
                    className="text-xs text-primary-600 hover:text-primary-700 p-0"
                    onClick={() => handleViewDetails(prescription)}
                  >
                    View Details
                  </Button>
                  {prescription.status === 'QUOTE_READY' && (
                    <Link href={`/patient-portal/prescriptions/${prescription.id}/order`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Order Now
                      </Button>
                    </Link>
                  )}
                  {prescription.status === 'ACTIVE' && prescription.refillsLeft > 0 && (
                    <Link href={`/patient-portal/prescriptions/${prescription.id}/refill`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Refill ({prescription.refillsLeft} left)
                      </Button>
                    </Link>
                  )}
                  {(prescription.status === 'FILLED' || prescription.status === 'EXPIRED' || prescription.status === 'CANCELLED') && (
                    <Button variant="outline" size="sm" className="text-xs text-gray-400 bg-gray-50" disabled>
                      {prescription.status === 'FILLED' ? 'Completed' : prescription.status.toLowerCase()}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">You don't have any prescriptions yet</p>
            <Link href="/patient-portal/upload-prescription">
              <Button>Upload Prescription</Button>
            </Link>
          </div>
        )}
      </CardContent>

      {/* Prescription Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              Issued on {selectedPrescription && formatDate(selectedPrescription.dateIssued)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Doctor</h4>
                <p className="text-sm text-gray-500">
                  {selectedPrescription.doctorNameManual || 'System Doctor ID: ' + selectedPrescription.doctorId}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium">Status</h4>
                <div className="mt-1">
                  {getStatusBadge(selectedPrescription.status)}
                </div>
              </div>
              
              {selectedPrescription.refillsLeft > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Refills Remaining</h4>
                  <p className="text-sm text-gray-500">{selectedPrescription.refillsLeft}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium">Medications</h4>
                {selectedPrescription.items && selectedPrescription.items.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-1">
                    {selectedPrescription.items.map((item, index) => (
                      <li key={index}>
                        {item.medicineNameManual || 'Unknown'} - {item.dosage} 
                        {item.instructions && <span className="text-xs text-gray-500 ml-1">({item.instructions})</span>}
                      </li>
                    ))}
                  </ul>
                ) : selectedPrescription.uploadUrl ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">Prescription uploaded as document</p>
                    <a 
                      href={selectedPrescription.uploadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm underline"
                    >
                      View uploaded prescription
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No medication details available</p>
                )}
              </div>
              
              {selectedPrescription.notesPatient && (
                <div>
                  <h4 className="text-sm font-medium">Notes</h4>
                  <p className="text-sm text-gray-500">{selectedPrescription.notesPatient}</p>
                </div>
              )}
              
              {selectedPrescription.isQuoteReady && selectedPrescription.quoteDetailsJson && (
                <div>
                  <h4 className="text-sm font-medium">Quote</h4>
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Quote Ready</p>
                    <p className="text-xs text-blue-600 mt-1">A pharmacy has prepared a quote for your prescription</p>
                    <div className="mt-2">
                      <Link href={`/patient-portal/prescriptions/${selectedPrescription.id}/quote`}>
                        <Button size="sm" className="w-full">View Quote</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
            {selectedPrescription && selectedPrescription.status === 'ACTIVE' && selectedPrescription.refillsLeft > 0 && (
              <Link href={`/patient-portal/prescriptions/${selectedPrescription.id}/refill`}>
                <Button>Request Refill</Button>
              </Link>
            )}
            {selectedPrescription && selectedPrescription.status === 'QUOTE_READY' && (
              <Link href={`/patient-portal/prescriptions/${selectedPrescription.id}/order`}>
                <Button>Order Now</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Prescriptions;
