import type { DistrictConfig } from "@/lib/districts";
import type {
  AskingPriceSnapshotInput,
  DataSourceAdapter,
} from "@/lib/adapters/types";
import { NotImplementedError } from "@/lib/adapters/types";

/**
 * Real adapter for 호가 (asking price).
 *
 * There is no official public API for asking prices — a real implementation
 * would require crawling a portal such as Naver 부동산, which has its own
 * Terms of Service. Do NOT implement scraping here without a legal review of
 * the target site's ToS and rate-limiting/robots.txt constraints first. This
 * is intentionally out of scope for this build.
 */
export class RealAskingPriceAdapter
  implements DataSourceAdapter<AskingPriceSnapshotInput[]>
{
  readonly sourceName = "crawled";
  readonly cadence = "manual" as const;

  async fetch(_district: DistrictConfig): Promise<AskingPriceSnapshotInput[]> {
    throw new NotImplementedError(
      "RealAskingPriceAdapter is not implemented: no official asking-price API exists. " +
        "A real implementation requires crawling a portal (e.g. Naver 부동산) and a legal/ToS review first.",
    );
  }
}

export const realAskingPriceAdapter = new RealAskingPriceAdapter();
