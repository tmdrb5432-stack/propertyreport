import { formatRelativeKorean, type FreshnessInfo } from "@/lib/freshness";

const METRIC_LABEL: Record<string, string> = {
  transit: "교통",
  company: "회사",
  transaction: "실거래가",
  asking: "호가",
  migration: "전입/전출",
};

export function FreshnessBadge({ info }: { info: FreshnessInfo }) {
  const isError = info.status === "error";
  const isNever = info.status === "never";

  return (
    <span
      title={info.message ?? undefined}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
        isError
          ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
          : isNever
            ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      }`}
    >
      <span>{METRIC_LABEL[info.metricType] ?? info.metricType}</span>
      <span>·</span>
      <span>{formatRelativeKorean(info.ranAt)}</span>
    </span>
  );
}

export function FreshnessRow({ items }: { items: FreshnessInfo[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((info) => (
        <FreshnessBadge key={info.metricType} info={info} />
      ))}
    </div>
  );
}
