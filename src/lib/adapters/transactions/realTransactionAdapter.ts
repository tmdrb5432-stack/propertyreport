import type { DistrictConfig } from "@/lib/districts";
import type {
  DataSourceAdapter,
  TransactionSnapshotInput,
} from "@/lib/adapters/types";
import { fetchDistrictTrades } from "@/lib/molit/fetchDistrictTrades";
import { mean, median } from "@/lib/molit/aggregate";

const PROPERTY_TYPE = "아파트";

/**
 * Real adapter for 국토교통부 아파트 실거래가 (공공데이터포털,
 * getRTMSDataSvcAptTradeDev). Fetches 6 months of trades for the district's
 * sigungu (LAWD_CD), keeps only trades within PROXIMITY_RADIUS_M of the
 * district center (via fetchDistrictTrades' Kakao-geocode filter), and
 * aggregates per month across all qualifying complexes.
 */
export class RealTransactionAdapter
  implements DataSourceAdapter<TransactionSnapshotInput[]>
{
  readonly sourceName = "molit";
  readonly cadence = "daily" as const;

  async fetch(district: DistrictConfig): Promise<TransactionSnapshotInput[]> {
    const trades = await fetchDistrictTrades(district);

    const byMonth = new Map<string, typeof trades>();
    for (const trade of trades) {
      const key = trade.periodDate.toISOString();
      const existing = byMonth.get(key);
      if (existing) existing.push(trade);
      else byMonth.set(key, [trade]);
    }

    const snapshots: TransactionSnapshotInput[] = [];
    for (const [key, monthTrades] of byMonth) {
      const pricesPerPyeong = monthTrades.map((t) => t.pricePerPyeong);
      const totals = monthTrades.map((t) => t.priceTotal);
      snapshots.push({
        periodDate: new Date(key),
        avgPricePerPyeong: Math.round(mean(pricesPerPyeong)),
        avgPriceTotal: Math.round(mean(totals)),
        medianPriceTotal: Math.round(median(totals)),
        transactionCount: monthTrades.length,
        propertyType: PROPERTY_TYPE,
        raw: null,
      });
    }

    return snapshots;
  }
}

export const realTransactionAdapter = new RealTransactionAdapter();
