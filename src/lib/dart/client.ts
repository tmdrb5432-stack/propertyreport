import AdmZip from "adm-zip";

const DART_BASE = "https://opendart.fss.or.kr/api";

function getDartKey(): string {
  const key = process.env.DART_API_KEY;
  if (!key) {
    throw new Error(
      "DART_API_KEY is not set. Add it to .env.local (무료 발급: https://opendart.fss.or.kr).",
    );
  }
  return key;
}

export interface DartCorpCodeEntry {
  corpCode: string;
  corpName: string;
  stockCode: string | null;
  modifyDate: string | null;
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "s"));
  return match ? match[1].trim() : null;
}

/**
 * Downloads and parses OpenDART's corpCode.xml master list (delivered as a
 * zip), keeping only entries with a non-empty stock_code (listed companies —
 * the only ones with a public 직원현황 disclosure via empSttus.json).
 */
export async function fetchListedCorpCodes(): Promise<DartCorpCodeEntry[]> {
  const key = getDartKey();
  const url = `${DART_BASE}/corpCode.xml?crtfc_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`DART corpCode.xml request failed: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith(".xml"));
  if (!entry) {
    throw new Error("DART corpCode.xml zip contained no XML entry");
  }
  const xml = entry.getData().toString("utf-8");

  const results: DartCorpCodeEntry[] = [];
  const listBlocks = xml.match(/<list>[\s\S]*?<\/list>/g) ?? [];
  for (const block of listBlocks) {
    const stockCode = extractTag(block, "stock_code");
    if (!stockCode) continue; // unlisted — no empSttus data available
    const corpCode = extractTag(block, "corp_code");
    const corpName = extractTag(block, "corp_name");
    if (!corpCode || !corpName) continue;
    results.push({
      corpCode,
      corpName,
      stockCode,
      modifyDate: extractTag(block, "modify_date"),
    });
  }

  return results;
}

export interface EmpSttusRow {
  fo_bbm: string | null; // 사업부문
  sexdstn: string | null; // 성별
  sm: string | null; // 합계 (총 인원, 콤마 포함 문자열)
}

/** Raw empSttus.json call for one (corp_code, year, report) combination. */
export async function fetchEmployeeStatus(
  corpCode: string,
  bsnsYear: string,
  reprtCode: string,
): Promise<EmpSttusRow[]> {
  const key = getDartKey();
  const url = new URL(`${DART_BASE}/empSttus.json`);
  url.searchParams.set("crtfc_key", key);
  url.searchParams.set("corp_code", corpCode);
  url.searchParams.set("bsns_year", bsnsYear);
  url.searchParams.set("reprt_code", reprtCode);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`DART empSttus.json request failed: ${res.status}`);
  }
  const data = await res.json();
  if (data.status !== "000") {
    // "013" = no data for this period, common for smaller/newer filers — not a hard error.
    return [];
  }
  return (data.list ?? []) as EmpSttusRow[];
}
