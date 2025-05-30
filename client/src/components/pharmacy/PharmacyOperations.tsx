import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FileText, Scan, Truck, Shield } from "lucide-react";
import OrderProcessing from "./OrderProcessing";
import PrescriptionManagement from "./PrescriptionManagement";
import EfficientDispensingWorkflow from "./EfficientDispensingWorkflow";

import MedicalAidClaimsManager from "./MedicalAidClaimsManager";

export default function PharmacyOperations() {
  const [activeSubTab, setActiveSubTab] = useState("orders");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pharmacy Operations</CardTitle>
          <CardDescription>
            Manage daily pharmacy operations from order processing to dispensing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Prescriptions</span>
              </TabsTrigger>
              <TabsTrigger value="dispensing" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                <span className="hidden sm:inline">Dispensing</span>
              </TabsTrigger>
              <TabsTrigger value="claims" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Medical Aid</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <OrderProcessing />
            </TabsContent>

            <TabsContent value="prescriptions">
              <PrescriptionManagement />
            </TabsContent>

            <TabsContent value="dispensing">
              <EfficientDispensingWorkflow />
            </TabsContent>

            <TabsContent value="claims">
              <MedicalAidClaimsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}