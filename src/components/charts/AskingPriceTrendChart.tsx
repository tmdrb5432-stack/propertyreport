"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisTickStyle, chartColors, gridProps } from "@/lib/chartTheme";

export interface AskingPriceTrendPoint {
  periodDate: string;
  avgAskingPricePerPyeong: number | null;
  listingCount: number;
}

function TooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: AskingPriceTrendPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div
      style={{
        background: chartColors.surface,
        border: `1px solid ${chartColors.gridline}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: chartColors.primaryInk,
      }}
    >
      <div style={{ color: chartColors.secondaryInk, marginBottom: 4 }}>{label}</div>
      <div>
        평당 호가:{" "}
        <strong>
          {point.avgAskingPricePerPyeong
            ? point.avgAskingPricePerPyeong.toLocaleString()
            : "-"}
          만원
        </strong>
      </div>
      <div style={{ color: chartColors.mutedInk }}>매물 {point.listingCount}건</div>
    </div>
  );
}

export function AskingPriceTrendChart({ data }: { data: AskingPriceTrendPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-500">아직 호가 데이터가 없습니다.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="askFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.series2Orange} stopOpacity={0.25} />
            <stop offset="100%" stopColor={chartColors.series2Orange} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="periodDate" tick={axisTickStyle} axisLine={{ stroke: chartColors.baseline }} tickLine={false} />
        <YAxis
          tick={axisTickStyle}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => `${Math.round(v / 100) / 10}천`}
        />
        <Tooltip content={<TooltipContent />} />
        <Area
          type="monotone"
          dataKey="avgAskingPricePerPyeong"
          stroke={chartColors.series2Orange}
          strokeWidth={2}
          fill="url(#askFill)"
          dot={{ r: 3, fill: chartColors.series2Orange, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
