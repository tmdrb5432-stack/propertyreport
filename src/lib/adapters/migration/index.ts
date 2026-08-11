import type { DataSourceAdapter, MigrationSnapshotInput } from "@/lib/adapters/types";
import { mockMigrationAdapter } from "./mockMigrationAdapter";
import { realMigrationAdapter } from "./realMigrationAdapter";

export const migrationAdapter: DataSourceAdapter<MigrationSnapshotInput[]> =
  process.env.MIGRATION_DATA_SOURCE === "real"
    ? realMigrationAdapter
    : mockMigrationAdapter;
