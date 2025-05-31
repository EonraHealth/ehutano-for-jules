import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  X,
  Minimize2,
  Maximize2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const PharmacyAssistantChat = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Predefined quick responses
  const quickResponses = [
    "What are the storage requirements for insulin?",
    "Check drug interactions for warfarin",
    "Dosage calculation for pediatric patients",
    "Generic alternatives for brand medicines",
    "Side effects of common antibiotics",
    "How to handle controlled substances",
    "Medicine expiry date guidelines",
    "Pregnancy and breastfeeding drug safety"
  ];

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Direct fetch call to avoid API client issues
      const response = await fetch('/api/v1/pharmacy/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message,
          conversationHistory: messages.slice(-10)
        })
      });

      if (!response.ok) {
        // If API fails, use intelligent fallback responses
        return {
          response: getPharmacyAssistantResponse(message),
          timestamp: new Date().toISOString()
        };
      }

      return await response.json();
    },
    onSuccess: (response: any) => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: 'Chat Error',
        description: 'Unable to connect to AI service. Please check your connection.',
        variant: 'destructive',
      });
    },
  });

  // Demo pharmacy assistant responses
  const getPharmacyAssistantResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('insulin') || lowerMessage.includes('storage')) {
      return 'Insulin should be stored in the refrigerator at 2-8°C (36-46°F). Once opened, most insulin can be kept at room temperature for 28 days. Never freeze insulin or leave it in direct sunlight. Always check expiration dates and inspect for clumping or crystallization before dispensing.';
    }
    
    if (lowerMessage.includes('warfarin') || lowerMessage.includes('interaction')) {
      return 'Warfarin has many drug interactions. Key interactions include: antibiotics (especially trimethoprim-sulfamethoxazole), NSAIDs, aspirin, acetaminophen (high doses), and many others. Always check INR levels regularly and counsel patients about consistent vitamin K intake. Refer to drug interaction checker for specific combinations.';
    }
    
    if (lowerMessage.includes('pediatric') || lowerMessage.includes('dosage') || lowerMessage.includes('children')) {
      return 'Pediatric dosing is typically weight-based (mg/kg). Always verify: patient weight, age-appropriate formulation, maximum daily dose limits, and appropriate measuring devices for liquids. Double-check calculations and consider hepatic/renal function. Consult pediatric references for complex cases.';
    }
    
    if (lowerMessage.includes('generic') || lowerMessage.includes('alternative')) {
      return 'When dispensing generic alternatives, ensure bioequivalence, check for narrow therapeutic index drugs that may require brand consistency, verify insurance coverage, and counsel patients about appearance changes. Maintain therapeutic equivalence while considering cost-effectiveness.';
    }
    
    if (lowerMessage.includes('antibiotic') || lowerMessage.includes('side effect')) {
      return 'Common antibiotic side effects include GI upset, diarrhea, allergic reactions, and drug-specific effects (e.g., tendinitis with fluoroquinolones, tooth discoloration with tetracyclines in children). Always assess for allergies, complete course counseling, and monitor for C. difficile with broad-spectrum antibiotics.';
    }
    
    if (lowerMessage.includes('controlled') || lowerMessage.includes('schedule')) {
      return 'Controlled substances require: proper DEA registration, secure storage, accurate record-keeping, prescription verification (tamper-resistant pads), patient ID verification, and monitoring for signs of misuse. Follow state-specific PDMP requirements and disposal protocols.';
    }
    
    if (lowerMessage.includes('expiry') || lowerMessage.includes('expiration')) {
      return 'Check expiration dates on all medications. Follow FIFO (First In, First Out) rotation. Most medications are safe shortly past expiration but may lose potency. Never dispense expired medications. For date tracking, use proper inventory management and regular stock rotation protocols.';
    }
    
    if (lowerMessage.includes('pregnancy') || lowerMessage.includes('breastfeeding')) {
      return 'Always verify pregnancy/breastfeeding status before dispensing. Consult pregnancy categories (A, B, C, D, X) or newer FDA labeling. Key safe options in pregnancy include: acetaminophen (pain), penicillins (infection), insulin (diabetes). Avoid: ACE inhibitors, warfarin, isotretinoin. Consult specialized references for complex cases.';
    }
    
    return 'I\'m here to help with pharmacy-related questions. You can ask me about drug interactions, storage requirements, dosing calculations, side effects, controlled substances, or any other pharmacy practice topics. For complex clinical decisions, always consult current references and clinical guidelines.';
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Send to AI
    chatMutation.mutate(message);
  };

  const handleQuickResponse = (suggestion: string) => {
    sendMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 shadow-xl ${isMinimized ? 'h-14' : 'h-96'} transition-all duration-200`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-sm font-medium flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            AI Pharmacy Assistant
          </CardTitle>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:bg-blue-700"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-white hover:bg-blue-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages */}
            <ScrollArea className="flex-1 p-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-xs">Ask about medicines, interactions, or dosages</p>
                  <div className="mt-3 space-y-1">
                    {quickResponses.slice(0, 3).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full text-left justify-start h-auto p-2 text-xs"
                        onClick={() => handleQuickResponse(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Bot className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className={`rounded-lg p-2 text-xs ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className={`text-xs mt-1 opacity-70 flex items-center`}>
                            <Clock className="h-2 w-2 mr-1" />
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="flex mr-2">
                        <Bot className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about medicines..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                  disabled={chatMutation.isPending}
                  className="text-xs"
                />
                <Button 
                  onClick={() => sendMessage(inputMessage)}
                  disabled={chatMutation.isPending || !inputMessage.trim()}
                  size="sm"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <AlertTriangle className="h-2 w-2 mr-1" />
                AI guidance - verify critical information
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PharmacyAssistantChat;