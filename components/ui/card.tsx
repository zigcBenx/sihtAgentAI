import { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-surface-border bg-surface p-6 ${className}`}
      {...props}
    />
  );
}
