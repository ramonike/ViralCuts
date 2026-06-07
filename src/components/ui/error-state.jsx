import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

export function ErrorState({ 
  title = "Erro ao carregar", 
  message = "Ocorreu um erro inesperado. Por favor, tente novamente.",
  error,
  onRetry,
  className = ""
}) {
  return (
    <div className={`p-6 bg-red-900/20 border border-red-800 rounded-xl ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-400 mb-1">{title}</h3>
          <p className="text-sm text-red-300/70 mb-3">{message}</p>
          
          {error && (
            <details className="mb-3">
              <summary className="text-xs text-red-400/60 cursor-pointer hover:text-red-400 transition-colors">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 p-2 bg-red-950/50 border border-red-800/50 rounded text-xs text-red-300/80 overflow-auto">
                {error.message || JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
          
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="border-red-700 text-red-400 hover:bg-red-900/30 hover:text-red-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function InlineError({ message, onRetry, className = "" }) {
  return (
    <div className={`flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg ${className}`}>
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      <span className="text-sm text-red-300/80 flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function ErrorBoundaryFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorState
          title="Algo deu errado"
          message="A aplicação encontrou um erro inesperado. Você pode tentar recarregar a página."
          error={error}
          onRetry={resetErrorBoundary}
        />
      </div>
    </div>
  );
}
