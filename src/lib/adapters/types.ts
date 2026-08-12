import type { DistrictConfig } from "@/lib/districts";

export type UpdateCadence = "daily" | "monthly" | "manual";

export interface DataSourceAdapter<TResult> {
  readonly sourceName: string;
  readonly cadence: UpdateCadence;
  fetch(district: DistrictConfig): Promise<TResult>;
}

export interface NotableCompany {
  name: string;
  category: string;
  address: string;
  /** Employee count if resolved (real DART figure or a size heuristic), else null. */
  employeeCount: number | null;
  /** "dart" = real OpenDART 직원현황 data (listed companies only); "estimate" = category-based heuristic. */
  employeeCountSource: "dart" | "estimate" | null;
}

export interface CompanySnapshotInput {
  companyCount: number;
  employeeCount: number | null;
  notableCompanies: NotableCompany[];
  raw?: unknown;
}

export interface TransitSnapshotInput {
  subwayLines: string[];
  subwayStationCount: number;
  busStopCount: number;
  transitScore: number;
  raw?: unknown;
}

export interface TransactionSnapshotInput {
  periodDate: Date;
  avgPricePerPyeong: number | null;
  avgPriceTotal: number | null;
  medianPriceTotal: number | null;
  transactionCount: number;
  propertyType: string;
  raw?: unknown;
}

export interface ComplexTransactionSnapshotInput {
  periodDate: Date;
  complexName: string;
  avgPricePerPyeong: number | null;
  avgPriceTotal: number | null;
  medianPriceTotal: number | null;
  transactionCount: number;
  propertyType: string;
  raw?: unknown;
}

export interface AskingPriceSnapshotInput {
  periodDate: Date;
  avgAskingPricePerPyeong: number | null;
  avgAskingPriceTotal: number | null;
  listingCount: number;
  propertyType: string;
  raw?: unknown;
}

export interface MigrationSnapshotInput {
  periodMonth: string;
  inMigration: number;
  outMigration: number;
  netMigration: number;
  raw?: unknown;
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}
