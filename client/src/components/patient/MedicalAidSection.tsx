import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';

// Medical aid form schema
const medicalAidSchema = z.object({
  medicalAidProvider: z.string().min(1, 'Medical aid provider is required'),
  medicalAidMemberId: z.string().min(1, 'Member ID is required'),
});

type MedicalAidFormValues = z.infer<typeof medicalAidSchema>;

export default function MedicalAidSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch patient profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/v1/patient/profile'],
    enabled: true,
  });

  // Fetch medical aid providers
  const { data: providers = [] } = useQuery({
    queryKey: ['/api/v1/medical-aid/providers'],
    enabled: true,
  });

  // Setup form with default values from profile data
  const form = useForm<MedicalAidFormValues>({
    resolver: zodResolver(medicalAidSchema),
    defaultValues: {
      medicalAidProvider: profileData?.medicalAidProvider || '',
      medicalAidMemberId: profileData?.medicalAidMemberId || '',
    },
    values: {
      medicalAidProvider: profileData?.medicalAidProvider || '',
      medicalAidMemberId: profileData?.medicalAidMemberId || '',
    },
  });

  // Update medical aid info mutation
  const updateMutation = useMutation({
    mutationFn: async (data: MedicalAidFormValues) => {
      return await apiRequest('/api/v1/patient/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Medical aid information updated',
        description: 'Your medical aid information has been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/patient/profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update medical aid information',
        variant: 'destructive',
      });
    },
  });

  // Verify medical aid mutation
  const verifyMutation = useMutation({
    mutationFn: async (data: MedicalAidFormValues) => {
      setIsVerifying(true);
      return await apiRequest('/api/v1/patient/verify-medical-aid', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Medical aid verified',
        description: 'Your medical aid information has been successfully verified',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/patient/profile'] });
      setIsVerifying(false);
    },
    onError: (error) => {
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Failed to verify medical aid information',
        variant: 'destructive',
      });
      setIsVerifying(false);
    },
  });

  // Submit handler
  const onSubmit = (values: MedicalAidFormValues) => {
    updateMutation.mutate(values);
  };

  // Verify handler
  const onVerify = () => {
    const values = form.getValues();
    verifyMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Medical Aid Information
          {profileData?.medicalAidVerified ? (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
              <ShieldCheck className="h-4 w-4" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
              <ShieldX className="h-4 w-4" />
              Not Verified
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Update your medical aid information to enable direct claims processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="medicalAidProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Aid Provider</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your medical aid provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map((provider: any) => (
                        <SelectItem key={provider.id} value={provider.code}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your medical aid provider from the list
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalAidMemberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your member ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your medical aid membership ID as shown on your card
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onVerify}
                disabled={updateMutation.isPending || verifyMutation.isPending || isVerifying}
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Medical Aid
              </Button>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4 text-sm text-muted-foreground">
        <p>Last updated: {profileData?.updatedAt ? new Date(profileData.updatedAt).toLocaleString() : 'Never'}</p>
      </CardFooter>
    </Card>
  );
}