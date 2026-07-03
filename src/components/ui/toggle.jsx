export function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`
          relative inline-flex h-6 w-10 shrink-0 rounded-full border border-[var(--border-default)] transition-all
          ${checked ? "bg-[var(--accent-coral)]" : "bg-[var(--bg-elevated)]"}
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-coral-3)] focus:ring-offset-0
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform mt-[3px] ml-[3px]
            ${checked ? "translate-x-4" : "translate-x-0"}
          `}
        />
      </button>
      {label && <span className="text-sm text-[var(--text-secondary)]">{label}</span>}
    </label>
  );
}
