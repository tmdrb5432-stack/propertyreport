// Chart color tokens — validated categorical/sequential palette (light mode).
// See the dataviz skill's references/palette.md for the source values and
// the CVD/contrast validation this ordering passed.
export const chartColors = {
  surface: "#fcfcfb",
  primaryInk: "#0b0b0b",
  secondaryInk: "#52514e",
  mutedInk: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  // Categorical, fixed order — never reassign per-filter.
  series1Blue: "#2a78d6", // 실거래가 / 전입
  series2Orange: "#eb6834", // 호가 / 전출
  series3Aqua: "#1baf7a",
  goodGreen: "#0ca30c",
  criticalRed: "#d03b3b",
} as const;

export const axisTickStyle = {
  fill: chartColors.mutedInk,
  fontSize: 12,
};

export const gridProps = {
  stroke: chartColors.gridline,
  strokeDasharray: "0",
  vertical: false,
};
