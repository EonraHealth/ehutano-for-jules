import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId
      };

      console.warn('Error Report:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private getErrorMessage = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'The application has been updated. Please refresh the page to get the latest version.';
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('Authentication') || error.message.includes('401')) {
      return 'Your session has expired. Please log in again to continue.';
    }
    
    if (error.message.includes('Permission') || error.message.includes('403')) {
      return 'You do not have permission to access this resource. Please contact your administrator.';
    }
    
    return 'An unexpected error occurred. Our team has been notified.';
  };

  private getRecoveryActions = (error: Error) => {
    const actions = [];
    
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      actions.push({
        label: 'Refresh Page',
        action: () => window.location.reload(),
        primary: true,
        icon: RefreshCw
      });
    } else if (error.message.includes('Authentication') || error.message.includes('401')) {
      actions.push({
        label: 'Log In Again',
        action: () => window.location.href = '/login',
        primary: true,
        icon: Home
      });
    } else {
      actions.push({
        label: 'Try Again',
        action: this.handleRetry,
        primary: true,
        icon: RefreshCw
      });
    }
    
    actions.push({
      label: 'Go Back',
      action: this.handleGoBack,
      primary: false,
      icon: ArrowLeft
    });
    
    actions.push({
      label: 'Go Home',
      action: this.handleGoHome,
      primary: false,
      icon: Home
    });
    
    return actions;
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.getErrorMessage(this.state.error);
      const recoveryActions = this.getRecoveryActions(this.state.error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-900">Something went wrong</CardTitle>
              <CardDescription className="text-gray-600">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error ID: {this.state.errorId}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {recoveryActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={action.action}
                      variant={action.primary ? "default" : "outline"}
                      className="w-full"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded overflow-auto max-h-32">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="mt-1">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;