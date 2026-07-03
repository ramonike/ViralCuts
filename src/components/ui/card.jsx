export function Card({ children, className = "", variant = "default" }) {
  const variantClass = {
    default: "vc-card",
    elevated: "vc-card vc-card-elevated",
    glass: "vc-card vc-card-glass",
    coral: "vc-card vc-card-coral",
  };

  return (
    <div className={`${variantClass[variant] || variantClass.default} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`vc-card-header ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`text-title ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={`text-caption mt-1 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`vc-card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return <div className={`vc-card-footer ${className}`}>{children}</div>;
}
