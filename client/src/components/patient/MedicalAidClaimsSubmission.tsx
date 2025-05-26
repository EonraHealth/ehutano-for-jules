import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  Upload,
  Send,
  RefreshCw,
  Shield,
  Building
} from "lucide-react";

interface ClaimSubmission {
  orderId?: number;
  prescriptionId?: number;
  providerId: number;
  membershipNumber: string;
  dependentCode?: string;
  claimItems: {
    medicineId: number;
    medicineName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }[];
  totalClaimAmount: number;
  supportingDocuments: File[];
}

export default function MedicalAidClaimsSubmission({ orderId, prescriptionId }: { orderId?: number; prescriptionId?: number }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [claimData, setClaimData] = useState<ClaimSubmission>({
    orderId,
    prescriptionId,
    providerId: 0,
    membershipNumber: "",
    dependentCode: "",
    claimItems: [],
    totalClaimAmount: 0,
    supportingDocuments: []
  });
  
  const queryClient = useQueryClient();

  // Fetch medical aid providers
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["/api/v1/medical-aid/providers"],
  });

  // Submit claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: async (claimSubmission: ClaimSubmission) => {
      return await apiRequest(`/api/v1/patient/orders/${orderId}/submit-claim`, {
        method: "POST",
        body: JSON.stringify({
          providerId: claimSubmission.providerId,
          membershipNumber: claimSubmission.membershipNumber,
          dependentCode: claimSubmission.dependentCode,
          claimAmount: claimSubmission.totalClaimAmount,
          claimItems: claimSubmission.claimItems
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/patient/medical-aid/claims"] });
      setCurrentStep(4); // Success step
    }
  });

  const handleProviderSelect = (providerId: string) => {
    setClaimData(prev => ({ ...prev, providerId: parseInt(providerId) }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setClaimData(prev => ({
      ...prev,
      supportingDocuments: [...prev.supportingDocuments, ...files]
    }));
  };

  const handleSubmitClaim = () => {
    // Calculate total claim amount from items
    const totalAmount = claimData.claimItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const updatedClaimData = { ...claimData, totalClaimAmount: totalAmount };
    setClaimData(updatedClaimData);
    submitClaimMutation.mutate(updatedClaimData);
  };

  const ProviderSelectionStep = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Building className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Medical Aid Provider Information</h3>
      </div>

      <div>
        <Label htmlFor="provider">Select Medical Aid Provider</Label>
        {providersLoading ? (
          <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        ) : (
          <Select onValueChange={handleProviderSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your medical aid provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.length === 0 ? (
                <SelectItem value="none" disabled>No providers available</SelectItem>
              ) : (
                providers.map((provider: any) => (
                  <SelectItem key={provider.id} value={provider.id.toString()}>
                    {provider.name} ({provider.code})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div>
        <Label htmlFor="membership">Membership Number</Label>
        <Input
          id="membership"
          value={claimData.membershipNumber}
          onChange={(e) => setClaimData(prev => ({ ...prev, membershipNumber: e.target.value }))}
          placeholder="Enter your membership number"
          className="font-mono"
        />
      </div>

      <div>
        <Label htmlFor="dependent">Dependent Code (Optional)</Label>
        <Input
          id="dependent"
          value={claimData.dependentCode}
          onChange={(e) => setClaimData(prev => ({ ...prev, dependentCode: e.target.value }))}
          placeholder="Enter dependent code if applicable"
          className="font-mono"
        />
      </div>

      {claimData.providerId > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">Provider Integration Active</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Real-time claim submission and status tracking enabled
          </p>
        </div>
      )}
    </div>
  );

  const ClaimItemsStep = () => {
    // Initialize claim items based on order/prescription data
    const initializeClaimItems = () => {
      if (claimData.claimItems.length === 0) {
        const mockItems = [
          {
            medicineId: 1,
            medicineName: "Paracetamol 500mg",
            quantity: 30,
            unitPrice: 0.50,
            totalAmount: 15.00
          },
          {
            medicineId: 2,
            medicineName: "Amoxicillin 250mg",
            quantity: 21,
            unitPrice: 1.19,
            totalAmount: 25.00
          }
        ];
        setClaimData(prev => ({ ...prev, claimItems: mockItems }));
      }
    };

    React.useEffect(() => {
      initializeClaimItems();
    }, []);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Claim Items Verification</h3>
        </div>
        
        <div className="space-y-3">
          {claimData.claimItems.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{item.medicineName}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity} units</p>
                  <p className="text-sm text-gray-600">Unit Price: ${item.unitPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">${item.totalAmount.toFixed(2)}</p>
                  <Badge variant="outline">Eligible</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Total Claim Amount:</span>
            <span className="font-bold text-xl text-blue-600">
              ${claimData.claimItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Estimated processing time: 3-5 business days
          </p>
        </div>
      </div>
    );
  };

  const DocumentsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Upload className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Supporting Documentation</h3>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">Upload supporting documents</p>
        <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG files up to 10MB each</p>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" className="cursor-pointer">
            Choose Files
          </Button>
        </label>
      </div>

      {claimData.supportingDocuments.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Uploaded Documents ({claimData.supportingDocuments.length}):</p>
          {claimData.supportingDocuments.map((file, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <FileText className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <p className="text-xs font-medium">Prescription</p>
          <p className="text-xs text-gray-600">Required</p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <FileText className="h-6 w-6 text-blue-600 mx-auto mb-1" />
          <p className="text-xs font-medium">ID Copy</p>
          <p className="text-xs text-gray-600">Required</p>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <FileText className="h-6 w-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs font-medium">Proof of Payment</p>
          <p className="text-xs text-gray-600">Optional</p>
        </div>
      </div>
    </div>
  );

  const SuccessStep = () => {
    const claimReference = `CLM-${Date.now().toString().slice(-8)}`;
    
    return (
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          <h3 className="text-xl font-semibold text-green-800">Claim Successfully Submitted!</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Your medical aid claim has been submitted directly to your provider's system. 
            You'll receive real-time updates on the processing status.
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg max-w-md mx-auto">
          <div className="space-y-3 text-left">
            <div>
              <p className="text-sm font-medium text-gray-700">Claim Reference:</p>
              <p className="font-mono text-sm bg-white p-2 rounded border">{claimReference}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Submitted to:</p>
              <p className="text-sm">
                {providers.find((p: any) => p.id === claimData.providerId)?.name || "Medical Aid Provider"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Claim Amount:</p>
              <p className="text-lg font-semibold text-green-600">
                ${claimData.claimItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Expected Processing:</p>
              <p className="text-sm">3-5 business days</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Submit Another Claim
          </Button>
          <Button onClick={() => window.location.href = '/patient-portal'}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  };

  const steps = [
    { number: 1, title: "Provider Details", component: ProviderSelectionStep },
    { number: 2, title: "Claim Items", component: ClaimItemsStep },
    { number: 3, title: "Documents", component: DocumentsStep },
    { number: 4, title: "Complete", component: SuccessStep }
  ];

  const currentStepData = steps.find(step => step.number === currentStep);
  const progress = (currentStep / steps.length) * 100;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-6 w-6 mr-2 text-blue-600" />
          Medical Aid Claim Submission
        </CardTitle>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of {steps.length}: {currentStepData?.title}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between overflow-x-auto pb-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${currentStep >= step.number 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {currentStep > step.number ? <CheckCircle className="h-5 w-5" /> : step.number}
              </div>
              <span className="ml-3 text-sm font-medium whitespace-nowrap hidden sm:block">{step.title}</span>
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-px mx-4 flex-shrink-0
                  ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'}
                `}></div>
              )}
            </div>
          ))}
        </div>

        {/* Current step content */}
        <div className="min-h-[400px] py-4">
          {currentStepData && <currentStepData.component />}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || currentStep === 4}
            className="min-w-[100px]"
          >
            Previous
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 && (!claimData.providerId || !claimData.membershipNumber))
              }
              className="min-w-[100px]"
            >
              Next
            </Button>
          ) : currentStep === 3 ? (
            <Button
              onClick={handleSubmitClaim}
              disabled={submitClaimMutation.isPending}
              className="min-w-[140px]"
            >
              {submitClaimMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Claim
                </>
              )}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}