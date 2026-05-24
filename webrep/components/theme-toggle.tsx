"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex h-8 w-14 items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-2)] p-0.5 transition-all duration-300 hover:border-[var(--border-strong)]"
    >
      {/* Track */}
      <span
        className={`absolute left-0.5 h-6 w-6 rounded-full transition-all duration-300 flex items-center justify-center text-[13px]
          ${theme === "dark"
            ? "translate-x-0 bg-slate-700"
            : "translate-x-6 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
          }`}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
      {/* Opposite icon (faint) */}
      <span className={`absolute text-[11px] opacity-40 transition-all duration-300 ${theme === "dark" ? "right-1" : "left-1"}`}>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
