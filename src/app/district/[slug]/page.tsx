import Link from "next/link";
import { notFound } from "next/navigation";
import { getDistrictDetail, getTopComplexesForDistrict } from "@/lib/queries";
import { KakaoMapView } from "@/components/map/KakaoMapView";
import { TransitScoreGauge } from "@/components/charts/TransitScoreGauge";
import { CompanyList } from "@/components/district/CompanyList";
import { TopComplexList } from "@/components/district/TopComplexList";
import { FreshnessRow } from "@/components/district/FreshnessBadge";
import { TransactionTrendChart } from "@/components/charts/TransactionTrendChart";
import { AskingPriceTrendChart } from "@/components/charts/AskingPriceTrendChart";
import { MigrationTrendChart } from "@/components/charts/MigrationTrendChart";

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
  const [district, topComplexes] = await Promise.all([
    getDistrictDetail(slug),
    getTopComplexesForDistrict(slug),
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

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600">
        ← 전체 지구 개요
      </Link>

      <header className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{district.nameKo}</h1>
          <p className="text-sm text-neutral-400">{district.nameEn}</p>
        </div>
        <FreshnessRow items={district.freshness} />
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 overflow-hidden rounded-2xl">
          <KakaoMapView
            markers={[{ id: district.id, lat: district.lat, lng: district.lng, label: district.nameKo }]}
            center={{ lat: district.lat, lng: district.lng }}
            level={6}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <TransitScoreGauge score={district.transitScore} label="이동편의성 (교통점수)" />
            <p className="mt-3 text-xs text-neutral-400">
              지하철역 {district.subwayStationCount ?? 0}개
              {district.subwayLines.length > 0 && ` · ${district.subwayLines.join(", ")}`}
            </p>
            <p className="text-xs text-neutral-400">버스정류장 {district.busStopCount ?? 0}개</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="mb-2 text-xs text-neutral-400">직주근접 지표</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold">{district.companyCount ?? "-"}</p>
                <p className="text-[11px] text-neutral-400">회사수</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{district.employeeCount ?? "추정불가"}</p>
                <p className="text-[11px] text-neutral-400">종사자수(추정)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">주요회사</h2>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <CompanyList companies={district.notableCompanies} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          단지별 실거래가 TOP 3 <span className="font-normal text-neutral-400">(mock)</span>
        </h2>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <TopComplexList complexes={topComplexes} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            실거래가 추이 <span className="font-normal text-neutral-400">(mock)</span>
          </h2>
          <TransactionTrendChart data={transactionPoints} />
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            호가 추이 <span className="font-normal text-neutral-400">(mock)</span>
          </h2>
          <AskingPriceTrendChart data={askingPoints} />
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            전입/전출 추이 <span className="font-normal text-neutral-400">(mock)</span>
          </h2>
          <MigrationTrendChart data={migrationPoints} />
        </div>
      </section>
    </main>
  );
}
