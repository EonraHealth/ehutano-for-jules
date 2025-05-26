import { useState } from 'react';
import DirectClaimsPortal from '@/components/medical-aid/DirectClaimsPortal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  Clock, 
  CheckCircle, 
  Building2,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';

export default function MedicalAidClaimsPage() {
  const [activeTab, setActiveTab] = useState('direct-claims');

  // Zimbabwe Medical Aid Providers
  const providers = [
    {
      name: "CIMAS Medical Aid",
      code: "CIMAS",
      status: "Active",
      processingTime: "2-3 seconds",
      successRate: 97.5,
      supportsDirectClaims: true,
      members: "450,000+"
    },
    {
      name: "PSMAS Medical Aid", 
      code: "PSMAS",
      status: "Active",
      processingTime: "1-2 seconds",
      successRate: 96.8,
      supportsDirectClaims: true,
      members: "320,000+"
    },
    {
      name: "Premier Service Medical Aid",
      code: "PSMI",
      status: "Active", 
      processingTime: "3-5 seconds",
      successRate: 94.2,
      supportsDirectClaims: true,
      members: "180,000+"
    },
    {
      name: "First Mutual Medical Aid",
      code: "FAMAS",
      status: "Active",
      processingTime: "2-4 seconds", 
      successRate: 95.7,
      supportsDirectClaims: true,
      members: "220,000+"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical Aid Integration</h1>
              <p className="text-gray-600">Direct claims processing with Zimbabwe medical aid providers</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Real-Time Processing</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">Instant</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Success Rate</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">96.1%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Active Providers</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">4</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Total Members</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">1.2M+</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="direct-claims" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Direct Claims
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Provider Network
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct-claims">
            <DirectClaimsPortal />
          </TabsContent>

          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Zimbabwe Medical Aid Provider Network
                </CardTitle>
                <CardDescription>
                  Integrated medical aid providers supporting direct claims processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {providers.map((provider, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{provider.name}</h3>
                            <p className="text-sm text-gray-600">Code: {provider.code}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {provider.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Members:</span>
                            <span className="text-sm font-medium">{provider.members}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Processing Time:</span>
                            <span className="text-sm font-medium">{provider.processingTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Success Rate:</span>
                            <span className="text-sm font-medium text-green-600">{provider.successRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Direct Claims:</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              <Zap className="h-3 w-3 mr-1" />
                              Supported
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Processing Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Processing Time</span>
                      <span className="text-lg font-semibold">2.3 seconds</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Claims Processed Today</span>
                      <span className="text-lg font-semibold">847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Auto-Approval Rate</span>
                      <span className="text-lg font-semibold text-green-600">89.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Manual Review Required</span>
                      <span className="text-lg font-semibold text-orange-600">6.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Claims Value (Today)</span>
                      <span className="text-lg font-semibold">ZW$45,678.90</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Amount Covered</span>
                      <span className="text-lg font-semibold text-green-600">ZW$36,543.12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Patient Responsibility</span>
                      <span className="text-lg font-semibold text-orange-600">ZW$9,135.78</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Coverage Percentage</span>
                      <span className="text-lg font-semibold">80.0%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}