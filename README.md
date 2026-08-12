# propertyreport — 부동산 분석 대시보드

카카오맵 기반으로 5개 업무지구(광화문·여의도·강남·판교·마곡)를 **직주근접**·**이동편의성**
관점에서 비교 분석하는 대시보드입니다. 지구별 교통 환경·회사수·주요회사·종사자수를
갱신하고, 이를 실거래가·호가·전입/전출 변화와 함께 보여줍니다.

## 기술 스택

- Next.js (App Router) + TypeScript, Tailwind CSS
- Prisma + Postgres (Neon/Supabase/Vercel Postgres 등 — Vercel 서버리스는 파일시스템이
  휘발성이라 SQLite를 쓸 수 없어, 로컬 개발도 같은 Postgres를 사용합니다)
- recharts (트렌드 차트), react-kakao-maps-sdk (지도)
- 카카오 Local REST API (회사/교통 실데이터), 나머지는 실 API 형태에 맞춘 mock 어댑터

## 이 MVP에서 실데이터 vs mock

| 영역 | 상태 | 비고 |
|---|---|---|
| 교통 환경 (지하철/버스) | **실데이터** (카카오) | `KAKAO_REST_KEY` 필요, 지구 중심 반경 5km(`PROXIMITY_RADIUS_M`) |
| 회사수 / 주요회사 | **실데이터** (카카오) | 반경 5km, Kakao Local API 페이지네이션 상한(~45건)으로 근사치 |
| 종사자수 | **상장사는 실데이터(DART), 비상장은 추정치** | OpenDART 매칭 성공 시 실제 직원현황, 실패 시 카테고리 기반 추정 — `DART_API_KEY` 필요 |
| 실거래가 (지구 단위) | **실데이터/mock 전환 가능** | `MOLIT_API_KEY` + `TRANSACTION_DATA_SOURCE=real` 설정 시 국토교통부 아파트매매 실거래자료(공공데이터포털) 사용 |
| 실거래가 (단지별 TOP 3 + 지도) | **실데이터/mock 전환 가능** | `MOLIT_API_KEY` + `COMPLEX_TRANSACTION_DATA_SOURCE=real`. 단지 위치는 소스와 무관하게 Kakao로 지오코딩되어 지도에 항상 표시됨 |
| 호가 | mock (real 경로 미구현) | 공식 API 없음. 크롤링은 대상 사이트 약관 법적 검토 후 별도 진행 |
| 전입/전출 | mock (실 API 응답 형태와 동일한 타입) | KOSIS Open API 키 발급 후 `src/lib/adapters/migration/realMigrationAdapter.ts` 구현 |
| 지도 렌더링 | JS 키 있으면 실제 지도, 없으면 안내 placeholder | `NEXT_PUBLIC_KAKAO_JS_KEY` |

## 시작하기

```bash
npm install
cp .env.example .env.local
# .env.local에 DATABASE_URL(Postgres 연결 문자열), KAKAO_REST_KEY,
# (있다면) NEXT_PUBLIC_KAKAO_JS_KEY, CRON_SECRET 입력
# (Neon neon.tech 등에서 무료 Postgres를 바로 만들 수 있습니다)

npx prisma migrate deploy   # 최초 1회 (DB 스키마 적용)
npx prisma db seed          # 5개 지구 시드

npm run dev
```

`http://localhost:3000` 접속 시 5개 지구 카드가 보이지만, 스냅샷 데이터가 없으면
빈 값으로 표시됩니다. 아래처럼 크론 라우트를 한 번 수동 호출해 데이터를 채우세요.

## 데이터 채우기 (크론 라우트 수동 호출)

```bash
CRON_SECRET=여기에_env의_값

curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/seed-dart-corpcodes
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/update-kakao
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/update-transactions
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/update-complex-transactions
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/update-asking-price
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/update-migration
```

- `seed-dart-corpcodes`: OpenDART 상장사 corp code 목록을 DB에 채움 (최초 1회 + 가끔) — `DART_API_KEY` 필요, 없으면 그냥 스킵하고 진행해도 됨(추정치로 동작)
- `update-kakao`: 카카오 Local API로 회사수/주요회사(종사자수 실데이터/추정 포함)/교통(지하철·버스) 수집 — 반경 5km
- `update-transactions`: 지구 단위 실거래가 mock 시계열 생성/갱신 (월 6개월치)
- `update-complex-transactions`: 단지별 실거래가 mock 시계열 생성/갱신 (월 6개월치) — TOP 3 카드용
- `update-asking-price`: 호가 mock 시계열 생성/갱신 (주 8주치) — 데모용 수동 라우트, cron 미등록
- `update-migration`: 전입/전출 mock 시계열 생성/갱신 (월 6개월치)

## 업데이트 주기

데이터 소스별 현실적 한계를 반영해 주기를 다르게 설계했습니다.

| 소스 | 주기 | 이유 |
|---|---|---|
| 카카오 (교통/회사) | 매일 | POI 데이터가 하루 안에 크게 바뀌지 않음 |
| 실거래가 (지구/단지) | 매일 | 국토부 실거래 신고는 계약 후 최대 30일 소요 — 일 단위가 실질적 한계 |
| 호가 | 수동 (데모용) | 공식 API 없음. 실서비스화 시 크롤링 대상 사이트 약관 검토 필요 |
| 전입/전출 | 매월 1일 | 통계청 KOSIS는 월 단위로 발표 |

`vercel.json`에 Vercel Cron 스케줄이 정의되어 있습니다 (`update-asking-price`는 의도적으로
제외). Vercel 미사용 시 GitHub Actions 스케줄 워크플로 등에서 동일한 `curl` 호출로 대체할 수
있습니다.

## 실데이터로 업그레이드하는 방법

1. **카카오 JavaScript 키**: 카카오 디벨로퍼스 콘솔 > 내 애플리케이션 > 앱 키에서 확인/발급
   후 `NEXT_PUBLIC_KAKAO_JS_KEY`에 설정하고, 플랫폼 > Web에 도메인을 등록하세요.
2. **실거래가**: [공공데이터포털](https://www.data.go.kr)에서 "국토교통부_아파트매매 실거래자료"
   API 키 발급 → `.env.local`(또는 Vercel 환경변수)에 `MOLIT_API_KEY` 설정 →
   `TRANSACTION_DATA_SOURCE=real`, `COMPLEX_TRANSACTION_DATA_SOURCE=real` 설정.
   MOLIT API는 법정동코드(시군구 단위)로 조회되기 때문에, 각 업무지구를 담당 구
   (`src/lib/molit/lawdCodes.ts`)로 근사한 뒤 Kakao 지오코딩으로 반경 5km 밖 거래를
   걸러냅니다 — 구 경계와 5km 반경이 정확히 일치하지 않을 수 있음을 참고하세요.
3. **전입/전출**: [KOSIS Open API](https://kosis.kr/openapi) 키 발급 →
   `src/lib/adapters/migration/realMigrationAdapter.ts`의 `fetch` 구현 →
   `MIGRATION_DATA_SOURCE=real` 설정.
4. **호가**: 공식 API가 없어 이번 빌드에는 포함하지 않았습니다. 크롤링으로 구현하려면 먼저
   대상 사이트(예: 네이버 부동산)의 이용약관을 검토하세요.
5. **단지별 실거래가 TOP 3 + 지도**: 위 `MOLIT_API_KEY`로 자동 활성화됩니다 (2번과 동일 키
   공유). mock 상태에서도 단지 이름이 실제 아파트명이라 Kakao 지오코딩으로 지도에 표시되며,
   실데이터로 전환하면 실제 신고가 기준으로 TOP3 랭킹이 바뀝니다.
6. **주요회사 종사자수**: [OpenDART](https://opendart.fss.or.kr)에서 무료 키 발급 →
   `.env.local`에 `DART_API_KEY` 설정 → `seed-dart-corpcodes` 라우트를 한 번 호출해 상장사
   corp code를 채운 뒤 `update-kakao`를 다시 실행하면, 카카오 검색 결과 중 상장사와 이름이
   매칭되는 회사는 실제 직원현황으로, 나머지는 계속 추정치로 표시됩니다.

## 프로덕션 배포 시 유의사항

- Vercel 프로젝트 환경변수에 `DATABASE_URL`(Postgres), `KAKAO_REST_KEY`,
  `NEXT_PUBLIC_KAKAO_JS_KEY`(있다면), `DART_API_KEY`(있다면), `MOLIT_API_KEY`(있다면),
  `CRON_SECRET`을 설정하세요.
- `package.json`의 `vercel-build` 스크립트(`prisma migrate deploy && next build`)가 배포마다
  자동으로 마이그레이션을 적용하므로, `DATABASE_URL`만 설정되어 있으면 별도 수동 마이그레이션은
  필요 없습니다.
- `CRON_SECRET`을 Vercel 프로젝트 환경변수로 설정하면 Vercel Cron이 자동으로
  `Authorization: Bearer $CRON_SECRET` 헤더를 붙여 호출합니다.
