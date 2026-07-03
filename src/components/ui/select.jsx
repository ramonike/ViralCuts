import React from "react";

export const Select = React.forwardRef(({ className = "", label, error, children, ...props }, ref) => (
  <div className="vc-input-wrap">
    {label && <label className="vc-label">{label}</label>}
    <select
      ref={ref}
      className={`vc-input ${error ? "error" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-[var(--accent-coral)] mt-1 block">{error}</span>}
  </div>
));
Select.displayName = "Select";

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
