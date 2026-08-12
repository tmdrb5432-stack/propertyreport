import type { DistrictConfig } from "@/lib/districts";
import { fetchAptTrades, type MolitTradeRow } from "@/lib/molit/client";
import { getLawdCode } from "@/lib/molit/lawdCodes";
import { resolveComplexLocations } from "@/lib/kakao/geocodeComplex";
import { monthStart } from "@/lib/adapters/transactions/mockTransactionAdapter";

const HISTORY_MONTHS = 6;
const PYEONG_M2 = 3.3058;
const EARTH_RADIUS_M = 6371000;

export interface DistrictTrade {
  complexName: string;
  periodDate: Date; // month bucket, matches mock adapters' monthStart()
  pricePerPyeong: number;
  priceTotal: number; // 만원
}

function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

function dealYmdMonths(): string[] {
  const months: string[] = [];
  for (let monthsAgo = HISTORY_MONTHS - 1; monthsAgo >= 0; monthsAgo--) {
    const d = monthStart(monthsAgo);
    months.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

/**
 * Fetches the last 6 months of MOLIT 아파트매매 실거래 rows for a district's
 * sigungu, geocodes+caches each unique complex name (via
 * ComplexLocationCache), and filters down to trades whose complex falls
 * within the district's PROXIMITY_RADIUS_M. Shared by both real adapters —
 * district-level aggregates just flatten this, complex-level groups by name.
 */
export async function fetchDistrictTrades(district: DistrictConfig): Promise<DistrictTrade[]> {
  const lawdCd = getLawdCode(district.id);
  const months = dealYmdMonths();

  const monthlyRows = await Promise.all(months.map((ym) => fetchAptTrades(lawdCd, ym)));
  const allRows: { row: MolitTradeRow; periodDate: Date }[] = [];
  monthlyRows.forEach((rows, i) => {
    const periodDate = monthStart(HISTORY_MONTHS - 1 - i);
    for (const row of rows) allRows.push({ row, periodDate });
  });

  const uniqueNames = Array.from(new Set(allRows.map((r) => r.row.aptName)));
  const locations = await resolveComplexLocations(
    district.id,
    uniqueNames,
    { lat: district.lat, lng: district.lng },
    district.radiusM,
  );

  const trades: DistrictTrade[] = [];
  for (const { row, periodDate } of allRows) {
    const loc = locations.get(row.aptName);
    if (!loc) continue; // not geocodable — exclude rather than risk counting an out-of-area trade.
    if (haversineM(loc, { lat: district.lat, lng: district.lng }) > district.radiusM) continue;

    trades.push({
      complexName: row.aptName,
      periodDate,
      pricePerPyeong: row.dealAmountManwon / (row.areaM2 / PYEONG_M2),
      priceTotal: row.dealAmountManwon,
    });
  }

  return trades;
}
