import { prisma } from "@/lib/db";

export interface FreshnessInfo {
  metricType: string;
  ranAt: Date | null;
  status: "success" | "error" | "never";
  message: string | null;
}

const METRIC_TYPES = ["transit", "company", "transaction", "asking", "migration"] as const;

/** Latest UpdateLog entry per metric type for a single district. */
export async function getDistrictFreshness(districtId: string): Promise<FreshnessInfo[]> {
  const logs = await prisma.updateLog.findMany({
    where: { districtId },
    orderBy: { ranAt: "desc" },
  });

  return METRIC_TYPES.map((metricType) => {
    const latest = logs.find((l) => l.metricType === metricType);
    if (!latest) {
      return { metricType, ranAt: null, status: "never" as const, message: null };
    }
    return {
      metricType,
      ranAt: latest.ranAt,
      status: latest.status as "success" | "error",
      message: latest.message,
    };
  });
}

export function formatRelativeKorean(date: Date | null): string {
  if (!date) return "업데이트 기록 없음";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "방금 전 업데이트";
  if (diffMin < 60) return `${diffMin}분 전 업데이트`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전 업데이트`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전 업데이트`;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} 업데이트`;
}
