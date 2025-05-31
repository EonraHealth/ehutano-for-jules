import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle, 
  MapPin, 
  Star,
  Sparkles,
  Heart,
  Award,
  Target
} from 'lucide-react';
import { useLocation } from 'wouter';

interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  element?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;
  celebration?: boolean;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Pharmacy! 🎉',
    description: 'Hi there! I\'m excited to show you around your new digital workspace. Let\'s take a quick tour to help you feel right at home!',
    route: '/pharmacy-portal',
    position: 'center',
    celebration: true
  },
  {
    id: 'dashboard',
    title: 'Your Command Center',
    description: 'This is your main dashboard where you can see everything at a glance - orders, inventory alerts, and daily insights. Think of it as your pharmacy\'s heartbeat!',
    route: '/pharmacy-portal',
    position: 'center'
  },
  {
    id: 'orders',
    title: 'Managing Orders Made Easy',
    description: 'Here\'s where all customer orders flow in. You can track progress, update statuses, and ensure every customer gets their medicine on time. You\'re making a real difference!',
    route: '/pharmacy-portal',
    element: '[data-tour="orders-section"]',
    position: 'bottom'
  },
  {
    id: 'prescriptions',
    title: 'Digital Prescription Hub',
    description: 'Navigate to prescription management where you can process e-prescriptions, validate medications, and ensure patient safety. Your expertise shines here!',
    route: '/pharmacy-portal/prescriptions',
    position: 'center',
    action: 'Navigate to Prescriptions'
  },
  {
    id: 'ai-assistant',
    title: 'Meet Your AI Assistant! 🤖',
    description: 'This friendly blue chat button is your 24/7 helper! Ask questions about medications, get dosage information, or validate prescriptions. It\'s like having a knowledgeable colleague always ready to help.',
    route: '/pharmacy-portal/assistant',
    element: '[data-tour="ai-chat"]',
    position: 'left',
    action: 'Try the AI Assistant'
  },
  {
    id: 'inventory',
    title: 'Smart Inventory Control',
    description: 'Keep track of your medicine stock, get low-stock alerts, and manage batches efficiently. Never run out of what your patients need!',
    route: '/pharmacy-portal',
    element: '[data-tour="inventory-section"]',
    position: 'top'
  },
  {
    id: 'sales-billing',
    title: 'Point of Sale & Billing',
    description: 'Process sales, handle payments, and manage financial operations seamlessly. Everything you need for smooth transactions!',
    route: '/pharmacy-portal/sales-billing',
    position: 'center',
    action: 'Explore Sales & Billing'
  },
  {
    id: 'analytics',
    title: 'Insights & Analytics',
    description: 'Discover trends, track performance, and make data-driven decisions. Knowledge is power in pharmacy management!',
    route: '/pharmacy-portal/analytics',
    position: 'center',
    action: 'View Analytics'
  },
  {
    id: 'completion',
    title: 'You\'re All Set! 🌟',
    description: 'Congratulations! You\'ve completed the tour and are ready to make a positive impact on your community\'s health. Remember, help is always just a click away!',
    route: '/pharmacy-portal',
    position: 'center',
    celebration: true
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStepData = tourSteps[currentStep + 1];
      if (nextStepData.route && nextStepData.route !== step.route) {
        setLocation(nextStepData.route);
      }
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepData = tourSteps[currentStep - 1];
      if (prevStepData.route && prevStepData.route !== step.route) {
        setLocation(prevStepData.route);
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const navigateToRoute = () => {
    if (step.route) {
      setLocation(step.route);
    }
  };

  useEffect(() => {
    if (isOpen && step.route) {
      setLocation(step.route);
    }
  }, [isOpen, step.route, setLocation]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <DialogTitle className="text-lg font-semibold">
                Pharmacy Tour
              </DialogTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} of {tourSteps.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <CardContent className="p-0 space-y-6">
          {/* Step Content */}
          <div className="text-center space-y-4">
            {step.celebration && (
              <div className="flex justify-center space-x-2 text-2xl animate-bounce">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                <Heart className="h-6 w-6 text-red-500" />
                <Star className="h-6 w-6 text-blue-500" />
              </div>
            )}
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>

            {step.action && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.action}</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            {step.route && step.route !== window.location.pathname && (
              <Button
                variant="secondary"
                onClick={navigateToRoute}
                className="flex items-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>Go Here</span>
              </Button>
            )}

            <Button
              onClick={nextStep}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === tourSteps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete Tour</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Completion Badge */}
          {currentStep === tourSteps.length - 1 && (
            <div className="text-center space-y-3 pt-4 border-t">
              <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-4 py-2 rounded-full">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Tour Complete!</span>
              </div>
              <p className="text-xs text-gray-500">
                You can always restart this tour from the help menu
              </p>
            </div>
          )}
        </CardContent>
      </DialogContent>
    </Dialog>
  );
}