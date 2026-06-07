import React from 'react';

/**
 * WidgetWrapper - Componente wrapper para garantir consistência visual em todos os widgets
 * Subtask 8.4: Mobile-optimized padding and font sizes
 * 
 * @param {Object} props
 * @param {string} props.title - Título do widget
 * @param {React.ReactNode} [props.icon] - Ícone opcional à esquerda do título
 * @param {React.ReactNode} [props.actions] - Ações opcionais à direita do header
 * @param {React.ReactNode} props.children - Conteúdo do widget
 * @param {boolean} [props.loading] - Estado de carregamento
 * @param {string} [props.className] - Classes CSS adicionais
 * @param {boolean} [props.fullWidth] - Se o widget deve ocupar largura total
 */
const WidgetWrapper = ({
  title,
  icon,
  actions,
  children,
  loading = false,
  className = '',
  fullWidth = false,
}) => {
  // Skeleton loading state
  if (loading) {
    return (
      <div
        className={`
          bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-6
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
      >
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-slate-700 rounded animate-pulse" />
            <div className="h-5 md:h-6 bg-slate-700 rounded w-24 md:w-32 animate-pulse" />
          </div>
          {actions && (
            <div className="h-7 md:h-8 bg-slate-700 rounded w-20 md:w-24 animate-pulse" />
          )}
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-2 md:space-y-3">
          <div className="h-16 md:h-20 bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-16 md:h-20 bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-16 md:h-20 bg-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-6
        animate-in fade-in slide-in-from-bottom-4 duration-500
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Header padronizado */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        {/* Ícone e título à esquerda */}
        <div className="flex items-center gap-2 md:gap-3">
          {icon && (
            <div className="flex-shrink-0 text-slate-400">
              {icon}
            </div>
          )}
          <h3 className="text-base md:text-lg font-semibold text-slate-100">
            {title}
          </h3>
        </div>
        
        {/* Ações à direita */}
        {actions && (
          <div className="flex items-center gap-1.5 md:gap-2">
            {actions}
          </div>
        )}
      </div>
      
      {/* Conteúdo do widget */}
      <div>
        {children}
      </div>
    </div>
  );
};

export default WidgetWrapper;
