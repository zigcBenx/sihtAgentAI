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
        className={`block w-full rounded-xl border border-surface-border bg-surface px-4 py-3.5 text-base text-foreground placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
