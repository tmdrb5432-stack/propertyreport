import type {
  ComplexTransactionSnapshotInput,
  DataSourceAdapter,
} from "@/lib/adapters/types";
import { mockComplexTransactionAdapter } from "./mockComplexTransactionAdapter";
import { realComplexTransactionAdapter } from "./realComplexTransactionAdapter";

export const complexTransactionAdapter: DataSourceAdapter<
  ComplexTransactionSnapshotInput[]
> =
  process.env.COMPLEX_TRANSACTION_DATA_SOURCE === "real"
    ? realComplexTransactionAdapter
    : mockComplexTransactionAdapter;
