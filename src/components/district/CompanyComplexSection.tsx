"use client";

import { useState } from "react";
import type { NotableCompany } from "@/lib/adapters/types";
import type { TopComplex } from "@/lib/queries";
import { SectionHeading } from "@/components/district/SectionHeading";
import { CompanyList } from "@/components/district/CompanyList";
import { ComplexMapExplorer } from "@/components/district/ComplexMapExplorer";
import { ComplexDetailPanel } from "@/components/district/ComplexDetailPanel";
import { chartColors } from "@/lib/chartTheme";

export function CompanyComplexSection({
  district,
  companies,
  complexes,
  isRealTransactionData,
}: {
  district: { lat: number; lng: number; nameKo: string };
  companies: NotableCompany[];
  complexes: TopComplex[];
  isRealTransactionData: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedComplex = complexes.find((c) => c.complexName === selected) ?? null;

  return (
    <section className="mb-8 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <div>
        {selectedComplex ? (
          <ComplexDetailPanel
            complex={selectedComplex}
            districtNameKo={district.nameKo}
            onClose={() => setSelected(null)}
          />
        ) : (
          <>
            <SectionHeading color={chartColors.series1Blue}>
              주요회사 <span className="font-normal text-neutral-400">(참고용)</span>
            </SectionHeading>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <CompanyList companies={companies} />
            </div>
          </>
        )}
      </div>

      <div>
        <SectionHeading color={chartColors.series1Blue}>
          단지별 실거래가 TOP 5{" "}
          <span className="font-normal text-neutral-400">
            ({isRealTransactionData ? "국토부 실거래 신고 기준" : "mock"}, 반경 5km)
          </span>
        </SectionHeading>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <ComplexMapExplorer
            district={district}
            complexes={complexes}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      </div>
    </section>
  );
}
