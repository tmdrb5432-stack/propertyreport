"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisTickStyle, chartColors, gridProps } from "@/lib/chartTheme";

export interface MigrationTrendPoint {
  periodMonth: string;
  inMigration: number;
  outMigration: number;
}

const SERIES_LABEL: Record<string, string> = {
  inMigration: "전입",
  outMigration: "전출",
};

function TooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
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
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {SERIES_LABEL[p.dataKey] ?? p.dataKey}: <strong>{p.value.toLocaleString()}명</strong>
        </div>
      ))}
    </div>
  );
}

export function MigrationTrendChart({ data }: { data: MigrationTrendPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-500">아직 전입/전출 데이터가 없습니다.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="periodMonth" tick={axisTickStyle} axisLine={{ stroke: chartColors.baseline }} tickLine={false} />
        <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<TooltipContent />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: chartColors.secondaryInk }}
          formatter={(value: string) => SERIES_LABEL[value] ?? value}
        />
        <Line
          type="monotone"
          dataKey="inMigration"
          stroke={chartColors.series1Blue}
          strokeWidth={2}
          dot={{ r: 3, fill: chartColors.series1Blue, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="outMigration"
          stroke={chartColors.series2Orange}
          strokeWidth={2}
          dot={{ r: 3, fill: chartColors.series2Orange, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
