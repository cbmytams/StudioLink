export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse">
      <div className="mb-3 h-4 w-3/4 rounded bg-white/15" />
      {Array.from({ length: Math.max(1, lines - 1) }).map((_, index) => (
        <div
          key={index}
          className={`mb-2 h-3 rounded bg-white/10 ${
            index === lines - 2 ? "w-1/2" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, lines = 3 }: { count?: number; lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} lines={lines} />
      ))}
    </div>
  );
}
