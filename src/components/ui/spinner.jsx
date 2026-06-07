import { Loader2 } from 'lucide-react';

export function Spinner({ className = "", size = "default" }) {
  const sizes = {
    sm: "w-4 h-4",
    default: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <Loader2 
      className={`animate-spin ${sizes[size] || sizes.default} ${className}`}
      aria-label="Loading"
    />
  );
}

export function ButtonSpinner({ size = "sm" }) {
  return <Spinner size={size} className="text-current" />;
}
