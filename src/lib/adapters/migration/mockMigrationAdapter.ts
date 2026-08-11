import type { DistrictConfig } from "@/lib/districts";
import type {
  DataSourceAdapter,
  MigrationSnapshotInput,
} from "@/lib/adapters/types";
import { randRange, seededRandom } from "@/lib/adapters/mockRng";

const HISTORY_MONTHS = 6;

// Illustrative base monthly migration volume per district (larger residential
// catchment areas get bigger mock in/out flows). Not sourced from KOSIS.
const BASE_VOLUME: Record<string, number> = {
  gangnam: 3200,
  yeouido: 1400,
  gwanghwamun: 1100,
  pangyo: 2600,
  magok: 2200,
};

function monthLabel(monthsAgo: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export class MockMigrationAdapter
  implements DataSourceAdapter<MigrationSnapshotInput[]>
{
  readonly sourceName = "mock";
  readonly cadence = "monthly" as const;

  async fetch(district: DistrictConfig): Promise<MigrationSnapshotInput[]> {
    const base = BASE_VOLUME[district.id] ?? 1500;
    const snapshots: MigrationSnapshotInput[] = [];

    for (let monthsAgo = HISTORY_MONTHS - 1; monthsAgo >= 0; monthsAgo--) {
      const rng = seededRandom(`migration:${district.id}:${monthLabel(monthsAgo)}`);
      const inMigration = Math.round(base * randRange(rng, 0.85, 1.15));
      const outMigration = Math.round(base * randRange(rng, 0.85, 1.15));

      snapshots.push({
        periodMonth: monthLabel(monthsAgo),
        inMigration,
        outMigration,
        netMigration: inMigration - outMigration,
        raw: null,
      });
    }

    return snapshots;
  }
}

export const mockMigrationAdapter = new MockMigrationAdapter();
