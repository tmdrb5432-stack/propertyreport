import type { DistrictConfig } from "@/lib/districts";
import type {
  ComplexTransactionSnapshotInput,
  DataSourceAdapter,
} from "@/lib/adapters/types";
import { fetchDistrictTrades, type DistrictTrade, type MolitPropertyType } from "@/lib/molit/fetchDistrictTrades";
import { mean, median } from "@/lib/molit/aggregate";

const PROPERTY_TYPES: MolitPropertyType[] = ["아파트", "오피스텔"];

function groupToSnapshots(
  trades: DistrictTrade[],
  propertyType: MolitPropertyType,
): ComplexTransactionSnapshotInput[] {
  const byGroup = new Map<string, DistrictTrade[]>();
  for (const trade of trades) {
    const key = `${trade.complexName}::${trade.periodDate.toISOString()}`;
    const existing = byGroup.get(key);
    if (existing) existing.push(trade);
    else byGroup.set(key, [trade]);
  }

  const snapshots: ComplexTransactionSnapshotInput[] = [];
  for (const groupTrades of byGroup.values()) {
    const pricesPerPyeong = groupTrades.map((t) => t.pricePerPyeong);
    const totals = groupTrades.map((t) => t.priceTotal);
    snapshots.push({
      periodDate: groupTrades[0].periodDate,
      complexName: groupTrades[0].complexName,
      avgPricePerPyeong: Math.round(mean(pricesPerPyeong)),
      avgPriceTotal: Math.round(mean(totals)),
      medianPriceTotal: Math.round(median(totals)),
      transactionCount: groupTrades.length,
      propertyType,
      raw: groupTrades
        .map((t) => ({
          dealDate: t.dealDate.toISOString(),
          areaM2: Math.round(t.areaM2 * 100) / 100,
          areaPyeong: Math.round(t.areaPyeong * 10) / 10,
          pricePerPyeong: Math.round(t.pricePerPyeong),
          priceTotal: t.priceTotal,
          buildYear: t.buildYear,
        }))
        .sort((a, b) => b.dealDate.localeCompare(a.dealDate)),
    });
  }

  return snapshots;
}

/**
 * Real adapter for per-complex 실거래가 (국토교통부 아파트/오피스텔매매
 * 실거래자료). Same radius-filtered trade set as realTransactionAdapter,
 * grouped by complex name instead of flattened district-wide.
 *
 * 오피스텔 is a separate data.go.kr 활용신청 from 아파트 — if the caller's
 * key isn't approved for it yet, MOLIT rejects the request and we swallow
 * that here so 아파트 data (already working) doesn't go down because of it.
 */
export class RealComplexTransactionAdapter
  implements DataSourceAdapter<ComplexTransactionSnapshotInput[]>
{
  readonly sourceName = "molit";
  readonly cadence = "daily" as const;

  async fetch(district: DistrictConfig): Promise<ComplexTransactionSnapshotInput[]> {
    const results = await Promise.all(
      PROPERTY_TYPES.map(async (propertyType) => {
        try {
          const trades = await fetchDistrictTrades(district, propertyType);
          return groupToSnapshots(trades, propertyType);
        } catch (err) {
          if (propertyType === "오피스텔") {
            console.warn(
              `[realComplexTransactionAdapter] 오피스텔 실거래 조회 실패 (활용신청 미승인일 수 있음) — 아파트 데이터는 정상 진행: ${
                err instanceof Error ? err.message : err
              }`,
            );
            return [];
          }
          throw err;
        }
      }),
    );

    return results.flat();
  }
}

export const realComplexTransactionAdapter = new RealComplexTransactionAdapter();
