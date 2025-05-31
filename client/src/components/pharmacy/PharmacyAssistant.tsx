import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Sparkles
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PrescriptionValidation {
  isValid: boolean;
  issues?: string[];
  suggestions?: string[];
}

const PharmacyAssistant = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch quick response suggestions
  const { data: quickResponses = [] } = useQuery<string[]>({
    queryKey: ['/api/v1/pharmacy/assistant/quick-responses'],
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('/api/v1/pharmacy/assistant/chat', 'POST', {
        message,
        conversationHistory: messages.slice(-10) // Send last 10 messages for context
      });
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
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Prescription validation mutation
  const validatePrescriptionMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest('/api/v1/pharmacy/assistant/validate-prescription', 'POST', { 
        prescriptionText: text 
      });
    },
    onError: (error) => {
      toast({
        title: 'Validation Error',
        description: error instanceof Error ? error.message : 'Failed to validate prescription',
        variant: 'destructive',
      });
    },
  });

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

  const handleValidatePrescription = () => {
    if (!prescriptionText.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter prescription text to validate',
        variant: 'destructive',
      });
      return;
    }
    validatePrescriptionMutation.mutate(prescriptionText);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const validation = validatePrescriptionMutation.data as PrescriptionValidation | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="h-6 w-6 mr-2 text-blue-600" />
            AI Pharmacy Assistant
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-4">
            <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Validate Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Prescription Validation</DialogTitle>
                  <DialogDescription>
                    Paste prescription text to check for potential issues and compliance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Prescription Text</label>
                    <Textarea
                      value={prescriptionText}
                      onChange={(e) => setPrescriptionText(e.target.value)}
                      placeholder="Paste prescription text here..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleValidatePrescription}
                    disabled={validatePrescriptionMutation.isPending}
                    className="w-full"
                  >
                    {validatePrescriptionMutation.isPending ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Validate Prescription
                      </>
                    )}
                  </Button>

                  {validation && (
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center">
                        {validation.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        )}
                        <span className={`font-medium ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                          {validation.isValid ? 'Prescription appears valid' : 'Issues found in prescription'}
                        </span>
                      </div>

                      {validation.issues && validation.issues.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Issues Found:</h4>
                          <ul className="space-y-1">
                            {validation.issues.map((issue, index) => (
                              <li key={index} className="text-sm text-red-600 flex items-start">
                                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validation.suggestions && validation.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-700 mb-2">Suggestions:</h4>
                          <ul className="space-y-1">
                            {validation.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm text-blue-600 flex items-start">
                                <Lightbulb className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={clearChat}>
              Clear Chat
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Quick Responses */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickResponses.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full text-left justify-start h-auto p-3 text-xs"
                onClick={() => handleQuickResponse(suggestion)}
              >
                <Lightbulb className="h-3 w-3 mr-2 flex-shrink-0" />
                {suggestion}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Chat with AI Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <ScrollArea className="h-96 w-full border rounded-md p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Start a conversation with the AI pharmacy assistant</p>
                  <p className="text-sm mt-2">Ask about medicines, interactions, dosages, or use quick questions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                          {message.role === 'user' ? (
                            <User className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Bot className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                          <div className={`text-xs mt-1 opacity-70`}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="flex mr-2">
                        <Bot className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about medicines, interactions, dosages..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                disabled={chatMutation.isPending}
              />
              <Button 
                onClick={() => sendMessage(inputMessage)}
                disabled={chatMutation.isPending || !inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              This AI assistant provides general guidance. Always verify critical information with official sources.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyAssistant;