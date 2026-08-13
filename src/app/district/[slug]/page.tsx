import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDistrictDetail,
  getDistrictRecommendedComplexes,
  getTopComplexesForDistrict,
} from "@/lib/queries";
import { TransitScoreGauge } from "@/components/charts/TransitScoreGauge";
import { CompanyComplexSection } from "@/components/district/CompanyComplexSection";
import { FocusedCompanyProvider } from "@/components/district/FocusedCompanyContext";
import { TopDistrictMap } from "@/components/district/TopDistrictMap";
import { FreshnessRow } from "@/components/district/FreshnessBadge";
import { SectionHeading } from "@/components/district/SectionHeading";
import { TransactionTrendChart } from "@/components/charts/TransactionTrendChart";
import { AskingPriceTrendChart } from "@/components/charts/AskingPriceTrendChart";
import { MigrationTrendChart } from "@/components/charts/MigrationTrendChart";
import { RecommendationExplorer } from "@/components/recommend/RecommendationExplorer";
import { chartColors } from "@/lib/chartTheme";

export const dynamic = "force-dynamic";

function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function DistrictDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [district, topComplexes, recommendedComplexes] = await Promise.all([
    getDistrictDetail(slug),
    getTopComplexesForDistrict(slug),
    getDistrictRecommendedComplexes(slug),
  ]);
  if (!district) notFound();

  const transactionPoints = district.transactions.map((t) => ({
    periodDate: formatMonth(t.periodDate),
    avgPricePerPyeong: t.avgPricePerPyeong,
    transactionCount: t.transactionCount,
  }));

  const askingPoints = district.askingPrices.map((a) => ({
    periodDate: formatMonth(a.periodDate),
    avgAskingPricePerPyeong: a.avgAskingPricePerPyeong,
    listingCount: a.listingCount,
  }));

  const migrationPoints = district.migrations.map((m) => ({
    periodMonth: m.periodMonth,
    inMigration: m.inMigration,
    outMigration: m.outMigration,
  }));

  const isRealTransactionData = district.transactionSource === "molit";

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
          업무지구 상세 분석
        </span>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
              {district.nameKo}
            </h1>
            <p className="text-sm text-neutral-400">{district.nameEn}</p>
          </div>
          <FreshnessRow items={district.freshness} />
        </div>
      </header>

      <FocusedCompanyProvider>
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopDistrictMap district={district} />

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <TransitScoreGauge
                score={district.transitScore}
                label="이동편의성 (교통점수)"
                color={chartColors.series2Orange}
              />
              <p className="mt-3 text-xs text-neutral-400">
                지하철역 {district.subwayStationCount ?? 0}개
                {district.subwayLines.length > 0 && ` · ${district.subwayLines.join(", ")}`}
              </p>
              <p className="text-xs text-neutral-400">버스정류장 {district.busStopCount ?? 0}개</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <p className="mb-2 text-xs font-medium" style={{ color: chartColors.series1Blue }}>
                직주근접 지표
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {district.companyCount ?? "-"}
                  </p>
                  <p className="text-[11px] text-neutral-400">회사수</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    {district.employeeCount ? district.employeeCount.toLocaleString() : "추정불가"}
                  </p>
                  <p className="text-[11px] text-neutral-400">종사자수(추정)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CompanyComplexSection
          district={district}
          companies={district.notableCompanies}
          complexes={topComplexes}
          isRealTransactionData={isRealTransactionData}
        />
      </FocusedCompanyProvider>

      <section className="mb-8">
        <SectionHeading color={chartColors.series1Blue}>
          {district.nameKo}에서 직주근접 좋고 가격도 괜찮은 아파트
        </SectionHeading>
        <p className="mb-4 text-xs text-neutral-400">
          이 지구의 실거래가 데이터를 기준으로 직주근접(일자리 밀도 + 업무지구·지하철역 거리)과
          가격(평당가, 최근 상승률)을 함께 봐서 이 지구 안에서 상대적으로 괜찮은 단지를 찾아줍니다.
        </p>
        <RecommendationExplorer
          complexes={recommendedComplexes}
          showDistrictFilter={false}
          fallbackCenter={{ lat: district.lat, lng: district.lng }}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="h-1" style={{ background: chartColors.series1Blue }} />
          <div className="p-4">
            <SectionHeading color={chartColors.series1Blue}>
              실거래가 추이{" "}
              <span className="font-normal text-neutral-400">
                ({isRealTransactionData ? "국토부 실거래 신고 기준" : "mock"})
              </span>
            </SectionHeading>
            <TransactionTrendChart data={transactionPoints} />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="h-1" style={{ background: chartColors.series2Orange }} />
          <div className="p-4">
            <SectionHeading color={chartColors.series2Orange}>
              호가 추이 <span className="font-normal text-neutral-400">(mock)</span>
            </SectionHeading>
            <AskingPriceTrendChart data={askingPoints} />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="h-1" style={{ background: chartColors.series3Aqua }} />
          <div className="p-4">
            <SectionHeading color={chartColors.series3Aqua}>
              전입/전출 추이 <span className="font-normal text-neutral-400">(mock)</span>
            </SectionHeading>
            <MigrationTrendChart data={migrationPoints} />
          </div>
        </div>
      </section>
    </main>
  );
}
