// MOLIT's 아파트매매 실거래자료 API is scoped by LAWD_CD, the 5-digit
// 법정동코드 시군구 (sigungu) code — not by lat/lng radius. Each business
// district here is approximated by the sigungu it's centered in; the actual
// ~5km radius filtering happens after the fact (see fetchDistrictTrades.ts),
// so a district's true radius may extend slightly beyond this sigungu or
// include a few trades from neighboring ones that get excluded by distance.
export const LAWD_CODES: Record<string, string> = {
  gwanghwamun: "11110", // 서울 종로구
  yeouido: "11560", // 서울 영등포구
  gangnam: "11680", // 서울 강남구
  pangyo: "41135", // 경기 성남시 분당구
  magok: "11500", // 서울 강서구
};

export function getLawdCode(districtId: string): string {
  const code = LAWD_CODES[districtId];
  if (!code) {
    throw new Error(`No LAWD_CD mapping configured for district "${districtId}".`);
  }
  return code;
}
