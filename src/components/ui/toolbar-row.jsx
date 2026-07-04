import { cn } from "../../lib/utils";

export function ToolbarRow({
  leading,
  trailing,
  children,
  className = "",
  leadingClassName = "",
  trailingClassName = "",
}) {
  return (
    <div className={cn("vc-toolbar-row", className)}>
      <div className={cn("vc-toolbar-leading", leadingClassName)}>
        {leading || children}
      </div>
      {trailing ? (
        <div className={cn("vc-toolbar-trailing", trailingClassName)}>{trailing}</div>
      ) : null}
    </div>
  );
}
