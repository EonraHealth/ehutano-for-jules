import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  hasTimedOut: boolean;
  canRetry: boolean;
}

interface IntelligentLoaderProps {
  isLoading: boolean;
  loadingMessage?: string;
  timeout?: number;
  onRetry?: () => void;
  children?: React.ReactNode;
  showProgress?: boolean;
  estimatedDuration?: number;
}

const IntelligentLoader = ({
  isLoading,
  loadingMessage = "Loading...",
  timeout = 30000,
  onRetry,
  children,
  showProgress = false,
  estimatedDuration = 5000
}: IntelligentLoaderProps) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: loadingMessage,
    hasTimedOut: false,
    canRetry: !!onRetry
  });

  useEffect(() => {
    if (isLoading) {
      setLoadingState({
        isLoading: true,
        progress: 0,
        message: loadingMessage,
        hasTimedOut: false,
        canRetry: !!onRetry
      });

      // Progress simulation if enabled
      let progressInterval: NodeJS.Timeout;
      if (showProgress) {
        progressInterval = setInterval(() => {
          setLoadingState(prev => ({
            ...prev,
            progress: Math.min((prev.progress || 0) + Math.random() * 15, 90)
          }));
        }, 200);
      }

      // Timeout handling
      const timeoutId = setTimeout(() => {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          hasTimedOut: true,
          message: "Loading is taking longer than expected"
        }));
        clearInterval(progressInterval);
      }, timeout);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
      };
    } else {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        hasTimedOut: false
      }));
    }
  }, [isLoading, loadingMessage, timeout, onRetry, showProgress]);

  if (!isLoading && !loadingState.hasTimedOut) {
    return <>{children}</>;
  }

  if (loadingState.hasTimedOut) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-lg text-orange-900">Loading Timeout</CardTitle>
          <CardDescription>
            {loadingState.message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            This might be due to a slow connection or server issues.
          </p>
          
          {loadingState.canRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
        <CardTitle className="text-lg text-blue-900">Loading</CardTitle>
        <CardDescription>
          {loadingState.message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showProgress && (
          <div className="space-y-2">
            <Progress value={loadingState.progress} className="w-full" />
            <p className="text-xs text-center text-gray-500">
              {Math.round(loadingState.progress || 0)}% complete
            </p>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Please wait while we load your data...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntelligentLoader;