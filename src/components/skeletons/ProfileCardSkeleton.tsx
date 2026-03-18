export function ProfileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/70 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-stone-200" />
        <div className="flex-1">
          <div className="h-4 w-1/2 rounded bg-stone-200 mb-2" />
          <div className="h-3 w-1/3 rounded bg-stone-200" />
        </div>
      </div>
    </div>
  );
}
