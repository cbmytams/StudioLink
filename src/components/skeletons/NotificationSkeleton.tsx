export function NotificationSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/70 p-4 animate-pulse flex items-start gap-3">
      <div className="h-9 w-9 rounded-full bg-stone-200 shrink-0" />
      <div className="flex-1">
        <div className="h-4 w-2/3 rounded bg-stone-200 mb-2" />
        <div className="h-3 w-1/2 rounded bg-stone-200" />
      </div>
      <div className="h-3 w-12 rounded bg-stone-200" />
    </div>
  );
}
