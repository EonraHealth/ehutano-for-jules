import { useState, useEffect } from 'react';
import { HelpCircle, X, Lightbulb, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface HelpContent {
  id: string;
  title: string;
  description: string;
  steps: string[];
  troubleshooting?: string[];
  relatedTopics?: string[];
  urgency: 'low' | 'medium' | 'high';
}

const helpDatabase: Record<string, HelpContent[]> = {
  '/pharmacy-portal': [
    {
      id: 'pharmacy-overview',
      title: 'Pharmacy Management Dashboard',
      description: 'Your central hub for managing all pharmacy operations.',
      steps: [
        'View real-time inventory levels and alerts',
        'Track prescription orders and their status',
        'Monitor medical aid claims processing',
        'Access pharmacy analytics and reports'
      ],
      urgency: 'low'
    },
    {
      id: 'inventory-management',
      title: 'Managing Your Inventory',
      description: 'Keep track of medicine stock levels and expiration dates.',
      steps: [
        'Navigate to the Inventory tab',
        'Review stock levels and alerts',
        'Update quantities when receiving new stock',
        'Set reorder points for automatic alerts'
      ],
      troubleshooting: [
        'If stock levels seem incorrect, verify recent deliveries',
        'Check for expired medications that need removal',
        'Ensure all staff are properly updating inventory'
      ],
      urgency: 'medium'
    }
  ],
  '/pharmacy-portal/operations': [
    {
      id: 'dispensing-workflow',
      title: 'Efficient Dispensing Process',
      description: 'Streamline your prescription dispensing workflow.',
      steps: [
        'Verify patient identity and prescription validity',
        'Check for drug interactions and allergies',
        'Confirm insurance coverage and co-payments',
        'Dispense medication with proper labeling'
      ],
      troubleshooting: [
        'If prescription validation fails, contact the prescribing doctor',
        'For insurance issues, verify patient coverage details',
        'Double-check dosage calculations for pediatric patients'
      ],
      urgency: 'high'
    }
  ],
  '/pharmacy-portal/assistant': [
    {
      id: 'ai-assistant-usage',
      title: 'Using the AI Pharmacy Assistant',
      description: 'Get instant help with drug information and pharmacy questions.',
      steps: [
        'Click the blue chat button in the bottom-right corner',
        'Ask questions about drug interactions, storage, or dosing',
        'Use quick response buttons for common queries',
        'Review AI responses and verify critical information'
      ],
      troubleshooting: [
        'Always verify AI recommendations with official sources',
        'For complex clinical decisions, consult additional references',
        'Contact technical support if the assistant is not responding'
      ],
      urgency: 'medium'
    }
  ]
};

const ContextualHelp = () => {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHelp, setSelectedHelp] = useState<HelpContent | null>(null);
  const [hasSeenHelp, setHasSeenHelp] = useState<Set<string>>(new Set());

  const relevantHelp = helpDatabase[location] || [];
  const urgentHelp = relevantHelp.filter(help => help.urgency === 'high');

  useEffect(() => {
    // Show urgent help automatically for new users
    if (urgentHelp.length > 0 && !hasSeenHelp.has(urgentHelp[0].id)) {
      setSelectedHelp(urgentHelp[0]);
      setIsOpen(true);
    }
  }, [location, urgentHelp, hasSeenHelp]);

  const markAsRead = (helpId: string) => {
    setHasSeenHelp(prev => new Set([...Array.from(prev), helpId]));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return AlertTriangle;
      case 'medium': return Lightbulb;
      case 'low': return CheckCircle;
      default: return HelpCircle;
    }
  };

  if (relevantHelp.length === 0) {
    return null;
  }

  return (
    <>
      {/* Help Trigger Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          variant="outline"
          className="rounded-full h-12 w-12 shadow-lg bg-white hover:bg-blue-50 border-blue-200"
        >
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </Button>
      </div>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
          <div className="fixed right-4 top-4 bottom-4 w-96 bg-white rounded-lg shadow-xl border">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Contextual Help</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 h-full overflow-y-auto">
              {selectedHelp ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{selectedHelp.title}</CardTitle>
                      <Badge className={getUrgencyColor(selectedHelp.urgency)}>
                        {selectedHelp.urgency}
                      </Badge>
                    </div>
                    <CardDescription>{selectedHelp.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Steps:</h4>
                      <ol className="space-y-1">
                        {selectedHelp.steps.map((step, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="font-medium text-blue-600 mr-2">{index + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {selectedHelp.troubleshooting && (
                      <div>
                        <h4 className="font-medium mb-2 text-orange-600">Troubleshooting:</h4>
                        <ul className="space-y-1">
                          {selectedHelp.troubleshooting.map((tip, index) => (
                            <li key={index} className="flex items-start text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          markAsRead(selectedHelp.id);
                          setSelectedHelp(null);
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        Got it
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedHelp(null)}
                        size="sm"
                      >
                        Back
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-medium">Available Help Topics</h3>
                  {relevantHelp.map((help) => {
                    const UrgencyIcon = getUrgencyIcon(help.urgency);
                    const isNew = !hasSeenHelp.has(help.id);
                    
                    return (
                      <Card
                        key={help.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          isNew ? 'ring-2 ring-blue-200' : ''
                        }`}
                        onClick={() => setSelectedHelp(help)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <UrgencyIcon className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-sm">{help.title}</span>
                              {isNew && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{help.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextualHelp;