"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { chartColors } from "@/lib/chartTheme";

export function Sparkline({
  data,
  dataKey,
  gradientId,
}: {
  data: Record<string, number | null>[];
  dataKey: string;
  gradientId: string;
}) {
  const points = data.filter((p) => p[dataKey] !== null);
  if (points.length < 2) {
    return <div className="h-10 w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.series1Blue} stopOpacity={0.3} />
            <stop offset="100%" stopColor={chartColors.series1Blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={chartColors.series1Blue}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
