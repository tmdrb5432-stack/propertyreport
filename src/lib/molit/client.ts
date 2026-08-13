// getRTMSDataSvcAptTradeDev ("상세" variant) requires a separate 활용신청
// from the basic getRTMSDataSvcAptTrade — the user's key is only approved
// for the basic one, so that's what we call. Same core fields (aptNm,
// umdNm, dealAmount, excluUseAr, dealYear/Month/Day, buildYear).
const APT_BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
// 오피스텔 매매 실거래자료 — a separate data.go.kr service registration from
// the apartment one above (같은 서비스키를 쓰지만 별도 활용신청 필요). Field
// names match the apartment endpoint except the name tag (offiNm vs aptNm)
// and a handful of apartment-only columns (aptDong, 매도/매수자 등) that we
// don't read from either endpoint anyway.
const OFFICETEL_BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade";
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

function parseItems(xml: string, nameTag: string): MolitTradeRow[] {
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const rows: MolitTradeRow[] = [];

  for (const block of itemBlocks) {
    const aptName = extractTag(block, nameTag);
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
 * Shared pager for both MOLIT trade endpoints — they differ only in base
 * URL and the XML tag holding the complex/officetel name.
 */
async function fetchTrades(
  baseUrl: string,
  nameTag: string,
  lawdCd: string,
  dealYmd: string,
): Promise<MolitTradeRow[]> {
  const key = getMolitKey();
  const rows: MolitTradeRow[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(baseUrl);
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

    const pageRows = parseItems(xml, nameTag);
    rows.push(...pageRows);

    const totalCount = extractTotalCount(xml);
    if (rows.length >= totalCount || pageRows.length < ROWS_PER_PAGE) break;
  }

  return rows;
}

/**
 * 국토교통부 아파트매매 실거래자료 (getRTMSDataSvcAptTrade) for one
 * sigungu (LAWD_CD, 5-digit) and one deal month (YYYYMM). Paginates until
 * all rows for the month are collected.
 */
export async function fetchAptTrades(
  lawdCd: string,
  dealYmd: string,
): Promise<MolitTradeRow[]> {
  return fetchTrades(APT_BASE, "aptNm", lawdCd, dealYmd);
}

/**
 * 국토교통부 오피스텔 매매 실거래자료 (getRTMSDataSvcOffiTrade) — same shape
 * as fetchAptTrades but a separate data.go.kr 활용신청 from the apartment
 * one. If the caller's key isn't approved for this service yet, MOLIT
 * returns a SERVICE_KEY_IS_NOT_REGISTERED_ERROR-style resultCode, which
 * surfaces as a thrown error here — callers should treat officetel data as
 * optional and not let this break apartment data.
 */
export async function fetchOfficetelTrades(
  lawdCd: string,
  dealYmd: string,
): Promise<MolitTradeRow[]> {
  return fetchTrades(OFFICETEL_BASE, "offiNm", lawdCd, dealYmd);
}
