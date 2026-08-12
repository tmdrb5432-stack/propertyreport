"use client";

import { KakaoMapView } from "@/components/map/KakaoMapView";
import { useFocusedCompany } from "@/components/district/FocusedCompanyContext";

export function TopDistrictMap({
  district,
}: {
  district: { id: string; lat: number; lng: number; nameKo: string };
}) {
  const { focusedCompany } = useFocusedCompany();
  const hasCompanyCoords =
    focusedCompany !== null && focusedCompany.lat !== null && focusedCompany.lng !== null;

  const markers = [
    { id: district.id, lat: district.lat, lng: district.lng, label: district.nameKo },
    ...(hasCompanyCoords
      ? [
          {
            id: `company:${focusedCompany!.name}`,
            lat: focusedCompany!.lat as number,
            lng: focusedCompany!.lng as number,
            label: focusedCompany!.name,
          },
        ]
      : []),
  ];

  const center = hasCompanyCoords
    ? { lat: focusedCompany!.lat as number, lng: focusedCompany!.lng as number }
    : { lat: district.lat, lng: district.lng };

  return (
    <div className="h-64 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
      <KakaoMapView markers={markers} center={center} level={hasCompanyCoords ? 4 : 6} />
    </div>
  );
}
