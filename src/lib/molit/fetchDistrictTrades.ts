import type { DistrictConfig } from "@/lib/districts";
import { fetchAptTrades, fetchOfficetelTrades, type MolitTradeRow } from "@/lib/molit/client";
import { getLawdCode } from "@/lib/molit/lawdCodes";
import { resolveComplexLocations } from "@/lib/kakao/geocodeComplex";
import { monthStart } from "@/lib/adapters/transactions/mockTransactionAdapter";
import { haversineM } from "@/lib/geo";

const HISTORY_MONTHS = 6;
const PYEONG_M2 = 3.3058;

const MOLIT_FETCHERS = {
  아파트: fetchAptTrades,
  오피스텔: fetchOfficetelTrades,
} as const;

export type MolitPropertyType = keyof typeof MOLIT_FETCHERS;

export interface DistrictTrade {
  complexName: string;
  periodDate: Date; // month bucket, matches mock adapters' monthStart()
  dealDate: Date; // exact contract date, for the per-transaction detail view
  areaM2: number;
  areaPyeong: number;
  pricePerPyeong: number;
  priceTotal: number; // 만원
  buildYear: number | null;
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
 * Fetches the last 6 months of MOLIT 실거래 rows (아파트 or 오피스텔, per
 * `propertyType`) for a district's sigungu, geocodes+caches each unique
 * complex name (via ComplexLocationCache), and filters down to trades whose
 * complex falls within the district's PROXIMITY_RADIUS_M. Shared by both
 * real adapters — district-level aggregates just flatten this,
 * complex-level groups by name.
 */
export async function fetchDistrictTrades(
  district: DistrictConfig,
  propertyType: MolitPropertyType = "아파트",
): Promise<DistrictTrade[]> {
  const lawdCd = getLawdCode(district.id);
  const months = dealYmdMonths();
  const fetchTrades = MOLIT_FETCHERS[propertyType];

  const monthlyRows = await Promise.all(months.map((ym) => fetchTrades(lawdCd, ym)));
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
      dealDate: row.dealDate,
      areaM2: row.areaM2,
      areaPyeong: row.areaM2 / PYEONG_M2,
      pricePerPyeong: row.dealAmountManwon / (row.areaM2 / PYEONG_M2),
      priceTotal: row.dealAmountManwon,
      buildYear: row.buildYear,
    });
  }

  return trades;
}
