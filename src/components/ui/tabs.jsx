import { useState } from "react";

export function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div className={`flex gap-1 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all
            ${activeTab === tab.value
              ? "bg-[var(--accent-coral-3)] text-[var(--accent-coral-2)] border border-[rgba(232,65,42,0.2)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent"
            }
          `}
        >
          {tab.icon && <span className="inline-flex mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
