import type { DistrictConfig } from "@/lib/districts";
import type {
  AskingPriceSnapshotInput,
  DataSourceAdapter,
} from "@/lib/adapters/types";
import { randRange, seededRandom } from "@/lib/adapters/mockRng";

const HISTORY_WEEKS = 8;
const PROPERTY_TYPE = "아파트";

// Asking prices mocked slightly above the mock transaction base to reflect
// the typical (illustrative only) gap between listed and closed prices.
const BASE_ASKING_PER_PYEONG: Record<string, number> = {
  gangnam: 8600,
  yeouido: 6900,
  gwanghwamun: 6400,
  pangyo: 4800,
  magok: 3750,
};

function weekStart(weeksAgo: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() - weeksAgo * 7);
  return d;
}

export class MockAskingPriceAdapter
  implements DataSourceAdapter<AskingPriceSnapshotInput[]>
{
  readonly sourceName = "mock";
  readonly cadence = "daily" as const;

  async fetch(district: DistrictConfig): Promise<AskingPriceSnapshotInput[]> {
    const base = BASE_ASKING_PER_PYEONG[district.id] ?? 5200;
    const rng = seededRandom(`asking:${district.id}`);

    const snapshots: AskingPriceSnapshotInput[] = [];
    let level = base * randRange(rng, 0.95, 1.02);

    for (let weeksAgo = HISTORY_WEEKS - 1; weeksAgo >= 0; weeksAgo--) {
      level *= randRange(rng, 0.99, 1.02);
      const avgAskingPricePerPyeong = Math.round(level);
      const avgPyeongSize = randRange(rng, 24, 34);

      snapshots.push({
        periodDate: weekStart(weeksAgo),
        avgAskingPricePerPyeong,
        avgAskingPriceTotal: Math.round(avgAskingPricePerPyeong * avgPyeongSize),
        listingCount: Math.round(randRange(rng, 30, 150)),
        propertyType: PROPERTY_TYPE,
        raw: null,
      });
    }

    return snapshots;
  }
}

export const mockAskingPriceAdapter = new MockAskingPriceAdapter();
