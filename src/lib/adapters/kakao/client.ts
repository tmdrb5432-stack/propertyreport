const KAKAO_LOCAL_BASE = "https://dapi.kakao.com/v2/local/search";
const PAGE_SIZE = 15;
const MAX_PAGES = 3; // Kakao Local API caps results at 45 documents (3 pages x 15).

export interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

interface KakaoSearchResponse {
  documents: KakaoDocument[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

function getRestKey(): string {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) {
    throw new Error(
      "KAKAO_REST_KEY is not set. Add it to .env.local (Kakao Developers > 내 애플리케이션 > REST API 키).",
    );
  }
  return key;
}

async function paginatedSearch(
  endpoint: "keyword" | "category",
  params: Record<string, string>,
): Promise<KakaoDocument[]> {
  const restKey = getRestKey();
  const documents: KakaoDocument[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(`${KAKAO_LOCAL_BASE}/${endpoint}.json`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("page", String(page));
    url.searchParams.set("size", String(PAGE_SIZE));

    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${restKey}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Kakao Local API error (${endpoint}, page ${page}): ${res.status} ${body}`,
      );
    }

    const data: KakaoSearchResponse = await res.json();
    documents.push(...data.documents);

    if (data.meta.is_end) break;
  }

  return documents;
}

export function searchKeyword(params: {
  query: string;
  x: number;
  y: number;
  radius: number;
}): Promise<KakaoDocument[]> {
  return paginatedSearch("keyword", {
    query: params.query,
    x: String(params.x),
    y: String(params.y),
    radius: String(params.radius),
  });
}

export function searchCategory(params: {
  categoryGroupCode: string;
  x: number;
  y: number;
  radius: number;
}): Promise<KakaoDocument[]> {
  return paginatedSearch("category", {
    category_group_code: params.categoryGroupCode,
    x: String(params.x),
    y: String(params.y),
    radius: String(params.radius),
  });
}
