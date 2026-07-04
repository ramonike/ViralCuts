import { cn } from "../../lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
  textClassName = "",
  actionsClassName = "",
}) {
  if (!eyebrow && !title && !subtitle && !children) {
    return null;
  }

  return (
    <header className={cn("vc-page-header", className)}>
      <div className={cn("vc-page-header-text", textClassName)}>
        {eyebrow ? <p className="vc-page-eyebrow">{eyebrow}</p> : null}
        {title ? <h1>{title}</h1> : null}
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children ? (
        <div className={cn("vc-page-actions", actionsClassName)}>{children}</div>
      ) : null}
    </header>
  );
}
