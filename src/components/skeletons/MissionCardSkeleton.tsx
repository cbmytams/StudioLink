export function MissionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/70 p-4 animate-pulse">
      <div className="h-3 w-20 rounded bg-stone-200 mb-3" />
      <div className="h-4 w-2/3 rounded bg-stone-200 mb-2" />
      <div className="h-3 w-1/2 rounded bg-stone-200 mb-4" />
      <div className="h-3 w-1/3 rounded bg-stone-200" />
    </div>
  );
}
