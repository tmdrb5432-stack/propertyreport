import type { DataSourceAdapter, TransactionSnapshotInput } from "@/lib/adapters/types";
import { mockTransactionAdapter } from "./mockTransactionAdapter";
import { realTransactionAdapter } from "./realTransactionAdapter";

export const transactionAdapter: DataSourceAdapter<TransactionSnapshotInput[]> =
  process.env.TRANSACTION_DATA_SOURCE === "real"
    ? realTransactionAdapter
    : mockTransactionAdapter;
