"use client";

import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";
import { MapPlaceholder } from "./MapPlaceholder";

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  label: string;
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
      {markers.map((marker) => (
        <MapMarker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          title={marker.label}
          onClick={() => onMarkerClick?.(marker.id)}
        />
      ))}
    </Map>
  );
}

export function KakaoMapView(props: KakaoMapViewProps) {
  if (!KAKAO_JS_KEY) {
    return <MapPlaceholder />;
  }
  return <LoadedMap {...props} />;
}
