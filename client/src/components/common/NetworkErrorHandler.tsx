import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatus {
  online: boolean;
  lastChecked: Date;
  retryCount: number;
}

const NetworkErrorHandler = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    lastChecked: new Date(),
    retryCount: 0
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        online: true,
        lastChecked: new Date(),
        retryCount: 0
      }));
      
      toast({
        title: 'Connection Restored',
        description: 'You are back online. The application will resume normal operation.',
        variant: 'default',
      });
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        online: false,
        lastChecked: new Date()
      }));
      
      toast({
        title: 'Connection Lost',
        description: 'Check your internet connection. Some features may be limited.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const testConnection = async () => {
    setIsRetrying(true);
    
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setNetworkStatus(prev => ({
          ...prev,
          online: true,
          lastChecked: new Date(),
          retryCount: 0
        }));
        
        toast({
          title: 'Connection Test Successful',
          description: 'Your connection to the server is working properly.',
          variant: 'default',
        });
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      setNetworkStatus(prev => ({
        ...prev,
        online: false,
        lastChecked: new Date(),
        retryCount: prev.retryCount + 1
      }));
      
      toast({
        title: 'Connection Test Failed',
        description: error instanceof Error ? error.message : 'Unable to reach the server.',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  if (networkStatus.online) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <Alert className="border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800">
              You are currently offline. Some features may not work properly.
              {networkStatus.retryCount > 0 && ` (Retry attempts: ${networkStatus.retryCount})`}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={isRetrying}
              className="ml-4"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Test Connection
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default NetworkErrorHandler;