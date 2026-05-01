export type BadgeVariant = "success" | "neutral" | "warning" | "live";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-accent/10 text-accent",
  neutral: "bg-surface-light text-muted-light",
  warning: "bg-warning-soft text-warning border border-warning-border",
  live: "bg-accent/10 text-accent",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${variantStyles[variant]}`}
    >
      {variant === "live" && (
        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent animate-pulse" />
      )}
      {children}
    </span>
  );
}
