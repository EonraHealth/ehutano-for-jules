import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch, Package } from "lucide-react";
import InventoryManagement from "./InventoryManagement";
import StockInventoryManagement from "./StockInventoryManagement";

export default function PharmacyInventory() {
  const [activeSubTab, setActiveSubTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Complete inventory control with real-time tracking and stock management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <PackageSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Inventory Overview</span>
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Stock Management</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <InventoryManagement />
            </TabsContent>

            <TabsContent value="stock">
              <StockInventoryManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}