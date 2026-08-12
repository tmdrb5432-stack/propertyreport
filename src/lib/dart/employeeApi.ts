import { prisma } from "@/lib/db";
import { fetchEmployeeStatus } from "./client";

const REPORT_CODE = "11011"; // 사업보고서 (annual)
const CACHE_TTL_DAYS = 30;

function parseCount(sm: string | null): number {
  if (!sm) return 0;
  const n = Number(sm.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function sumEmployeesForYear(
  corpCode: string,
  bsnsYear: string,
): Promise<number | null> {
  const rows = await fetchEmployeeStatus(corpCode, bsnsYear, REPORT_CODE);
  if (rows.length === 0) return null;
  return rows.reduce((sum, row) => sum + parseCount(row.sm), 0);
}

/**
 * Real employee count for a listed company via OpenDART's 직원현황
 * (empSttus.json), read-through cached in `DartEmployeeCache` for
 * `CACHE_TTL_DAYS` so repeated cron runs don't re-hit DART for the same
 * company. Tries the most recent completed fiscal year, then one year back,
 * since a company's latest 사업보고서 may not be filed yet within the year.
 */
export async function getCachedEmployeeCount(corpCode: string): Promise<number | null> {
  const cached = await prisma.dartEmployeeCache.findUnique({ where: { corpCode } });
  if (cached) {
    const ageMs = Date.now() - cached.fetchedAt.getTime();
    if (ageMs < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
      return cached.employeeCount;
    }
  }

  const currentYear = new Date().getFullYear();
  const candidateYears = [String(currentYear - 1), String(currentYear - 2)];

  let employeeCount: number | null = null;
  let usedYear = candidateYears[0];
  for (const year of candidateYears) {
    employeeCount = await sumEmployeesForYear(corpCode, year);
    if (employeeCount !== null) {
      usedYear = year;
      break;
    }
  }

  await prisma.dartEmployeeCache.upsert({
    where: { corpCode },
    update: { employeeCount, bsnsYear: usedYear, reprtCode: REPORT_CODE, fetchedAt: new Date() },
    create: { corpCode, employeeCount, bsnsYear: usedYear, reprtCode: REPORT_CODE },
  });

  return employeeCount;
}
