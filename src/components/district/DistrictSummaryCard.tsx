"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { DistrictOverview } from "@/lib/queries";
import { chartColors } from "@/lib/chartTheme";
import { TransitScoreGauge } from "@/components/charts/TransitScoreGauge";

function Sparkline({ points }: { points: { avgPricePerPyeong: number | null }[] }) {
  const data = points.filter((p) => p.avgPricePerPyeong !== null);
  if (data.length < 2) {
    return <div className="h-12 w-full" />;
  }
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.series1Blue} stopOpacity={0.3} />
            <stop offset="100%" stopColor={chartColors.series1Blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="avgPricePerPyeong"
          stroke={chartColors.series1Blue}
          strokeWidth={2}
          fill="url(#sparkFill)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function GrowthBadge({ ratio }: { ratio: number | null }) {
  if (ratio === null) return null;
  const pct = ratio * 100;
  const isUp = pct >= 0;
  const color = isUp ? chartColors.goodGreen : chartColors.criticalRed;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color, background: isUp ? "#0ca30c1a" : "#d03b3b1a" }}
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

const RANK_BADGE_COLORS = ["#eda100", "#898781", "#b08d57"]; // 1st/2nd/3rd — gold/silver/bronze accent, rest neutral

function RankBadge({ rank }: { rank: number }) {
  const color = RANK_BADGE_COLORS[rank - 1] ?? chartColors.mutedInk;
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ background: color }}
    >
      {rank}
    </span>
  );
}

export function DistrictSummaryCard({
  district,
  rank,
}: {
  district: DistrictOverview;
  rank: number;
}) {
  return (
    <Link
      href={`/district/${district.id}`}
      className="group block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <RankBadge rank={rank} />
          <div>
            <h3 className="text-lg leading-tight font-semibold text-neutral-900 dark:text-neutral-50">
              {district.nameKo}
            </h3>
            <p className="text-xs text-neutral-400">{district.nameEn}</p>
          </div>
        </div>
        <GrowthBadge ratio={district.priceGrowthRatio} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <TransitScoreGauge
          score={district.jobHousingIndex}
          label="직주근접"
          color={chartColors.series1Blue}
        />
        <TransitScoreGauge
          score={district.mobilityIndex}
          label="이동편의성"
          color={chartColors.series2Orange}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-neutral-50 py-2 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {district.companyCount ?? "-"}
          </p>
          <p className="text-[11px] text-neutral-400">회사수</p>
        </div>
        <div className="rounded-lg bg-neutral-50 py-2 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {district.employeeCount ? district.employeeCount.toLocaleString() : "-"}
          </p>
          <p className="text-[11px] text-neutral-400">종사자수(추정)</p>
        </div>
        <div className="rounded-lg bg-neutral-50 py-2 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {district.transitScore ?? "-"}
          </p>
          <p className="text-[11px] text-neutral-400">교통점수</p>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs text-neutral-400">실거래가 추이 (평당)</span>
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {district.latestPricePerPyeong
              ? `${district.latestPricePerPyeong.toLocaleString()}만원`
              : "-"}
          </span>
        </div>
        <Sparkline points={district.priceTrend} />
      </div>
    </Link>
  );
}
