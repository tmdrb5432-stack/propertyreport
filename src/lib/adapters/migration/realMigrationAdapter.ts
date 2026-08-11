import type { DistrictConfig } from "@/lib/districts";
import type {
  DataSourceAdapter,
  MigrationSnapshotInput,
} from "@/lib/adapters/types";
import { NotImplementedError } from "@/lib/adapters/types";

/**
 * Real adapter for 전입/전출 (통계청 KOSIS 국내인구이동통계).
 *
 * Not implemented yet — the user does not have a KOSIS API key. Once
 * obtained (https://kosis.kr/openapi), implement `fetch` to call the KOSIS
 * endpoint for the district's administrative-dong equivalent and map the
 * response into `MigrationSnapshotInput[]` — same shape the mock adapter
 * already produces, so no schema/UI changes are needed.
 */
export class RealMigrationAdapter
  implements DataSourceAdapter<MigrationSnapshotInput[]>
{
  readonly sourceName = "kosis";
  readonly cadence = "monthly" as const;

  async fetch(_district: DistrictConfig): Promise<MigrationSnapshotInput[]> {
    throw new NotImplementedError(
      "RealMigrationAdapter requires a KOSIS_API_KEY (통계청 KOSIS Open API) which is not configured yet.",
    );
  }
}

export const realMigrationAdapter = new RealMigrationAdapter();
