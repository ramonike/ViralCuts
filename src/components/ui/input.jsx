import React from "react";

export const Input = React.forwardRef(({ className = "", label, error, icon: Icon, ...props }, ref) => (
  <div className="vc-input-wrap">
    {label && <label className="vc-label">{label}</label>}
    {Icon && <Icon className="vc-input-icon-left" size={16} />}
    <input
      ref={ref}
      className={`vc-input ${Icon ? "has-icon-left" : ""} ${error ? "error" : ""} ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-[var(--accent-coral)] mt-1 block">{error}</span>}
  </div>
));
Input.displayName = "Input";
