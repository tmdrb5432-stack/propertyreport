"use client";

import { useState } from "react";
import type { TopComplex } from "@/lib/queries";
import { KakaoMapView } from "@/components/map/KakaoMapView";
import { TopComplexList } from "@/components/district/TopComplexList";
import { ComplexTradeTable } from "@/components/district/ComplexTradeTable";
import { TransactionTrendChart } from "@/components/charts/TransactionTrendChart";

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function ComplexMapExplorer({
  district,
  complexes,
}: {
  district: { lat: number; lng: number; nameKo: string };
  complexes: TopComplex[];
}) {
  const [selected, setSelected] = useState<string | null>(complexes[0]?.complexName ?? null);

  if (complexes.length === 0) {
    return <p className="text-sm text-neutral-500">아직 단지별 실거래가 데이터가 없습니다.</p>;
  }

  const markers = complexes
    .map((c, i) => ({ complex: c, rank: i + 1 }))
    .filter(({ complex }) => complex.lat !== null && complex.lng !== null)
    .map(({ complex, rank }) => ({
      id: complex.complexName,
      lat: complex.lat as number,
      lng: complex.lng as number,
      label: `${rank}. ${complex.complexName}`,
    }));

  const selectedComplex = complexes.find((c) => c.complexName === selected) ?? complexes[0];
  const hasSelectedCoords = selectedComplex.lat !== null && selectedComplex.lng !== null;
  const mapCenter = hasSelectedCoords
    ? { lat: selectedComplex.lat as number, lng: selectedComplex.lng as number }
    : { lat: district.lat, lng: district.lng };

  return (
    <div className="space-y-4">
      <div className="h-56 overflow-hidden rounded-xl">
        {markers.length > 0 ? (
          <KakaoMapView
            markers={markers}
            center={mapCenter}
            level={hasSelectedCoords ? 4 : 6}
            onMarkerClick={setSelected}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
            단지 위치를 아직 찾지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}
      </div>

      <TopComplexList complexes={complexes} selected={selected} onSelect={setSelected} />

      {selectedComplex && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {selectedComplex.nearestSubwayName
                ? `${selectedComplex.nearestSubwayName}역까지 ${selectedComplex.nearestSubwayDistanceM?.toLocaleString()}m`
                : "인근 지하철역 정보 없음"}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {district.nameKo}업무지구까지{" "}
              {selectedComplex.distanceToDistrictM !== null
                ? `${(selectedComplex.distanceToDistrictM / 1000).toFixed(1)}km · 약 ${selectedComplex.estimatedMinutesToDistrict}분 (직선거리 추정)`
                : "거리 정보 없음"}
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <p className="mb-2 text-xs font-medium text-neutral-500">
              {selectedComplex.complexName} 실거래가 추이
            </p>
            <TransactionTrendChart
              data={selectedComplex.trend.map((t) => ({
                periodDate: formatMonth(t.periodDate),
                avgPricePerPyeong: t.avgPricePerPyeong,
                transactionCount: t.transactionCount,
              }))}
            />
          </div>

          <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <p className="mb-2 text-xs font-medium text-neutral-500">
              {selectedComplex.complexName} 실거래 현황 (평수별)
            </p>
            <ComplexTradeTable trades={selectedComplex.recentTrades} />
          </div>
        </div>
      )}
    </div>
  );
}
