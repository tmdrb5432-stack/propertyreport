import type { DistrictConfig } from "@/lib/districts";
import type {
  ComplexTransactionSnapshotInput,
  DataSourceAdapter,
} from "@/lib/adapters/types";
import { randRange, seededRandom } from "@/lib/adapters/mockRng";
import {
  BASE_PRICE_PER_PYEONG,
  monthStart,
} from "@/lib/adapters/transactions/mockTransactionAdapter";

const HISTORY_MONTHS = 6;
const PROPERTY_TYPE = "아파트";

// Illustrative complex names within each district's ~5km search radius
// (see PROXIMITY_RADIUS_M in src/lib/districts.ts) — not sourced from any
// real dataset. Prices are generated from the district's existing mock base
// level, so swapping in real MOLIT data later (which reports 아파트명 per
// transaction) is a drop-in replacement with no schema/UI changes.
const COMPLEX_NAMES: Record<string, string[]> = {
  gwanghwamun: ["경희궁자이", "인왕산아이파크", "서대문푸르지오", "광화문스페이스본"],
  yeouido: ["여의도자이", "브라이튼여의도", "여의도파크센트레빌", "목동트리플하이엔"],
  gangnam: ["래미안대치팰리스", "타워팰리스", "도곡렉슬", "은마아파트", "반포자이"],
  pangyo: ["판교푸르지오그랑블", "판교원마을", "봇들마을", "산운마을"],
  magok: ["마곡엠밸리", "마곡푸르지오", "마곡13단지", "마곡호반베르디움"],
};

export class MockComplexTransactionAdapter
  implements DataSourceAdapter<ComplexTransactionSnapshotInput[]>
{
  readonly sourceName = "mock";
  readonly cadence = "daily" as const;

  async fetch(
    district: DistrictConfig,
  ): Promise<ComplexTransactionSnapshotInput[]> {
    const base = BASE_PRICE_PER_PYEONG[district.id] ?? 5000;
    const complexNames = COMPLEX_NAMES[district.id] ?? [];
    const snapshots: ComplexTransactionSnapshotInput[] = [];

    for (const complexName of complexNames) {
      const rng = seededRandom(`complexTransaction:${district.id}:${complexName}`);
      // Each complex sits at a fixed multiplier off the district base level,
      // so some complexes are consistently pricier than others (like real markets).
      let level = base * randRange(rng, 0.85, 1.35);

      for (let monthsAgo = HISTORY_MONTHS - 1; monthsAgo >= 0; monthsAgo--) {
        level *= randRange(rng, 0.985, 1.03);
        const avgPricePerPyeong = Math.round(level);
        const avgPyeongSize = randRange(rng, 24, 34);
        const avgPriceTotal = Math.round(avgPricePerPyeong * avgPyeongSize);
        const transactionCount = Math.round(randRange(rng, 2, 15));
        const periodDate = monthStart(monthsAgo);

        // Synthetic individual trades around the month's average, so the
        // "그 아파트 클릭 -> 실거래 현황" detail view has something to show
        // even without real MOLIT data — same raw shape as the real adapter.
        const trades = Array.from({ length: transactionCount }, () => {
          const areaPyeong = randRange(rng, 20, 40);
          const pricePerPyeong = Math.round(avgPricePerPyeong * randRange(rng, 0.9, 1.1));
          const dayOfMonth = Math.max(1, Math.round(randRange(rng, 1, 28)));
          const dealDate = new Date(periodDate);
          dealDate.setUTCDate(dayOfMonth);
          return {
            dealDate: dealDate.toISOString(),
            areaPyeong: Math.round(areaPyeong * 10) / 10,
            pricePerPyeong,
            priceTotal: Math.round(pricePerPyeong * areaPyeong),
          };
        }).sort((a, b) => b.dealDate.localeCompare(a.dealDate));

        snapshots.push({
          periodDate,
          complexName,
          avgPricePerPyeong,
          avgPriceTotal,
          medianPriceTotal: Math.round(avgPriceTotal * randRange(rng, 0.95, 1.05)),
          transactionCount,
          propertyType: PROPERTY_TYPE,
          raw: trades,
        });
      }
    }

    return snapshots;
  }
}

export const mockComplexTransactionAdapter = new MockComplexTransactionAdapter();
