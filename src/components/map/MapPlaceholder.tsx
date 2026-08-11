export function MapPlaceholder({ message }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center dark:border-neutral-700 dark:bg-neutral-900">
      <span className="text-2xl">🗺️</span>
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
        {message ?? "지도를 표시하려면 카카오 JavaScript 키가 필요합니다"}
      </p>
      <p className="max-w-xs text-xs text-neutral-400">
        카카오 디벨로퍼스 콘솔에서 JavaScript 키를 발급받아{" "}
        <code className="rounded bg-neutral-200 px-1 py-0.5 dark:bg-neutral-800">
          NEXT_PUBLIC_KAKAO_JS_KEY
        </code>{" "}
        환경변수로 설정하세요.
      </p>
    </div>
  );
}
