"use client";

import { useMemo, useState } from "react";
import type { DistrictOverview } from "@/lib/queries";
import { chartColors } from "@/lib/chartTheme";
import { DistrictSummaryCard } from "./DistrictSummaryCard";

type SortKey = "jobHousingIndex" | "mobilityIndex";

const SORT_OPTIONS: { key: SortKey; label: string; color: string }[] = [
  { key: "jobHousingIndex", label: "직주근접 지수", color: chartColors.series1Blue },
  { key: "mobilityIndex", label: "이동편의성 지수", color: chartColors.series2Orange },
];

export function DistrictOverviewGrid({ districts }: { districts: DistrictOverview[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("jobHousingIndex");

  const sorted = useMemo(
    () => [...districts].sort((a, b) => b[sortKey] - a[sortKey]),
    [districts, sortKey],
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-neutral-400">정렬 기준</span>
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className="rounded-full px-3 py-1 text-xs font-medium transition"
              style={
                active
                  ? { background: opt.color, color: "#fff" }
                  : { background: chartColors.gridline, color: chartColors.secondaryInk }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((district, i) => (
          <DistrictSummaryCard key={district.id} district={district} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
