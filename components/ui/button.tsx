import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "default" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-black font-semibold hover:bg-accent-hover active:scale-[0.98]",
  secondary:
    "bg-surface-light text-foreground border border-surface-border hover:bg-surface-border active:scale-[0.98]",
  danger:
    "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 active:scale-[0.98]",
  ghost: "text-muted-light hover:text-foreground hover:bg-surface-light",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
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
