import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard } from "lucide-react";
import BillingFinancialIntegration from "./BillingFinancialIntegration";

export default function PharmacyFinancial() {
  const [activeSubTab, setActiveSubTab] = useState("billing");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Management</CardTitle>
          <CardDescription>
            Complete financial operations including POS, billing, and payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="grid grid-cols-1 w-full mb-6">
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">POS & Billing System</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="billing">
              <BillingFinancialIntegration />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}