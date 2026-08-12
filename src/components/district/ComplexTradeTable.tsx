import type { ComplexTradeRecord } from "@/lib/adapters/types";

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export function ComplexTradeTable({ trades }: { trades: ComplexTradeRecord[] }) {
  if (trades.length === 0) {
    return <p className="text-sm text-neutral-500">아직 개별 실거래 내역이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="text-[11px] text-neutral-400">
            <th className="pb-2 font-medium">계약일</th>
            <th className="pb-2 font-medium">전용면적(평)</th>
            <th className="pb-2 font-medium">평당가</th>
            <th className="pb-2 font-medium text-right">실거래금액</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {trades.map((t, i) => (
            <tr key={`${t.dealDate}-${i}`} className="text-neutral-700 dark:text-neutral-200">
              <td className="py-1.5 whitespace-nowrap">{formatDate(t.dealDate)}</td>
              <td className="py-1.5">{t.areaPyeong.toFixed(1)}평</td>
              <td className="py-1.5">{t.pricePerPyeong.toLocaleString()}만원</td>
              <td className="py-1.5 text-right font-medium">
                {(t.priceTotal / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}억원
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
