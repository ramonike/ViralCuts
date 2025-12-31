export function Button({ children, className = "", variant = "primary", size = "default", ...props }) {
  const baseClasses = "inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-surface-700 text-white hover:bg-surface-600 border border-surface-600",
    ghost: "bg-transparent text-slate-300 hover:bg-surface-700 hover:text-white",
    outline: "bg-transparent text-slate-300 hover:bg-surface-800 hover:text-white border border-surface-600",
    destructive: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg",
    default: "h-10 px-4 py-2 text-sm rounded-xl",
    lg: "h-12 px-6 text-base rounded-xl",
    icon: "h-9 w-9 rounded-lg",
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.default} ${className}`}
    >
      {children}
    </button>
  );
}
