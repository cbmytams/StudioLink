import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex min-h-[var(--size-full-dvh)] items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-4">
        <svg
          viewBox="0 0 64 64"
          className="h-14 w-14 text-orange-500 animate-pulse"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="6" fill="currentColor" />
          <path d="M16 32a16 16 0 0 1 32 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M10 32a22 22 0 0 1 44 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <path d="M4 32a28 28 0 0 1 56 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        </svg>
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    </div>
  );
}
