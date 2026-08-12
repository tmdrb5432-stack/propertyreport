const MOLIT_BASE =
  "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";
const ROWS_PER_PAGE = 1000;
const MAX_PAGES = 5; // 5,000 trades/month/sigungu ceiling — generous for any single gu.

export interface MolitTradeRow {
  aptName: string;
  dong: string; // 법정동 (umdNm)
  dealDate: Date;
  dealAmountManwon: number; // 만원
  areaM2: number; // 전용면적
  buildYear: number | null;
}

function getMolitKey(): string {
  const key = process.env.MOLIT_API_KEY;
  if (!key) {
    throw new Error(
      "MOLIT_API_KEY is not set. Add it to .env.local / Vercel env vars (공공데이터포털 > 국토교통부_아파트매매 실거래자료 > 활용신청 후 발급되는 일반 인증키, Decoding 값 그대로).",
    );
  }
  return key;
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1].trim() : "";
}

function parseItems(xml: string): MolitTradeRow[] {
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const rows: MolitTradeRow[] = [];

  for (const block of itemBlocks) {
    const aptName = extractTag(block, "aptNm");
    const dong = extractTag(block, "umdNm");
    const amountRaw = extractTag(block, "dealAmount").replace(/,/g, "").trim();
    const areaRaw = extractTag(block, "excluUseAr");
    const year = extractTag(block, "dealYear");
    const month = extractTag(block, "dealMonth");
    const day = extractTag(block, "dealDay");
    const buildYearRaw = extractTag(block, "buildYear");

    const dealAmountManwon = Number(amountRaw);
    const areaM2 = Number(areaRaw);
    if (!aptName || !year || !month || !day || !dealAmountManwon || !areaM2) continue;

    rows.push({
      aptName,
      dong,
      dealDate: new Date(Number(year), Number(month) - 1, Number(day)),
      dealAmountManwon,
      areaM2,
      buildYear: buildYearRaw ? Number(buildYearRaw) : null,
    });
  }

  return rows;
}

function extractResultCode(xml: string): string {
  return extractTag(xml, "resultCode");
}

function extractTotalCount(xml: string): number {
  const raw = extractTag(xml, "totalCount");
  return raw ? Number(raw) : 0;
}

/**
 * 국토교통부 아파트매매 실거래자료 (getRTMSDataSvcAptTradeDev) for one
 * sigungu (LAWD_CD, 5-digit) and one deal month (YYYYMM). Paginates until
 * all rows for the month are collected.
 */
export async function fetchAptTrades(
  lawdCd: string,
  dealYmd: string,
): Promise<MolitTradeRow[]> {
  const key = getMolitKey();
  const rows: MolitTradeRow[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(MOLIT_BASE);
    // The service key from data.go.kr is already URL-encoded ("Encoding" key)
    // or raw ("Decoding" key) depending on which the user copied — decode
    // first (no-op if it was already raw) so URLSearchParams doesn't
    // double-encode it.
    let decodedKey = key;
    try {
      decodedKey = decodeURIComponent(key);
    } catch {
      // Not URL-encoded — use as-is.
    }
    url.searchParams.set("serviceKey", decodedKey);
    url.searchParams.set("LAWD_CD", lawdCd);
    url.searchParams.set("DEAL_YMD", dealYmd);
    url.searchParams.set("numOfRows", String(ROWS_PER_PAGE));
    url.searchParams.set("pageNo", String(page));

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`MOLIT API error (${lawdCd}/${dealYmd}, page ${page}): ${res.status} ${body}`);
    }

    const xml = await res.text();
    const resultCode = extractResultCode(xml);
    if (resultCode && resultCode !== "000") {
      const resultMsg = extractTag(xml, "resultMsg");
      throw new Error(`MOLIT API returned error ${resultCode}: ${resultMsg || "unknown error"}`);
    }

    const pageRows = parseItems(xml);
    rows.push(...pageRows);

    const totalCount = extractTotalCount(xml);
    if (rows.length >= totalCount || pageRows.length < ROWS_PER_PAGE) break;
  }

  return rows;
}
