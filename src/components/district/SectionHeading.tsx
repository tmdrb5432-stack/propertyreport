export function SectionHeading({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {children}
    </h2>
  );
}
