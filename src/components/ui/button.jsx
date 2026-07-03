import { ButtonSpinner } from './spinner';

export function Button({ children, className = "", variant = "primary", size = "default", loading = false, ...props }) {
  const variantClass = {
    primary: "vc-btn-primary",
    secondary: "vc-btn-secondary",
    ghost: "vc-btn-ghost",
    outline: "vc-btn-secondary",
    destructive: "vc-btn-destructive",
  };

  const sizeClass = {
    sm: "vc-btn-sm",
    default: "",
    lg: "vc-btn-lg",
    xl: "vc-btn-xl",
    icon: "vc-btn-icon",
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`vc-btn ${variantClass[variant] || variantClass.primary} ${sizeClass[size] || ""} ${className}`}
    >
      {loading && <ButtonSpinner size={size === 'sm' ? 'sm' : 'default'} />}
      <span className={loading ? 'ml-2' : ''}>{children}</span>
    </button>
  );
}
