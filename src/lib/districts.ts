export interface DistrictConfig {
  id: string;
  nameKo: string;
  nameEn: string;
  lat: number;
  lng: number;
  radiusM: number;
}

// Shared search radius for job-housing proximity (직주근접): company search,
// transit search, and top-complex apartment search all scope to this same
// radius from each district's center, so "회사/교통/아파트 단지가 이 지구와
// 얼마나 가까운가" means the same thing everywhere in the app.
export const PROXIMITY_RADIUS_M = 5000;

// Fixed set of 5 business districts this dashboard analyzes.
export const DISTRICTS: DistrictConfig[] = [
  {
    id: "gwanghwamun",
    nameKo: "광화문",
    nameEn: "Gwanghwamun",
    lat: 37.5717,
    lng: 126.9764,
    radiusM: PROXIMITY_RADIUS_M,
  },
  {
    id: "yeouido",
    nameKo: "여의도",
    nameEn: "Yeouido",
    lat: 37.5219,
    lng: 126.9245,
    radiusM: PROXIMITY_RADIUS_M,
  },
  {
    id: "gangnam",
    nameKo: "강남",
    nameEn: "Gangnam",
    lat: 37.4979,
    lng: 127.0276,
    radiusM: PROXIMITY_RADIUS_M,
  },
  {
    id: "pangyo",
    nameKo: "판교",
    nameEn: "Pangyo",
    lat: 37.3947,
    lng: 127.1112,
    radiusM: PROXIMITY_RADIUS_M,
  },
  {
    id: "magok",
    nameKo: "마곡",
    nameEn: "Magok",
    lat: 37.5605,
    lng: 126.8286,
    radiusM: PROXIMITY_RADIUS_M,
  },
];

export function getDistrict(id: string): DistrictConfig | undefined {
  return DISTRICTS.find((d) => d.id === id);
}
