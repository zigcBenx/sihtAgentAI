export type BadgeVariant = "success" | "neutral" | "warning" | "live";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-accent/15 text-accent",
  neutral: "bg-surface-light text-muted",
  warning: "bg-yellow-500/15 text-yellow-400",
  live: "bg-accent/15 text-accent",
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${variantStyles[variant]}`}
    >
      {variant === "live" && (
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
      )}
      {children}
    </span>
  );
}
