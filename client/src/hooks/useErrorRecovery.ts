import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface ErrorRecoveryState {
  isRecovering: boolean;
  attemptCount: number;
  lastError: Error | null;
  canRetry: boolean;
}

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  shouldRetry?: (error: Error) => boolean;
}

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
    shouldRetry = () => true
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<ErrorRecoveryState>({
    isRecovering: false,
    attemptCount: 0,
    lastError: null,
    canRetry: true
  });

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, isRecovering: true }));

    try {
      const result = await operation();
      setState({
        isRecovering: false,
        attemptCount: 0,
        lastError: null,
        canRetry: true
      });
      onSuccess?.();
      return result;
    } catch (error) {
      const err = error as Error;
      const newAttemptCount = state.attemptCount + 1;
      const canRetryAgain = newAttemptCount < maxRetries && shouldRetry(err);

      setState({
        isRecovering: false,
        attemptCount: newAttemptCount,
        lastError: err,
        canRetry: canRetryAgain
      });

      onError?.(err);

      // Show appropriate error message based on error type
      const errorMessage = getErrorMessage(err, context);
      const shouldShowToast = !canRetryAgain || newAttemptCount === 1;

      if (shouldShowToast) {
        toast({
          title: 'Operation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }

      if (canRetryAgain) {
        // Automatic retry with backoff
        setTimeout(() => {
          executeWithRecovery(operation, context);
        }, retryDelay * Math.pow(2, newAttemptCount - 1));
      }

      return null;
    }
  }, [state.attemptCount, maxRetries, retryDelay, shouldRetry, onError, onSuccess, toast]);

  const retry = useCallback(async <T>(operation: () => Promise<T>) => {
    if (!state.canRetry) return null;
    
    setState(prev => ({ ...prev, attemptCount: 0 }));
    return executeWithRecovery(operation);
  }, [state.canRetry, executeWithRecovery]);

  const reset = useCallback(() => {
    setState({
      isRecovering: false,
      attemptCount: 0,
      lastError: null,
      canRetry: true
    });
  }, []);

  return {
    ...state,
    executeWithRecovery,
    retry,
    reset
  };
};

const getErrorMessage = (error: Error, context?: string): string => {
  const contextPrefix = context ? `${context}: ` : '';

  if (error.message.includes('401') || error.message.includes('Authentication')) {
    return `${contextPrefix}Your session has expired. Please log in again.`;
  }

  if (error.message.includes('403') || error.message.includes('Permission')) {
    return `${contextPrefix}You don't have permission to perform this action.`;
  }

  if (error.message.includes('404') || error.message.includes('Not Found')) {
    return `${contextPrefix}The requested resource was not found.`;
  }

  if (error.message.includes('500') || error.message.includes('Internal Server')) {
    return `${contextPrefix}Server error occurred. Please try again later.`;
  }

  if (error.message.includes('Network') || error.message.includes('fetch')) {
    return `${contextPrefix}Network connection issue. Check your internet connection.`;
  }

  if (error.message.includes('timeout')) {
    return `${contextPrefix}Request timed out. Please try again.`;
  }

  return `${contextPrefix}An unexpected error occurred. Please try again.`;
};