interface Company {
  name: string;
  category: string;
  address: string;
}

function shortCategory(category: string): string {
  const parts = category.split(">").map((p) => p.trim());
  return parts[parts.length - 1] || category;
}

export function CompanyList({ companies }: { companies: Company[] }) {
  if (companies.length === 0) {
    return <p className="text-sm text-neutral-500">주요회사 데이터가 아직 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {companies.map((company) => (
        <li key={`${company.name}-${company.address}`} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {company.name}
            </p>
            <p className="truncate text-xs text-neutral-400">{company.address}</p>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {shortCategory(company.category)}
          </span>
        </li>
      ))}
    </ul>
  );
}
