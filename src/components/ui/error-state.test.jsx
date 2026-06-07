import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState, InlineError } from './error-state';

describe('ErrorState Component', () => {
  it('should render with default props', () => {
    render(<ErrorState />);
    expect(screen.getByText('Erro ao carregar')).toBeInTheDocument();
    expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeInTheDocument();
  });

  it('should render with custom title and message', () => {
    render(
      <ErrorState 
        title="Custom Error" 
        message="Custom error message" 
      />
    );
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should apply error styling classes', () => {
    const { container } = render(<ErrorState />);
    const errorDiv = container.firstChild;
    expect(errorDiv.className).toContain('bg-red-900/20');
    expect(errorDiv.className).toContain('border-red-800');
  });

  it('should show retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Tentar novamente');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Tentar novamente')).not.toBeInTheDocument();
  });

  it('should show error details when error object is provided', () => {
    const error = new Error('Test error message');
    render(<ErrorState error={error} />);
    
    expect(screen.getByText('Detalhes técnicos')).toBeInTheDocument();
  });
});

describe('InlineError Component', () => {
  it('should render inline error message', () => {
    render(<InlineError message="Inline error message" />);
    expect(screen.getByText('Inline error message')).toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    render(<InlineError message="Error" onRetry={handleRetry} />);
    
    const retryButton = screen.getByText('Tentar novamente');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('should apply inline error styling', () => {
    const { container } = render(<InlineError message="Error" />);
    const errorDiv = container.firstChild;
    expect(errorDiv.className).toContain('bg-red-900/20');
    expect(errorDiv.className).toContain('border-red-800/50');
  });
});
