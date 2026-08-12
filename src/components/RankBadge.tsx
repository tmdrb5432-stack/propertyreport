import { chartColors } from "@/lib/chartTheme";

const RANK_BADGE_COLORS = ["#eda100", "#898781", "#b08d57"]; // 1st/2nd/3rd — gold/silver/bronze accent, rest neutral

export function RankBadge({ rank }: { rank: number }) {
  const color = RANK_BADGE_COLORS[rank - 1] ?? chartColors.mutedInk;
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ background: color }}
    >
      {rank}
    </span>
  );
}
