import { chartColors } from "@/lib/chartTheme";

export function TransitScoreGauge({
  score,
  label,
}: {
  score: number | null;
  label?: string;
}) {
  const value = score ?? 0;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-neutral-500">{label ?? "이동편의성"}</span>
        <span className="text-sm font-semibold" style={{ color: chartColors.series1Blue }}>
          {score === null ? "-" : Math.round(score)}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: chartColors.gridline }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: chartColors.series1Blue }}
        />
      </div>
    </div>
  );
}
