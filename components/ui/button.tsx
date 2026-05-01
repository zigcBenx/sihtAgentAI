import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "default" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-accent to-accent-hover text-white font-semibold hover:from-accent-hover hover:to-accent-hover active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]",
  secondary:
    "bg-surface text-foreground border border-surface-border hover:bg-surface-light hover:border-accent/30 active:scale-[0.98] shadow-sm",
  danger:
    "bg-danger-soft text-danger border border-danger-border hover:bg-danger-border/50 active:scale-[0.98]",
  ghost: "text-muted-light hover:text-foreground hover:bg-surface-light",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm",
  lg: "px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base",
};

export function Button({
  variant = "primary",
  size = "default",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
