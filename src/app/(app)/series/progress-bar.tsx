export function ProgressBar({
  watched,
  total,
}: {
  watched: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;

  return (
    <div className="mt-1">
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-0.5">
        {watched}/{total}
      </p>
    </div>
  );
}
