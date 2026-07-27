export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="hud-skeleton" role="status" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="hud-skeleton__row" data-testid="hud-skeleton-row" />
      ))}
    </div>
  );
}
