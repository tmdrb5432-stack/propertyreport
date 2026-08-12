"use client";

import { useState } from "react";
import type { NotableCompany } from "@/lib/adapters/types";
import type { TopComplex } from "@/lib/queries";
import { SectionHeading } from "@/components/district/SectionHeading";
import { CompanyList } from "@/components/district/CompanyList";
import { ComplexMapExplorer } from "@/components/district/ComplexMapExplorer";
import { ComplexDetailPanel } from "@/components/district/ComplexDetailPanel";
import { chartColors } from "@/lib/chartTheme";

const COMPANY_MARKER_PREFIX = "__company__:";

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
  const [selectedComplex, setSelectedComplex] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const activeComplex = complexes.find((c) => c.complexName === selectedComplex) ?? null;
  const activeCompany = companies.find((c) => c.name === selectedCompany) ?? null;

  function handleMapMarkerClick(id: string) {
    if (id.startsWith(COMPANY_MARKER_PREFIX)) return; // already focused, nothing to do
    setSelectedCompany(null);
    setSelectedComplex(id);
  }

  function handleCompanySelect(name: string) {
    setSelectedComplex(null);
    setSelectedCompany(name);
  }

  const focusMarker =
    activeCompany && activeCompany.lat !== null && activeCompany.lng !== null
      ? {
          id: `${COMPANY_MARKER_PREFIX}${activeCompany.name}`,
          lat: activeCompany.lat,
          lng: activeCompany.lng,
          label: activeCompany.name,
        }
      : null;

  return (
    <section className="mb-8 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <div>
        {activeComplex ? (
          <ComplexDetailPanel
            complex={activeComplex}
            districtNameKo={district.nameKo}
            onClose={() => setSelectedComplex(null)}
          />
        ) : (
          <>
            <SectionHeading color={chartColors.series1Blue}>
              주요회사 <span className="font-normal text-neutral-400">(참고용)</span>
            </SectionHeading>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              <CompanyList
                companies={companies}
                selected={selectedCompany}
                onSelect={handleCompanySelect}
              />
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
            selected={selectedComplex}
            onSelect={handleMapMarkerClick}
            focusMarker={focusMarker}
          />
        </div>
      </div>
    </section>
  );
}
