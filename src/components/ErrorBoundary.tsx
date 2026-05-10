import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { reportError } from '../lib/errorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, { componentStack: errorInfo.componentStack || undefined });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--hub-bg)] p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(200,95,73,0.12)]">
                <AlertCircle className="h-8 w-8 text-[color:var(--edu-danger)]" />
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-[color:var(--hub-text)]">
                Something went wrong
              </h1>
              <p className="mb-4 text-[color:var(--hub-muted)]">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 border border-[color:var(--hub-border)] bg-white p-4 text-left">
                <p className="mb-2 text-sm font-mono text-[color:var(--edu-danger)]">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="max-h-40 overflow-auto text-xs text-[color:var(--hub-muted)]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  this.handleReset();
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                className="flex items-center justify-center rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 font-medium text-white transition-colors hover:opacity-95"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.assign('/dashboard');
                  }
                }}
                className="flex items-center justify-center rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 font-medium text-[color:var(--hub-text)] transition-colors hover:bg-[color:var(--hub-soft)]"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
