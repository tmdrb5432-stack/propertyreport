import type { NotableCompany } from "@/lib/adapters/types";

function shortCategory(category: string): string {
  const parts = category.split(">").map((p) => p.trim());
  return parts[parts.length - 1] || category;
}

export function CompanyList({ companies }: { companies: NotableCompany[] }) {
  if (companies.length === 0) {
    return <p className="text-sm text-neutral-500">주요회사 데이터가 아직 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {companies.map((company, i) => (
        <li
          key={`${company.name}-${company.address}`}
          className="flex items-center gap-3 py-2"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {company.name}
            </p>
            <p className="truncate text-xs text-neutral-400">{company.address}</p>
          </div>
          {company.employeeCount !== null && (
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {company.employeeCount.toLocaleString()}명
              </p>
              <p
                className={`text-[11px] ${
                  company.employeeCountSource === "dart"
                    ? "text-blue-500"
                    : "text-neutral-400"
                }`}
              >
                {company.employeeCountSource === "dart" ? "실데이터" : "추정"}
              </p>
            </div>
          )}
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {shortCategory(company.category)}
          </span>
        </li>
      ))}
    </ul>
  );
}
