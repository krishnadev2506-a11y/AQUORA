import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="glass-panel max-w-lg w-full p-8 rounded-xl border border-red-500/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-status-danger">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-mono text-red-400 font-bold mb-2">
              {this.props.fallbackTitle || 'SUBSYSTEM RENDERING EXCEPTION'}
            </h2>
            <p className="text-sm text-slate-400 mb-6 font-mono break-words">
              {this.state.error?.message || 'An unexpected error occurred while rendering this interface.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-cyan/20 border border-brand-cyan/50 text-cyan-300 rounded hover:bg-brand-cyan/30 text-xs font-mono tracking-wider uppercase transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reset Component
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 text-xs font-mono tracking-wider uppercase transition-all"
              >
                <Home className="w-4 h-4" /> Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
