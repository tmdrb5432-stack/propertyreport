import type { AskingPriceSnapshotInput, DataSourceAdapter } from "@/lib/adapters/types";
import { mockAskingPriceAdapter } from "./mockAskingPriceAdapter";
import { realAskingPriceAdapter } from "./realAskingPriceAdapter";

export const askingPriceAdapter: DataSourceAdapter<AskingPriceSnapshotInput[]> =
  process.env.ASKING_PRICE_DATA_SOURCE === "real"
    ? realAskingPriceAdapter
    : mockAskingPriceAdapter;
