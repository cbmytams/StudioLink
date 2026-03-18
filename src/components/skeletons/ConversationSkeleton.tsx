export function ConversationSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white/70 p-3 animate-pulse flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-stone-200" />
      <div className="flex-1">
        <div className="h-3.5 w-1/2 rounded bg-stone-200 mb-2" />
        <div className="h-3 w-2/3 rounded bg-stone-200" />
      </div>
    </div>
  );
}
