import { prisma } from "@/lib/db";
import { DISTRICTS, type DistrictConfig } from "@/lib/districts";

export interface DistrictUpdateResult {
  districtId: string;
  status: "success" | "error";
  message?: string;
}

/**
 * Runs `work` for every fixed district, logging one UpdateLog row per
 * district so a failure on one district doesn't block the others or hide
 * their results.
 */
export async function runForEachDistrict(
  metricType: string,
  work: (district: DistrictConfig) => Promise<void>,
): Promise<DistrictUpdateResult[]> {
  const results: DistrictUpdateResult[] = [];

  for (const district of DISTRICTS) {
    try {
      await work(district);
      await prisma.updateLog.create({
        data: { districtId: district.id, metricType, status: "success" },
      });
      results.push({ districtId: district.id, status: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.updateLog.create({
        data: { districtId: district.id, metricType, status: "error", message },
      });
      results.push({ districtId: district.id, status: "error", message });
    }
  }

  return results;
}
