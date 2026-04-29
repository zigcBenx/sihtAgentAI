export function FloatingStats() {
  return (
    <div className="flex flex-wrap justify-center gap-5">
      <div className="float rounded-2xl border border-surface-border bg-surface px-6 py-4 text-center">
        <div className="text-3xl font-bold text-accent">24/7</div>
        <div className="mt-1 text-xs text-muted">Always scanning</div>
      </div>
      <div className="float-delay rounded-2xl border border-surface-border bg-surface px-6 py-4 text-center">
        <div className="text-3xl font-bold text-foreground">500+</div>
        <div className="mt-1 text-xs text-muted">Jobs indexed daily</div>
      </div>
      <div className="float-slow rounded-2xl border border-surface-border bg-surface px-6 py-4 text-center">
        <div className="text-3xl font-bold text-foreground">0</div>
        <div className="mt-1 text-xs text-muted">Jobs missed</div>
      </div>
    </div>
  );
}
