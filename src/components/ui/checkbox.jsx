export function Checkbox({ checked, onCheckedChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--accent-coral)] 
                   focus:ring-2 focus:ring-[var(--accent-coral-3)] focus:ring-offset-0
                   transition-colors cursor-pointer"
      />
      {label && <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{label}</span>}
    </label>
  );
}
