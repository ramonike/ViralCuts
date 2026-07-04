import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { cn } from "../../lib/utils";

export function SectionCard({
  title,
  description,
  headerAction,
  children,
  className = "",
  contentClassName = "",
  variant = "default",
}) {
  return (
    <Card variant={variant} className={cn("vc-section-card", className)}>
      {(title || description || headerAction) && (
        <CardHeader className="vc-section-card-header">
          <div>
            {title ? <CardTitle className="vc-section-title">{title}</CardTitle> : null}
            {description ? (
              <CardDescription className="vc-section-description">{description}</CardDescription>
            ) : null}
          </div>
          {headerAction ? <div className="vc-section-action">{headerAction}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn("vc-section-card-body", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
