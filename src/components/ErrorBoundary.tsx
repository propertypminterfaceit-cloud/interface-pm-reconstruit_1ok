import { Component, ErrorInfo, ReactNode } from 'react';
import { HardHat, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <HardHat className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Erreur dans ce module
              </h2>
              <p className="text-gray-600 text-sm">
                Une erreur inattendue s'est produite lors du chargement du module.
              </p>
            </div>
            
            {this.state.error && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-left">
                <p className="text-xs text-gray-600 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              Si le problème persiste, rechargez la page complète.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}