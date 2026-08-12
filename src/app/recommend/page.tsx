import Link from "next/link";
import { getRecommendedComplexes } from "@/lib/queries";
import { RecommendationExplorer } from "@/components/recommend/RecommendationExplorer";
import { chartColors } from "@/lib/chartTheme";

export const dynamic = "force-dynamic";

export default async function RecommendPage() {
  const complexes = await getRecommendedComplexes();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-sm text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-200"
      >
        ← 전체 지구 개요
      </Link>

      <header className="mt-2 mb-6">
        <span
          className="mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
          style={{ background: `${chartColors.series1Blue}1a`, color: chartColors.series1Blue }}
        >
          저평가 매물 찾기
        </span>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
          직주근접 좋고 가격도 괜찮은 아파트
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-neutral-500">
          5개 업무지구 전체 단지를 대상으로 직주근접(지구의 일자리 밀도 + 업무지구까지 거리 +
          지하철역 거리)과 가격(현재 평당가가 얼마나 저렴한지, 최근 상승률이 얼마나 낮은지)을
          함께 봐서 순위를 매깁니다. 필터를 걸어 조건에 맞는 상위 5개를 확인해보세요.
        </p>
      </header>

      <RecommendationExplorer complexes={complexes} />
    </main>
  );
}
