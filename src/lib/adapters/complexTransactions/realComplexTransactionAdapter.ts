import type { DistrictConfig } from "@/lib/districts";
import type {
  ComplexTransactionSnapshotInput,
  DataSourceAdapter,
} from "@/lib/adapters/types";
import { fetchDistrictTrades } from "@/lib/molit/fetchDistrictTrades";
import { mean, median } from "@/lib/molit/aggregate";

const PROPERTY_TYPE = "아파트";

/**
 * Real adapter for per-complex 실거래가 (국토교통부 아파트매매 실거래자료).
 * Same radius-filtered trade set as realTransactionAdapter, grouped by
 * complex name (아파트명) instead of flattened district-wide.
 */
export class RealComplexTransactionAdapter
  implements DataSourceAdapter<ComplexTransactionSnapshotInput[]>
{
  readonly sourceName = "molit";
  readonly cadence = "daily" as const;

  async fetch(district: DistrictConfig): Promise<ComplexTransactionSnapshotInput[]> {
    const trades = await fetchDistrictTrades(district);

    const byGroup = new Map<string, typeof trades>();
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
        propertyType: PROPERTY_TYPE,
        raw: null,
      });
    }

    return snapshots;
  }
}

export const realComplexTransactionAdapter = new RealComplexTransactionAdapter();
