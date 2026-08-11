"use client";

import { useMemo, useState } from "react";
import type { DistrictOverview } from "@/lib/queries";
import { DistrictSummaryCard } from "./DistrictSummaryCard";

type SortKey = "jobHousingIndex" | "mobilityIndex";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "jobHousingIndex", label: "직주근접 지수" },
  { key: "mobilityIndex", label: "이동편의성 지수" },
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
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              sortKey === opt.key
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((district) => (
          <DistrictSummaryCard key={district.id} district={district} />
        ))}
      </div>
    </div>
  );
}
