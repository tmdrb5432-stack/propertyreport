import { KakaoMapView } from "@/components/map/KakaoMapView";
import { DistrictOverviewGrid } from "@/components/district/DistrictOverviewGrid";
import { getOverviewData } from "@/lib/queries";

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
      <header className="mb-6">
        <h1 className="text-2xl font-bold">부동산 분석 대시보드</h1>
        <p className="mt-1 text-sm text-neutral-500">
          5대 업무지구(광화문·여의도·강남·판교·마곡)의 직주근접 · 이동편의성을 중심으로
          교통·회사·실거래가·호가·전입출 변화를 분석합니다.
        </p>
      </header>

      <section className="mb-8 h-72 overflow-hidden rounded-2xl">
        <KakaoMapView markers={markers} level={10} />
      </section>

      <DistrictOverviewGrid districts={districts} />
    </main>
  );
}
