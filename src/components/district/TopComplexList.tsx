import type { TopComplex } from "@/lib/queries";
import { Sparkline } from "@/components/charts/Sparkline";

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function TopComplexList({ complexes }: { complexes: TopComplex[] }) {
  if (complexes.length === 0) {
    return <p className="text-sm text-neutral-500">아직 단지별 실거래가 데이터가 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {complexes.map((complex, i) => (
        <li key={complex.complexName} className="flex items-center gap-3 py-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {complex.complexName}
            </p>
            <p className="text-xs text-neutral-400">
              {formatMonth(complex.latestPeriodDate)} 기준 거래 {complex.latestTransactionCount}건
            </p>
          </div>
          <div className="w-24 shrink-0">
            <Sparkline
              data={complex.trend.map((t) => ({
                avgPricePerPyeong: t.avgPricePerPyeong,
              }))}
              dataKey="avgPricePerPyeong"
              gradientId={`complex-spark-${complex.complexName}`}
            />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {complex.latestAvgPricePerPyeong
                ? `${complex.latestAvgPricePerPyeong.toLocaleString()}만원`
                : "-"}
            </p>
            <p className="text-[11px] text-neutral-400">평당가</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
