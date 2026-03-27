import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  tone?: 'dark' | 'light';
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  tone = 'dark',
}: EmptyStateProps) {
  const isLight = tone === 'light';

  return (
    <div
      id="empty-state"
      className={`rounded-[2rem] border px-6 py-10 text-center ${
        isLight
          ? 'border-dashed border-stone-200 bg-white/80'
          : 'border-dashed border-white/15 bg-white/5'
      } ${className}`}
    >
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border text-2xl ${
          isLight
            ? 'border-stone-200 bg-stone-50 text-stone-700'
            : 'border-white/10 bg-white/5 text-white/85'
        }`}
      >
        {icon}
      </div>
      <h3 className={`mt-4 text-lg font-semibold ${isLight ? 'text-stone-900' : 'text-white'}`}>{title}</h3>
      {description ? (
        <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${isLight ? 'text-stone-500' : 'text-white/55'}`}>
          {description}
        </p>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className={`mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition hover:bg-orange-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 ${
            isLight
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-orange-400/20 bg-orange-400/10 text-orange-100'
          }`}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
