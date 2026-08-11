export interface DistrictConfig {
  id: string;
  nameKo: string;
  nameEn: string;
  lat: number;
  lng: number;
  radiusM: number;
}

// Fixed set of 5 business districts this dashboard analyzes.
export const DISTRICTS: DistrictConfig[] = [
  {
    id: "gwanghwamun",
    nameKo: "광화문",
    nameEn: "Gwanghwamun",
    lat: 37.5717,
    lng: 126.9764,
    radiusM: 1000,
  },
  {
    id: "yeouido",
    nameKo: "여의도",
    nameEn: "Yeouido",
    lat: 37.5219,
    lng: 126.9245,
    radiusM: 1200,
  },
  {
    id: "gangnam",
    nameKo: "강남",
    nameEn: "Gangnam",
    lat: 37.4979,
    lng: 127.0276,
    radiusM: 1200,
  },
  {
    id: "pangyo",
    nameKo: "판교",
    nameEn: "Pangyo",
    lat: 37.3947,
    lng: 127.1112,
    radiusM: 1500,
  },
  {
    id: "magok",
    nameKo: "마곡",
    nameEn: "Magok",
    lat: 37.5605,
    lng: 126.8286,
    radiusM: 1500,
  },
];

export function getDistrict(id: string): DistrictConfig | undefined {
  return DISTRICTS.find((d) => d.id === id);
}
