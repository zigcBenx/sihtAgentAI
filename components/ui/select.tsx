import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  id,
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-muted-light"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-xl border border-surface-border bg-surface-light px-4 py-3.5 text-base text-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 appearance-none cursor-pointer ${error ? "border-red-500/50" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
