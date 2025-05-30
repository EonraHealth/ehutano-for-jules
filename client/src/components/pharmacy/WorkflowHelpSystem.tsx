import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Users, 
  Pill, 
  Package, 
  CreditCard,
  FileText,
  Shield,
  Clock,
  Search
} from "lucide-react";

interface WorkflowHelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkflow?: string;
}

const workflowGuides = {
  "walk-in-customer": {
    title: "Walk-in Customer Workflow",
    icon: <Users className="h-5 w-5" />,
    steps: [
      {
        title: "1. Customer Information",
        description: "Capture complete customer details including medical aid information",
        details: [
          "Select appropriate salutation (Mr, Mrs, Dr, Prof, etc.)",
          "Enter first name, middle name (optional), and last name",
          "Collect ID number for verification",
          "Record phone number and email address",
          "Note medical aid provider and membership number if applicable"
        ],
        tips: "Always verify ID number format and ensure medical aid details are accurate for claim processing."
      },
      {
        title: "2. Prescription Entry",
        description: "Add medicines to the prescription using the search system",
        details: [
          "Type medicine name in the search field",
          "Press Enter to open the medicine search popup",
          "Select the correct medicine from authentic Zimbabwe database",
          "Verify dosage and pack size automatically filled",
          "Enter prescribed quantity and instructions",
          "Use abbreviation interpreter for complex instructions"
        ],
        tips: "Use the Enter key to quickly access the large search popup. Medicine prices are automatically calculated based on pack size."
      },
      {
        title: "3. Medical Aid Processing",
        description: "Process medical aid claims if applicable",
        details: [
          "Verify medical aid membership details",
          "Check benefit limits and coverage",
          "Submit direct claim if supported",
          "Calculate patient responsibility amount",
          "Generate authorization codes"
        ],
        tips: "Always validate membership before dispensing. Keep authorization codes for record keeping."
      },
      {
        title: "4. Payment Processing",
        description: "Complete payment and finalize transaction",
        details: [
          "Review total amount including dispensing fee",
          "Select payment method (Cash, Card, Mobile Money, Medical Aid)",
          "Process payment through appropriate channel",
          "Generate receipt and medication labels",
          "Provide patient counseling"
        ],
        tips: "Dispensing fee is adjustable and defaults to $1. Always provide medication counseling."
      }
    ]
  },
  "prescription-dispensing": {
    title: "Prescription Dispensing Workflow",
    icon: <Pill className="h-5 w-5" />,
    steps: [
      {
        title: "1. Prescription Selection",
        description: "Choose prescription from pending queue",
        details: [
          "Review prescription priority (LOW, MEDIUM, HIGH, URGENT)",
          "Check patient information and doctor details",
          "Verify prescription date and validity",
          "Note any special instructions or alerts"
        ],
        tips: "Process urgent prescriptions first. Always verify prescription authenticity."
      },
      {
        title: "2. Medicine Verification",
        description: "Verify each medicine item against prescription",
        details: [
          "Scan barcode or manually verify medicine",
          "Check expiry dates and batch numbers",
          "Confirm prescribed quantities",
          "Verify dosage forms and strengths",
          "Note any substitutions required"
        ],
        tips: "Use FEFO (First-Expiry, First-Out) for batch selection. Document any substitutions."
      },
      {
        title: "3. Quality Control",
        description: "Perform final quality checks",
        details: [
          "Double-check medicine selections",
          "Verify quantities against prescription",
          "Confirm patient counseling points",
          "Check for drug interactions",
          "Ensure proper labeling"
        ],
        tips: "Never skip quality control steps. Patient safety is paramount."
      },
      {
        title: "4. Completion",
        description: "Finalize dispensing and documentation",
        details: [
          "Generate medication labels",
          "Update inventory levels",
          "Record dispensing in system",
          "Provide patient counseling",
          "Archive completed prescription"
        ],
        tips: "Keep detailed records for audit purposes. Provide clear usage instructions."
      }
    ]
  },
  "inventory-management": {
    title: "Inventory Management Workflow",
    icon: <Package className="h-5 w-5" />,
    steps: [
      {
        title: "1. Stock Monitoring",
        description: "Monitor stock levels and alerts",
        details: [
          "Check low stock alerts daily",
          "Review expiry date notifications",
          "Monitor fast-moving items",
          "Track seasonal demand patterns"
        ],
        tips: "Set reorder points based on lead times and average consumption."
      },
      {
        title: "2. Stock Adjustments",
        description: "Process stock adjustments and corrections",
        details: [
          "Record damaged or expired items",
          "Process returns and exchanges",
          "Update quantities after physical counts",
          "Document adjustment reasons"
        ],
        tips: "Always document reasons for adjustments. Maintain audit trail."
      },
      {
        title: "3. Batch Management",
        description: "Manage batch numbers and expiry tracking",
        details: [
          "Record batch numbers for all incoming stock",
          "Implement FEFO rotation system",
          "Monitor expiry date compliance",
          "Segregate near-expiry items"
        ],
        tips: "Regular expiry date checks prevent wastage and ensure patient safety."
      }
    ]
  },
  "medical-aid-claims": {
    title: "Medical Aid Claims Workflow",
    icon: <Shield className="h-5 w-5" />,
    steps: [
      {
        title: "1. Eligibility Verification",
        description: "Verify patient medical aid eligibility",
        details: [
          "Check membership status",
          "Verify dependent information",
          "Confirm benefit limits",
          "Check prior authorizations"
        ],
        tips: "Always verify eligibility before dispensing to avoid claim rejections."
      },
      {
        title: "2. Claim Submission",
        description: "Submit direct claims to medical aid providers",
        details: [
          "Prepare claim documentation",
          "Submit electronic claims",
          "Track claim status",
          "Follow up on pending claims"
        ],
        tips: "Submit claims promptly to ensure timely reimbursement."
      },
      {
        title: "3. Claim Resolution",
        description: "Handle claim responses and appeals",
        details: [
          "Process approved claims",
          "Handle rejected claims",
          "Submit appeals when necessary",
          "Update patient records"
        ],
        tips: "Keep detailed records for claim appeals and audits."
      }
    ]
  }
};

const quickHelp = [
  {
    title: "Medicine Search",
    icon: <Search className="h-4 w-4" />,
    description: "Press Enter in medicine name field to open large search popup",
    shortcut: "Enter"
  },
  {
    title: "Barcode Scanning",
    icon: <Package className="h-4 w-4" />,
    description: "Use barcode scanner or manual entry for medicine verification",
    shortcut: "Ctrl+B"
  },
  {
    title: "Quick Payment",
    icon: <CreditCard className="h-4 w-4" />,
    description: "Press F2 to quickly access payment processing",
    shortcut: "F2"
  },
  {
    title: "Print Labels",
    icon: <FileText className="h-4 w-4" />,
    description: "Press Ctrl+P to print medication labels",
    shortcut: "Ctrl+P"
  }
];

export function WorkflowHelpSystem({ isOpen, onClose, currentWorkflow = "walk-in-customer" }: WorkflowHelpSystemProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState(currentWorkflow);
  const workflow = workflowGuides[selectedWorkflow as keyof typeof workflowGuides];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-blue-700 flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Pharmacy Workflow Guidance
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={selectedWorkflow} onValueChange={setSelectedWorkflow} className="h-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="walk-in-customer" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              Walk-in
            </TabsTrigger>
            <TabsTrigger value="prescription-dispensing" className="text-xs">
              <Pill className="h-4 w-4 mr-1" />
              Dispensing
            </TabsTrigger>
            <TabsTrigger value="inventory-management" className="text-xs">
              <Package className="h-4 w-4 mr-1" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="medical-aid-claims" className="text-xs">
              <Shield className="h-4 w-4 mr-1" />
              Claims
            </TabsTrigger>
          </TabsList>

          {Object.entries(workflowGuides).map(([key, guide]) => (
            <TabsContent key={key} value={key} className="h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  {guide.icon}
                  <h2 className="text-lg font-semibold">{guide.title}</h2>
                </div>

                <div className="grid gap-4">
                  {guide.steps.map((step, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                            {index + 1}
                          </div>
                          {step.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2">Steps:</h4>
                            <ul className="space-y-1">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h5 className="font-medium text-sm text-yellow-800">Pro Tip:</h5>
                                <p className="text-sm text-yellow-700">{step.tips}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Help Section */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-500" />
                      Quick Help & Shortcuts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quickHelp.map((help, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {help.icon}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{help.title}</h5>
                            <p className="text-xs text-gray-600">{help.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {help.shortcut}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Help
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}