import type { DistrictConfig } from "@/lib/districts";
import type {
  DataSourceAdapter,
  TransactionSnapshotInput,
} from "@/lib/adapters/types";
import { randRange, seededRandom } from "@/lib/adapters/mockRng";

const HISTORY_MONTHS = 6;
const PROPERTY_TYPE = "아파트";

// Illustrative base price level per district (만원/평), roughly reflecting
// relative Seoul-area market intuition. Not sourced from any real dataset —
// purely to make mock trend lines look plausible until MOLIT data is wired in.
const BASE_PRICE_PER_PYEONG: Record<string, number> = {
  gangnam: 8000,
  yeouido: 6500,
  gwanghwamun: 6000,
  pangyo: 4500,
  magok: 3500,
};

function monthStart(monthsAgo: number): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return d;
}

export class MockTransactionAdapter
  implements DataSourceAdapter<TransactionSnapshotInput[]>
{
  readonly sourceName = "mock";
  readonly cadence = "daily" as const;

  async fetch(district: DistrictConfig): Promise<TransactionSnapshotInput[]> {
    const base = BASE_PRICE_PER_PYEONG[district.id] ?? 5000;
    const rng = seededRandom(`transaction:${district.id}`);

    const snapshots: TransactionSnapshotInput[] = [];
    let level = base * randRange(rng, 0.92, 1.0);

    for (let monthsAgo = HISTORY_MONTHS - 1; monthsAgo >= 0; monthsAgo--) {
      level *= randRange(rng, 0.985, 1.03); // mild random-walk drift
      const avgPricePerPyeong = Math.round(level);
      const avgPyeongSize = randRange(rng, 24, 34);
      const avgPriceTotal = Math.round(avgPricePerPyeong * avgPyeongSize);

      snapshots.push({
        periodDate: monthStart(monthsAgo),
        avgPricePerPyeong,
        avgPriceTotal,
        medianPriceTotal: Math.round(avgPriceTotal * randRange(rng, 0.95, 1.05)),
        transactionCount: Math.round(randRange(rng, 15, 90)),
        propertyType: PROPERTY_TYPE,
        raw: null,
      });
    }

    return snapshots;
  }
}

export const mockTransactionAdapter = new MockTransactionAdapter();
