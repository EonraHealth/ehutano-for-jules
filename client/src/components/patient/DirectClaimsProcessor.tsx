import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  CreditCard, 
  Shield,
  Timer,
  DollarSign,
  FileCheck,
  Loader2
} from "lucide-react";

interface DirectClaimsProcessorProps {
  orderId?: number;
  prescriptionId?: number;
  totalAmount: number;
  items: any[];
}

export function DirectClaimsProcessor({ 
  orderId, 
  prescriptionId, 
  totalAmount, 
  items 
}: DirectClaimsProcessorProps) {
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [membershipNumber, setMembershipNumber] = useState("");
  const [dependentCode, setDependentCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch medical aid providers
  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['/api/v1/medical-aid/providers'],
  });

  // Direct claim submission mutation
  const submitClaimMutation = useMutation({
    mutationFn: async (claimData: any) => {
      const startTime = Date.now();
      const response = await apiRequest('/api/v1/medical-aid/submit-direct-claim', {
        method: 'POST',
        body: JSON.stringify(claimData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setProcessingTime(Date.now() - startTime);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Claim Submitted Successfully!" : "Claim Submission Notice",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/v1/patient/medical-aid/claims'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit medical aid claim. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Membership validation mutation
  const validateMembershipMutation = useMutation({
    mutationFn: async (validationData: any) => {
      return await apiRequest('/api/v1/medical-aid/validate-membership', {
        method: 'POST',
        body: JSON.stringify(validationData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.valid) {
        toast({
          title: "Membership Validated",
          description: "Your medical aid membership is active and valid.",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: data.message,
          variant: "destructive"
        });
      }
    }
  });

  const handleValidateMembership = async () => {
    if (!selectedProvider || !membershipNumber) return;
    
    setIsValidating(true);
    await validateMembershipMutation.mutateAsync({
      providerId: selectedProvider,
      membershipNumber,
      dependentCode
    });
    setIsValidating(false);
  };

  const handleSubmitDirectClaim = async () => {
    if (!selectedProvider || !membershipNumber) {
      toast({
        title: "Missing Information",
        description: "Please select a medical aid provider and enter your membership number.",
        variant: "destructive"
      });
      return;
    }

    const claimData = {
      providerId: selectedProvider,
      orderId,
      prescriptionId,
      membershipNumber,
      dependentCode,
      totalAmount,
      benefitType: 'PHARMACY',
      serviceDate: new Date().toISOString(),
      items: items.map(item => ({
        medicineId: item.id,
        medicineName: item.name,
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.price || '0'),
        totalPrice: parseFloat(item.price || '0') * (item.quantity || 1),
        nappiCode: item.nappiCode,
        dosage: item.dosage
      }))
    };

    await submitClaimMutation.mutateAsync(claimData);
  };

  const selectedProviderData = providers.find((p: any) => p.id === selectedProvider);
  const supportsDirectClaims = selectedProviderData?.supportsDirectClaims;

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Direct Medical Aid Claims Processing
          </CardTitle>
          <CardDescription>
            Submit claims directly to your medical aid provider for instant processing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label htmlFor="provider">Select Medical Aid Provider</Label>
            <Select 
              value={selectedProvider?.toString()} 
              onValueChange={(value) => setSelectedProvider(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your medical aid provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider: any) => (
                  <SelectItem key={provider.id} value={provider.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{provider.name}</span>
                      {provider.supportsDirectClaims && (
                        <Badge variant="secondary" className="ml-2">
                          <Zap className="h-3 w-3 mr-1" />
                          Direct
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProviderData && (
              <div className="flex items-center gap-2 text-sm">
                {supportsDirectClaims ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">Supports real-time direct claims processing</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-700">Manual processing required (24-48 hours)</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Membership Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="membership">Membership Number</Label>
              <Input
                id="membership"
                placeholder="Enter your membership number"
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependent">Dependent Code (Optional)</Label>
              <Input
                id="dependent"
                placeholder="e.g., 01, 02"
                value={dependentCode}
                onChange={(e) => setDependentCode(e.target.value)}
              />
            </div>
          </div>

          {/* Validation Button */}
          {selectedProvider && membershipNumber && (
            <Button 
              variant="outline" 
              onClick={handleValidateMembership}
              disabled={isValidating || validateMembershipMutation.isPending}
              className="w-full"
            >
              {isValidating || validateMembershipMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Validate Membership
            </Button>
          )}

          {/* Validation Results */}
          {validationResult && (
            <Card className={`border ${validationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${validationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {validationResult.message}
                  </span>
                </div>
                
                {validationResult.valid && validationResult.benefits && (
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Annual Limit:</span>
                      <span className="ml-2 font-medium">R{validationResult.benefits.annualLimit?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining:</span>
                      <span className="ml-2 font-medium">R{validationResult.benefits.remainingBenefit?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Claim Summary */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Claim Summary
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">R{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Number of Items:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              {validationResult?.benefits && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Expected Co-payment ({validationResult.benefits.copaymentPercentage}%):</span>
                  <span>R{(totalAmount * (validationResult.benefits.copaymentPercentage / 100)).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitDirectClaim}
            disabled={!selectedProvider || !membershipNumber || submitClaimMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {submitClaimMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : supportsDirectClaims ? (
              <Zap className="h-4 w-4 mr-2" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            {supportsDirectClaims ? 'Submit Direct Claim' : 'Submit for Manual Processing'}
          </Button>

          {/* Processing Time Display */}
          {processingTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Timer className="h-4 w-4" />
              <span>Processed in {processingTime}ms</span>
            </div>
          )}

          {/* Benefits Information */}
          {supportsDirectClaims && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h5 className="font-medium text-blue-800 mb-2">Direct Processing Benefits</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Instant claim approval for eligible amounts</li>
                  <li>• Real-time benefit verification</li>
                  <li>• Immediate payment authorization</li>
                  <li>• Reduced waiting time for medication collection</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}