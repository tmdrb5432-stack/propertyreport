import Link from "next/link";
import { KakaoMapView } from "@/components/map/KakaoMapView";
import { DistrictOverviewGrid } from "@/components/district/DistrictOverviewGrid";
import { getOverviewData } from "@/lib/queries";
import { chartColors } from "@/lib/chartTheme";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const districts = await getOverviewData();
  const markers = districts.map((d) => ({
    id: d.id,
    lat: d.lat,
    lng: d.lng,
    label: d.nameKo,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span
            className="mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
            style={{ background: `${chartColors.series1Blue}1a`, color: chartColors.series1Blue }}
          >
            5대 업무지구 비교 분석
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
            부동산 분석 대시보드
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-neutral-500">
            광화문·여의도·강남·판교·마곡의 직주근접 · 이동편의성을 중심으로 실거래가 변화를
            분석합니다.
          </p>
        </div>
        <Link
          href="/recommend"
          className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style={{ background: chartColors.series1Blue }}
        >
          직주근접 좋은 저평가 아파트 찾기 →
        </Link>
      </header>

      <section className="mb-8 h-72 overflow-hidden rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
        <KakaoMapView markers={markers} level={10} />
      </section>

      <DistrictOverviewGrid districts={districts} />
    </main>
  );
}
