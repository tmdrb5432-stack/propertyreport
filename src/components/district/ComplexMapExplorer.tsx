"use client";

import type { TopComplex } from "@/lib/queries";
import { KakaoMapView, type MapMarkerData } from "@/components/map/KakaoMapView";
import { TopComplexList } from "@/components/district/TopComplexList";

export function ComplexMapExplorer({
  district,
  complexes,
  selected,
  onSelect,
  focusMarker,
}: {
  district: { lat: number; lng: number };
  complexes: TopComplex[];
  selected: string | null;
  onSelect: (complexName: string) => void;
  /** An extra marker to plot + center on (e.g. a clicked 주요회사 entry). */
  focusMarker?: MapMarkerData | null;
}) {
  if (complexes.length === 0) {
    return <p className="text-sm text-neutral-500">아직 단지별 실거래가 데이터가 없습니다.</p>;
  }

  const complexMarkers = complexes
    .map((c, i) => ({ complex: c, rank: i + 1 }))
    .filter(({ complex }) => complex.lat !== null && complex.lng !== null)
    .map(({ complex, rank }) => ({
      id: complex.complexName,
      lat: complex.lat as number,
      lng: complex.lng as number,
      label: `${rank}. ${complex.complexName}`,
    }));
  const markers = focusMarker ? [...complexMarkers, focusMarker] : complexMarkers;

  const selectedComplex = complexes.find((c) => c.complexName === selected) ?? null;
  const focus = focusMarker ?? (selectedComplex?.lat != null && selectedComplex?.lng != null
    ? { lat: selectedComplex.lat, lng: selectedComplex.lng }
    : null);
  const mapCenter = focus ? { lat: focus.lat, lng: focus.lng } : { lat: district.lat, lng: district.lng };

  return (
    <div className="space-y-4">
      <div className="h-56 overflow-hidden rounded-xl">
        {markers.length > 0 ? (
          <KakaoMapView
            markers={markers}
            center={mapCenter}
            level={focus ? 4 : 6}
            onMarkerClick={onSelect}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
            단지 위치를 아직 찾지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}
      </div>

      <TopComplexList complexes={complexes} selected={selected} onSelect={onSelect} />
    </div>
  );
}
