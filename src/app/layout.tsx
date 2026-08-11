import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "부동산 분석 대시보드 | propertyreport",
  description: "5대 업무지구 직주근접·이동편의성 기반 부동산 분석 대시보드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        {children}
      </body>
    </html>
  );
}
