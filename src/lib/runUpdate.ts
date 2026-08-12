import { prisma } from "@/lib/db";
import { DISTRICTS, type DistrictConfig } from "@/lib/districts";

export interface DistrictUpdateResult {
  districtId: string;
  status: "success" | "error";
  message?: string;
}

/**
 * Runs `work` for every fixed district IN PARALLEL, logging one UpdateLog
 * row per district so a failure on one district doesn't block the others or
 * hide their results. Districts are independent (separate LAWD_CD/network
 * calls), and running them sequentially was the main reason the MOLIT-backed
 * routes were blowing past Vercel's 60s function cap — 5 districts x
 * (network fetch + geocoding) summed instead of running concurrently.
 */
export async function runForEachDistrict(
  metricType: string,
  work: (district: DistrictConfig) => Promise<void>,
): Promise<DistrictUpdateResult[]> {
  return Promise.all(
    DISTRICTS.map(async (district): Promise<DistrictUpdateResult> => {
      try {
        await work(district);
        await prisma.updateLog.create({
          data: { districtId: district.id, metricType, status: "success" },
        });
        return { districtId: district.id, status: "success" };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.updateLog.create({
          data: { districtId: district.id, metricType, status: "error", message },
        });
        return { districtId: district.id, status: "error", message };
      }
    }),
  );
}
