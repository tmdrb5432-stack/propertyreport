import type { DistrictConfig } from "@/lib/districts";
import type { DataSourceAdapter, TransitSnapshotInput } from "@/lib/adapters/types";
import { searchCategory, searchKeyword, type KakaoDocument } from "./client";

const SUBWAY_CATEGORY_CODE = "SW8";
// Kakao has no bus-stop category code, so we best-effort approximate via keyword search.
const BUS_STOP_QUERY = "버스정류장";

function extractLineName(doc: KakaoDocument): string | null {
  // category_name breadcrumbs look like "교통,수송 > 지하철,전철 > 수도권2호선 > 강남역"
  const parts = doc.category_name.split(">").map((p) => p.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

function computeTransitScore(
  subwayStationCount: number,
  lineCount: number,
  busStopCount: number,
): number {
  // v1 heuristic, not a rigorous accessibility model — weights subway presence
  // heavily (dominant mode for these business districts) with a bus stop assist.
  const raw = subwayStationCount * 8 + lineCount * 10 + busStopCount * 0.5;
  return Math.round(Math.min(100, raw));
}

export class KakaoTransitAdapter
  implements DataSourceAdapter<TransitSnapshotInput>
{
  readonly sourceName = "kakao";
  readonly cadence = "daily" as const;

  async fetch(district: DistrictConfig): Promise<TransitSnapshotInput> {
    const [subwayDocs, busDocs] = await Promise.all([
      searchCategory({
        categoryGroupCode: SUBWAY_CATEGORY_CODE,
        x: district.lng,
        y: district.lat,
        radius: district.radiusM,
      }),
      searchKeyword({
        query: BUS_STOP_QUERY,
        x: district.lng,
        y: district.lat,
        radius: district.radiusM,
      }),
    ]);

    const lines = new Set<string>();
    for (const doc of subwayDocs) {
      const line = extractLineName(doc);
      if (line) lines.add(line);
    }

    const subwayLines = [...lines];
    const transitScore = computeTransitScore(
      subwayDocs.length,
      subwayLines.length,
      busDocs.length,
    );

    return {
      subwayLines,
      subwayStationCount: subwayDocs.length,
      busStopCount: busDocs.length,
      transitScore,
      raw: { subwayDocs, busDocs },
    };
  }
}

export const kakaoTransitAdapter = new KakaoTransitAdapter();
