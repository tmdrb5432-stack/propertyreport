import type { ComplexTradeRecord } from "@/lib/adapters/types";

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function formatArea(areaM2: number, areaPyeong: number): string {
  return `${areaM2.toFixed(2)}㎡/${areaPyeong.toFixed(1)}평`;
}

interface AreaGroup {
  key: string;
  areaM2: number;
  areaPyeong: number;
  trades: ComplexTradeRecord[];
}

function groupByArea(trades: ComplexTradeRecord[]): AreaGroup[] {
  const groups = new Map<string, AreaGroup>();
  for (const trade of trades) {
    const key = trade.areaM2.toFixed(2);
    const existing = groups.get(key);
    if (existing) existing.trades.push(trade);
    else
      groups.set(key, {
        key,
        areaM2: trade.areaM2,
        areaPyeong: trade.areaPyeong,
        trades: [trade],
      });
  }
  return Array.from(groups.values()).sort((a, b) => a.areaM2 - b.areaM2);
}

export function ComplexTradeTable({ trades }: { trades: ComplexTradeRecord[] }) {
  if (trades.length === 0) {
    return <p className="text-sm text-neutral-500">아직 개별 실거래 내역이 없습니다.</p>;
  }

  const groups = groupByArea(trades);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-1 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            {formatArea(group.areaM2, group.areaPyeong)}{" "}
            <span className="font-normal text-neutral-400">({group.trades.length}건)</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="text-[11px] text-neutral-400">
                  <th className="pb-1.5 font-medium">계약일</th>
                  <th className="pb-1.5 font-medium">평당가</th>
                  <th className="pb-1.5 font-medium text-right">실거래금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {group.trades.map((t, i) => (
                  <tr key={`${t.dealDate}-${i}`} className="text-neutral-700 dark:text-neutral-200">
                    <td className="py-1.5 whitespace-nowrap">{formatDate(t.dealDate)}</td>
                    <td className="py-1.5">{t.pricePerPyeong.toLocaleString()}만원</td>
                    <td className="py-1.5 text-right font-medium">
                      {(t.priceTotal / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}억원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
