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
        className={`block w-full rounded-xl border border-surface-border bg-surface px-4 py-3.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none cursor-pointer ${error ? "border-danger" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
