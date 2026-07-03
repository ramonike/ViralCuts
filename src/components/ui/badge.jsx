export function Badge({ children, className = "", variant = "muted" }) {
  const variantClass = {
    coral: "vc-badge vc-badge-coral",
    amber: "vc-badge vc-badge-amber",
    teal: "vc-badge vc-badge-teal",
    muted: "vc-badge vc-badge-muted",
    live: "vc-badge vc-badge-live",
  };

  return (
    <span className={`${variantClass[variant] || variantClass.muted} ${className}`}>
      {children}
    </span>
  );
}
