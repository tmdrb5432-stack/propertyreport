import type { DistrictConfig } from "@/lib/districts";
import type {
  DataSourceAdapter,
  TransactionSnapshotInput,
} from "@/lib/adapters/types";
import { NotImplementedError } from "@/lib/adapters/types";

/**
 * Real adapter for 국토교통부 아파트 실거래가 (공공데이터포털).
 *
 * Not implemented yet — the user does not have a 공공데이터포털 API key.
 * Once obtained (https://www.data.go.kr, "국토교통부_아파트매매 실거래자료"),
 * implement `fetch` to call the MOLIT endpoint and map its response into
 * `TransactionSnapshotInput[]` — the shape below already matches what the
 * dashboard/schema expect, so no other code needs to change.
 */
export class RealTransactionAdapter
  implements DataSourceAdapter<TransactionSnapshotInput[]>
{
  readonly sourceName = "molit";
  readonly cadence = "daily" as const;

  async fetch(_district: DistrictConfig): Promise<TransactionSnapshotInput[]> {
    throw new NotImplementedError(
      "RealTransactionAdapter requires a MOLIT_REALTRANSACTION_API_KEY (공공데이터포털) which is not configured yet.",
    );
  }
}

export const realTransactionAdapter = new RealTransactionAdapter();
