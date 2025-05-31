import { useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  lastError: Error | null;
  nextRetryIn: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxDelay: 30000
};

interface SmartRetryHandlerProps {
  onRetry: () => Promise<any>;
  config?: Partial<RetryConfig>;
  children: (retryState: RetryState & { retry: () => void }) => React.ReactNode;
}

const SmartRetryHandler = ({ onRetry, config = {}, children }: SmartRetryHandlerProps) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    lastError: null,
    nextRetryIn: 0
  });

  const calculateDelay = (attempt: number): number => {
    const delay = finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
    return Math.min(delay, finalConfig.maxDelay);
  };

  const retry = useCallback(async () => {
    if (retryState.currentAttempt >= finalConfig.maxRetries) {
      return;
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      currentAttempt: prev.currentAttempt + 1
    }));

    try {
      await onRetry();
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: null,
        nextRetryIn: 0
      }));
    } catch (error) {
      const nextAttempt = retryState.currentAttempt + 1;
      if (nextAttempt < finalConfig.maxRetries) {
        const delay = calculateDelay(nextAttempt);
        setRetryState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: error as Error,
          nextRetryIn: delay
        }));

        // Schedule next retry
        setTimeout(() => {
          retry();
        }, delay);
      } else {
        setRetryState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: error as Error,
          nextRetryIn: 0
        }));
      }
    }
  }, [retryState.currentAttempt, finalConfig, onRetry]);

  return (
    <>
      {children({ ...retryState, retry })}
    </>
  );
};

export default SmartRetryHandler;