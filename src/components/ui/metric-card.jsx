import { cn } from "../../lib/utils";

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = "flat",
  accent = "neutral",
  icon = null,
  className = "",
  valueClassName = "",
  labelClassName = "",
  children,
}) {
  return (
    <div className={cn("vc-metric-card", `metric-${accent}`, className)}>
      {icon ? <div className="vc-metric-icon">{icon}</div> : null}
      {label ? <div className={cn("vc-metric-label", labelClassName)}>{label}</div> : null}
      {value !== undefined && value !== null ? (
        <div className={cn("vc-metric-value", valueClassName)}>{value}</div>
      ) : null}
      {delta ? <div className={cn("vc-metric-delta", deltaTone)}>{delta}</div> : null}
      {children}
    </div>
  );
}

export function MetricGrid({ children, className = "" }) {
  return <div className={cn("vc-grid-metrics", className)}>{children}</div>;
}
