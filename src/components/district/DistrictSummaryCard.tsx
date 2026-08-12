"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { DistrictOverview } from "@/lib/queries";
import { chartColors } from "@/lib/chartTheme";
import { FreshnessRow } from "./FreshnessBadge";

function Sparkline({ points }: { points: { avgPricePerPyeong: number | null }[] }) {
  const data = points.filter((p) => p.avgPricePerPyeong !== null);
  if (data.length < 2) {
    return <div className="h-10 w-full" />;
  }
  return (
    <ResponsiveContainer width="100%" height={40}>
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

function IndexPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-neutral-50 px-3 py-1.5 dark:bg-neutral-900">
      <span className="text-[11px] text-neutral-400">{label}</span>
      <span className="text-sm font-semibold" style={{ color: chartColors.series1Blue }}>
        {value}
      </span>
    </div>
  );
}

export function DistrictSummaryCard({ district }: { district: DistrictOverview }) {
  return (
    <Link
      href={`/district/${district.id}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {district.nameKo}
          </h3>
          <p className="text-xs text-neutral-400">{district.nameEn}</p>
        </div>
        <div className="flex gap-2">
          <IndexPill label="직주근접" value={district.jobHousingIndex} />
          <IndexPill label="이동편의성" value={district.mobilityIndex} />
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-neutral-50 py-2 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {district.companyCount ?? "-"}
          </p>
          <p className="text-[11px] text-neutral-400">회사수</p>
        </div>
        <div className="rounded-lg bg-neutral-50 py-2 dark:bg-neutral-900">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {district.employeeCount ? district.employeeCount.toLocaleString() : "추정치 없음"}
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

      <div className="mb-3">
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

      <FreshnessRow items={district.freshness} />
    </Link>
  );
}
