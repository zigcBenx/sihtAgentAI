import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
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
      <input
        id={id}
        className={`block w-full rounded-xl border border-surface-border bg-surface-light px-4 py-3.5 text-base text-foreground placeholder-muted focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
