import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MedicalAidClaimsSubmission from "../components/patient/MedicalAidClaimsSubmission";
import ClaimsTracker from "../components/patient/ClaimsTracker";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function MedicalAidClaimsPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("tracker");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access medical aid claims</p>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Aid Claims</h1>
          <p className="text-gray-600 mt-2">
            Submit and track your medical aid claims with real-time processing updates
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Claims</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Approved</p>
                  <p className="text-2xl font-bold text-gray-900">$2,450</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Real-Time Provider Integration</h3>
                  <p className="text-sm text-gray-600">
                    Connected to 5 medical aid providers for instant claim processing
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="tracker" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Track Claims
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Submit New Claim
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracker">
            <ClaimsTracker />
          </TabsContent>

          <TabsContent value="submit">
            <MedicalAidClaimsSubmission />
          </TabsContent>
        </Tabs>

        {/* Provider Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Connected Medical Aid Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Discovery Health</h4>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <p className="text-sm text-gray-600">Real-time claim processing</p>
                <p className="text-xs text-gray-500 mt-1">Avg processing: 2-3 days</p>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Bonitas Medical Fund</h4>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <p className="text-sm text-gray-600">Direct API integration</p>
                <p className="text-xs text-gray-500 mt-1">Avg processing: 3-5 days</p>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Momentum Health</h4>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <p className="text-sm text-gray-600">Electronic submission</p>
                <p className="text-xs text-gray-500 mt-1">Avg processing: 1-4 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help with Claims?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Quick Tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Have your membership number ready</li>
                  <li>• Upload clear photos of prescriptions</li>
                  <li>• Include all supporting documents</li>
                  <li>• Track status in real-time</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Support:</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    View FAQ
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}