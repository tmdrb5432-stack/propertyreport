"use client";

import { useState } from "react";
import type { TopComplex } from "@/lib/queries";
import { ComplexTradeTable } from "@/components/district/ComplexTradeTable";
import { TransactionTrendChart } from "@/components/charts/TransactionTrendChart";
import { TransitScoreGauge } from "@/components/charts/TransitScoreGauge";
import { chartColors } from "@/lib/chartTheme";

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function ComplexDetailPanel({
  complex,
  districtNameKo,
  onClose,
  reasons,
}: {
  complex: TopComplex;
  districtNameKo: string;
  onClose: () => void;
  /** Only present when opened from the 추천 매물 finder — why this one ranked well. */
  reasons?: string[];
}) {
  const [showTrend, setShowTrend] = useState(false);

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-md ring-1 ring-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
          {complex.complexName}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
        >
          ×
        </button>
      </div>

      {reasons && reasons.length > 0 && (
        <div
          className="rounded-xl border p-3"
          style={{ borderColor: `${chartColors.series1Blue}33`, background: `${chartColors.series1Blue}0d` }}
        >
          <p className="mb-1.5 text-xs font-semibold" style={{ color: chartColors.series1Blue }}>
            추천 이유
          </p>
          <ul className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-1.5">
                <span style={{ color: chartColors.series1Blue }}>·</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <TransitScoreGauge
        score={complex.jobProximityScore}
        label="직주근접 지수"
        color={chartColors.series1Blue}
      />

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {complex.nearestSubwayName
            ? `${complex.nearestSubwayName}역까지 ${complex.nearestSubwayDistanceM?.toLocaleString()}m`
            : "인근 지하철역 정보 없음"}
        </span>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {districtNameKo}업무지구까지{" "}
          {complex.distanceToDistrictM !== null
            ? `${(complex.distanceToDistrictM / 1000).toFixed(1)}km · 약 ${complex.estimatedMinutesToDistrict}분 (직선거리 추정)`
            : "거리 정보 없음"}
        </span>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowTrend((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-medium text-neutral-500"
        >
          <span>실거래가 추이</span>
          <span className="flex items-center gap-0.5 font-semibold" style={{ color: chartColors.series1Blue }}>
            {showTrend ? "접기" : "펼치기"}
            <span className={`transition-transform ${showTrend ? "rotate-180" : ""}`}>▾</span>
          </span>
        </button>
        {showTrend && (
          <div className="mt-2">
            <TransactionTrendChart
              data={complex.trend.map((t) => ({
                periodDate: formatMonth(t.periodDate),
                avgPricePerPyeong: t.avgPricePerPyeong,
                transactionCount: t.transactionCount,
              }))}
            />
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-neutral-500">실거래 현황 (평수별)</p>
        <ComplexTradeTable trades={complex.recentTrades} />
      </div>
    </div>
  );
}
