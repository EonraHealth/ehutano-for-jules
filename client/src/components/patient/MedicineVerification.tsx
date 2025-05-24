import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationStatus } from '@/types';

const MedicineVerification = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: VerificationStatus;
    medicineName?: string;
    batchNumber?: string;
    expiryDate?: string;
    pharmacySource?: string;
    wholesaleSource?: string;
    manufacturer?: string;
    isAntibiotic?: boolean;
    message: string;
  } | null>(null);

  const openScanner = () => {
    setIsScanning(true);
    // In a real implementation, this would open the device camera
    // For now, we'll simulate scanning with a timeout
    setTimeout(() => {
      simulateScan();
    }, 2000);
  };

  const simulateScan = () => {
    // This is a placeholder for the actual QR scanner implementation
    // In a real app, this would process camera input and extract QR code data
    const mockScanData = "EHUTANO-MED-" + Math.floor(Math.random() * 1000);
    verifyMedicine(mockScanData);
  };

  const verifyMedicine = async (scannedData: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to verify medicines",
        variant: "destructive",
      });
      setIsScanning(false);
      return;
    }

    try {
      setIsVerifying(true);
      const response = await apiRequest('POST', '/api/v1/patient/verify-medicine', { scannedData });
      const result = await response.json();
      
      setVerificationResult(result);

      // Show toast based on verification result
      if (result.status === 'VERIFIED') {
        toast({
          title: "Verification Successful",
          description: "This medicine is genuine and safe to use.",
          variant: "default",
        });
      } else if (result.status === 'EXPIRED') {
        toast({
          title: "Medicine Expired",
          description: "Warning: This medicine has expired and should not be used.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "This medicine could not be verified. Please contact your pharmacy.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Medicine verification error:', error);
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying the medicine. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setIsVerifying(false);
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Medicine Verification</h3>
          <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700">Learn More</a>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-purple-50 rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="bg-purple-100 rounded-full p-3 mb-3">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-sm font-medium text-purple-700 mb-1">Scan QR Code</h4>
            <p className="text-xs text-purple-600 text-center">Use your phone to scan the QR code on the medicine packaging</p>
          </div>
          <div className="flex-1 bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="bg-blue-100 rounded-full p-3 mb-3">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="text-sm font-medium text-blue-700 mb-1">Verify Authenticity</h4>
            <p className="text-xs text-blue-600 text-center">Our system will check if the medicine is genuine and not expired</p>
          </div>
          <div className="flex-1 bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="bg-green-100 rounded-full p-3 mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-sm font-medium text-green-700 mb-1">Get Results</h4>
            <p className="text-xs text-green-600 text-center">See detailed information about the medicine and its authenticity</p>
          </div>
        </div>

        {verificationResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            verificationResult.status === 'VERIFIED' 
              ? 'bg-green-50 border border-green-200' 
              : verificationResult.status === 'EXPIRED' 
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                {verificationResult.status === 'VERIFIED' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : verificationResult.status === 'EXPIRED' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  verificationResult.status === 'VERIFIED' 
                    ? 'text-green-800' 
                    : verificationResult.status === 'EXPIRED' 
                      ? 'text-yellow-800'
                      : 'text-red-800'
                }`}>
                  {verificationResult.status === 'VERIFIED' 
                    ? 'Verification Successful' 
                    : verificationResult.status === 'EXPIRED' 
                      ? 'Medicine Expired'
                      : 'Verification Failed'}
                </h3>
                <div className="mt-2 text-sm text-gray-700">
                  <p className="mb-1">{verificationResult.message}</p>
                  {verificationResult.medicineName && (
                    <p className="mb-1"><span className="font-medium">Medicine:</span> {verificationResult.medicineName}</p>
                  )}
                  {verificationResult.manufacturer && (
                    <p className="mb-1"><span className="font-medium">Manufacturer:</span> {verificationResult.manufacturer}</p>
                  )}
                  {verificationResult.batchNumber && (
                    <p className="mb-1"><span className="font-medium">Batch Number:</span> {verificationResult.batchNumber}</p>
                  )}
                  {verificationResult.expiryDate && (
                    <p className="mb-1"><span className="font-medium">Expiry Date:</span> {new Date(verificationResult.expiryDate).toLocaleDateString()}</p>
                  )}
                  {verificationResult.pharmacySource && (
                    <p className="mb-1"><span className="font-medium">Pharmacy Source:</span> {verificationResult.pharmacySource}</p>
                  )}
                  {verificationResult.wholesaleSource && (
                    <p className="mb-1"><span className="font-medium">Wholesale Source:</span> {verificationResult.wholesaleSource}</p>
                  )}
                  {verificationResult.isAntibiotic && (
                    <p className="mb-1"><span className="font-medium text-purple-600">Antibiotic:</span> Yes - requires prescription</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button
            className="w-full"
            onClick={openScanner}
            disabled={isScanning || isVerifying}
          >
            {isScanning || isVerifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isScanning ? 'Scanning...' : 'Verifying...'}
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                <span>Open Scanner</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicineVerification;
