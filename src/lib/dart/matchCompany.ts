import { prisma } from "@/lib/db";

const SUFFIX_PATTERN = /(\(주\)|㈜|주식회사|\s+)/g;

function normalize(name: string): string {
  return name.replace(SUFFIX_PATTERN, "").trim();
}

export interface CorpNameIndex {
  byName: Map<string, string>; // normalized corpName -> corpCode
}

/**
 * Loads the (bounded — listed companies only, a few thousand rows) corp name
 * index once per cron run, so matching ~45 Kakao results per district doesn't
 * issue one DB query per company.
 */
export async function loadCorpNameIndex(): Promise<CorpNameIndex> {
  const rows = await prisma.dartCorpCode.findMany({
    select: { corpName: true, corpCode: true },
  });
  const byName = new Map<string, string>();
  for (const row of rows) {
    byName.set(normalize(row.corpName), row.corpCode);
  }
  return { byName };
}

/**
 * Best-effort match of a Kakao place name (e.g. "삼성전자 강남사옥") against
 * the listed-company corp name index. Tries an exact match first, then
 * checks whether any indexed corp name is a leading-word prefix of the place
 * name (Kakao often appends a branch/office suffix). Unmatched names are
 * simply small/unlisted businesses — expected, not an error.
 */
export function matchCompany(placeName: string, index: CorpNameIndex): string | null {
  const normalized = normalize(placeName);
  if (!normalized) return null;

  const exact = index.byName.get(normalized);
  if (exact) return exact;

  for (const [corpName, corpCode] of index.byName) {
    if (corpName.length >= 2 && normalized.startsWith(corpName)) {
      return corpCode;
    }
  }

  return null;
}
