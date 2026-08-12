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
  lat: number | null;
  lng: number | null;
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

// One individual 실거래 record within a month — stored in
// ComplexTransactionSnapshot.raw so the district page can list actual deals
// (평수 + 실거래금액), not just the monthly aggregate.
export interface ComplexTradeRecord {
  dealDate: string; // ISO date string
  areaM2: number;
  areaPyeong: number;
  pricePerPyeong: number;
  priceTotal: number; // 만원
}

export interface ComplexTransactionSnapshotInput {
  periodDate: Date;
  complexName: string;
  avgPricePerPyeong: number | null;
  avgPriceTotal: number | null;
  medianPriceTotal: number | null;
  transactionCount: number;
  propertyType: string;
  raw?: ComplexTradeRecord[] | null;
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
