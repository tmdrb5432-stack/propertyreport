"use client";

import { createContext, useContext, useState } from "react";
import type { NotableCompany } from "@/lib/adapters/types";

interface FocusedCompanyValue {
  focusedCompany: NotableCompany | null;
  setFocusedCompany: (company: NotableCompany | null) => void;
}

const FocusedCompanyContext = createContext<FocusedCompanyValue | null>(null);

// Shared between the top district map and the 주요회사 list further down the
// page — clicking a company needs to move the top map, but the two live in
// separate parts of the server-rendered tree, so this is the common client
// ancestor that ties them together.
export function FocusedCompanyProvider({ children }: { children: React.ReactNode }) {
  const [focusedCompany, setFocusedCompany] = useState<NotableCompany | null>(null);
  return (
    <FocusedCompanyContext.Provider value={{ focusedCompany, setFocusedCompany }}>
      {children}
    </FocusedCompanyContext.Provider>
  );
}

export function useFocusedCompany(): FocusedCompanyValue {
  const ctx = useContext(FocusedCompanyContext);
  if (!ctx) {
    throw new Error("useFocusedCompany must be used within a FocusedCompanyProvider");
  }
  return ctx;
}
