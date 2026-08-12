"use client";

import { CustomOverlayMap, Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";
import { MapPlaceholder } from "./MapPlaceholder";
import { chartColors } from "@/lib/chartTheme";

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

// Matches RankBadge's gold/silver/bronze accent for 1st-3rd, neutral after.
const RANK_MARKER_COLORS = ["#eda100", "#898781", "#b08d57"];

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** When set, renders a numbered badge pin instead of the default marker — for ranked results (e.g. TOP5). */
  rank?: number;
}

interface KakaoMapViewProps {
  markers: MapMarkerData[];
  center?: { lat: number; lng: number };
  level?: number;
  onMarkerClick?: (id: string) => void;
}

function LoadedMap({ markers, center, level, onMarkerClick }: KakaoMapViewProps) {
  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_JS_KEY as string,
    libraries: ["services"],
  });

  if (error) {
    return (
      <MapPlaceholder message="카카오맵을 불러오지 못했습니다. JavaScript 키와 도메인 등록을 확인하세요." />
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[240px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
        지도를 불러오는 중...
      </div>
    );
  }

  const mapCenter = center ?? markers[0] ?? { lat: 37.5665, lng: 126.978 };

  return (
    <Map
      center={mapCenter}
      level={level ?? 8}
      style={{ width: "100%", height: "100%", minHeight: 240, borderRadius: 12 }}
    >
      {markers.map((marker) =>
        marker.rank !== undefined ? (
          <CustomOverlayMap
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            yAnchor={1}
            clickable
          >
            <button
              type="button"
              title={marker.label}
              onClick={() => onMarkerClick?.(marker.id)}
              className="flex h-7 w-7 -translate-y-1 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md"
              style={{ background: RANK_MARKER_COLORS[marker.rank - 1] ?? chartColors.mutedInk }}
            >
              {marker.rank}
            </button>
          </CustomOverlayMap>
        ) : (
          <MapMarker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.label}
            onClick={() => onMarkerClick?.(marker.id)}
          />
        ),
      )}
    </Map>
  );
}

export function KakaoMapView(props: KakaoMapViewProps) {
  if (!KAKAO_JS_KEY) {
    return <MapPlaceholder />;
  }
  return <LoadedMap {...props} />;
}
