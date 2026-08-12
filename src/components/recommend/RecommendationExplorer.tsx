"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RecommendedComplex } from "@/lib/queries";
import { DISTRICTS } from "@/lib/districts";
import { chartColors } from "@/lib/chartTheme";
import { RankBadge } from "@/components/RankBadge";

const RESULT_COUNT = 5;

const AREA_BANDS = [
  { key: "all", label: "전체 평형", test: () => true },
  { key: "under30", label: "30평 미만", test: (p: number) => p < 30 },
  { key: "30s", label: "30평대", test: (p: number) => p >= 30 && p < 40 },
  { key: "40plus", label: "40평 이상", test: (p: number) => p >= 40 },
] as const;

const PRICE_BANDS = [
  { key: "all", label: "전체 가격대", test: () => true },
  { key: "under5", label: "5억 이하", test: (eok: number) => eok <= 5 },
  { key: "5to8", label: "5~8억", test: (eok: number) => eok > 5 && eok <= 8 },
  { key: "8to12", label: "8~12억", test: (eok: number) => eok > 8 && eok <= 12 },
  { key: "over12", label: "12억 초과", test: (eok: number) => eok > 12 },
] as const;

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-baseline justify-between text-[11px]">
        <span className="text-neutral-400">{label}</span>
        <span className="font-medium" style={{ color }}>
          {value}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: chartColors.gridline }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function RecommendationExplorer({ complexes }: { complexes: RecommendedComplex[] }) {
  const [districtFilter, setDistrictFilter] = useState<Set<string>>(
    () => new Set(DISTRICTS.map((d) => d.id)),
  );
  const [areaBand, setAreaBand] = useState<(typeof AREA_BANDS)[number]["key"]>("all");
  const [priceBand, setPriceBand] = useState<(typeof PRICE_BANDS)[number]["key"]>("all");

  function toggleDistrict(id: string) {
    setDistrictFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const results = useMemo(() => {
    const areaTest = AREA_BANDS.find((b) => b.key === areaBand)!.test;
    const priceTest = PRICE_BANDS.find((b) => b.key === priceBand)!.test;

    return complexes
      .filter((c) => districtFilter.has(c.districtId))
      .filter((c) => {
        if (areaBand === "all") return true;
        return c.recentTrades.some((t) => areaTest(t.areaPyeong));
      })
      .filter((c) => {
        if (priceBand === "all") return true;
        if (c.latestAvgPriceTotal === null) return false;
        return priceTest(c.latestAvgPriceTotal / 10000);
      })
      .slice(0, RESULT_COUNT);
  }, [complexes, districtFilter, areaBand, priceBand]);

  return (
    <div>
      <div className="mb-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div>
          <p className="mb-1.5 text-xs text-neutral-400">지역</p>
          <div className="flex flex-wrap gap-1.5">
            {DISTRICTS.map((d) => {
              const active = districtFilter.has(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDistrict(d.id)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition"
                  style={
                    active
                      ? { background: chartColors.series1Blue, color: "#fff" }
                      : { background: chartColors.gridline, color: chartColors.secondaryInk }
                  }
                >
                  {d.nameKo}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-neutral-400">평형</p>
          <div className="flex flex-wrap gap-1.5">
            {AREA_BANDS.map((b) => (
              <button
                key={b.key}
                onClick={() => setAreaBand(b.key)}
                className="rounded-full px-3 py-1 text-xs font-medium transition"
                style={
                  areaBand === b.key
                    ? { background: chartColors.series2Orange, color: "#fff" }
                    : { background: chartColors.gridline, color: chartColors.secondaryInk }
                }
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs text-neutral-400">가격대 (평균 실거래 총액 기준)</p>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_BANDS.map((b) => (
              <button
                key={b.key}
                onClick={() => setPriceBand(b.key)}
                className="rounded-full px-3 py-1 text-xs font-medium transition"
                style={
                  priceBand === b.key
                    ? { background: chartColors.series3Aqua, color: "#fff" }
                    : { background: chartColors.gridline, color: chartColors.secondaryInk }
                }
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-neutral-500">조건에 맞는 단지가 없습니다. 필터를 넓혀보세요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((c, i) => (
            <div
              key={`${c.districtId}-${c.complexName}`}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RankBadge rank={i + 1} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {c.complexName}
                    </p>
                    <p className="text-xs text-neutral-400">{c.districtNameKo}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold" style={{ color: chartColors.series1Blue }}>
                    {c.recommendScore}
                  </p>
                  <p className="text-[10px] text-neutral-400">종합점수</p>
                </div>
              </div>

              <div className="mb-3 space-y-2">
                <ScoreBar label="직주근접" value={c.jobProximityScore} color={chartColors.series1Blue} />
                <ScoreBar label="가격 저렴함" value={c.affordabilityScore} color={chartColors.series2Orange} />
                <ScoreBar label="저평가(상승률 낮음)" value={c.undervaluationScore} color={chartColors.series3Aqua} />
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-neutral-50 py-1.5 dark:bg-neutral-900">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {c.latestAvgPricePerPyeong ? `${c.latestAvgPricePerPyeong.toLocaleString()}만원` : "-"}
                  </p>
                  <p className="text-[10px] text-neutral-400">평당가</p>
                </div>
                <div className="rounded-lg bg-neutral-50 py-1.5 dark:bg-neutral-900">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {c.latestAvgPriceTotal
                      ? `${(c.latestAvgPriceTotal / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}억원`
                      : "-"}
                  </p>
                  <p className="text-[10px] text-neutral-400">평균 실거래가</p>
                </div>
              </div>

              <p className="mb-3 text-xs text-neutral-400">
                {c.nearestSubwayName ? `${c.nearestSubwayName}역 ${c.nearestSubwayDistanceM?.toLocaleString()}m` : "지하철역 정보 없음"}
                {" · "}
                {c.distanceToDistrictM !== null
                  ? `${c.districtNameKo}업무지구 ${(c.distanceToDistrictM / 1000).toFixed(1)}km`
                  : "거리 정보 없음"}
              </p>

              <Link
                href={`/district/${c.districtId}`}
                className="text-xs font-medium hover:underline"
                style={{ color: chartColors.series1Blue }}
              >
                {c.districtNameKo} 지구 상세 보기 →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
