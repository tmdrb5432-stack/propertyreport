import type { DistrictConfig } from "@/lib/districts";
import type {
  ComplexTransactionSnapshotInput,
  DataSourceAdapter,
} from "@/lib/adapters/types";
import { NotImplementedError } from "@/lib/adapters/types";

/**
 * Real adapter for per-complex 실거래가 (국토교통부 아파트매매 실거래자료).
 *
 * Not implemented yet — same MOLIT key gap as realTransactionAdapter.ts. The
 * real API reports an 아파트명 (apartment complex name) per transaction
 * record, which maps directly onto `complexName` here — once a key is
 * available, implement `fetch` to call MOLIT scoped to each district's
 * ~5km radius (PROXIMITY_RADIUS_M in src/lib/districts.ts) and group/average
 * by 아파트명 per period; no schema/UI changes are needed beyond that.
 */
export class RealComplexTransactionAdapter
  implements DataSourceAdapter<ComplexTransactionSnapshotInput[]>
{
  readonly sourceName = "molit";
  readonly cadence = "daily" as const;

  async fetch(
    _district: DistrictConfig,
  ): Promise<ComplexTransactionSnapshotInput[]> {
    throw new NotImplementedError(
      "RealComplexTransactionAdapter requires a MOLIT_REALTRANSACTION_API_KEY (공공데이터포털) which is not configured yet.",
    );
  }
}

export const realComplexTransactionAdapter = new RealComplexTransactionAdapter();
