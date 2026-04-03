import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  id?: string;
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: string | null;
  color?: 'orange' | 'blue' | 'green' | 'amber';
};

const toneClassByColor = {
  orange: 'border-orange-400/25 bg-orange-500/10 text-orange-200',
  blue: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
  green: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
} as const;

export function StatCard({
  id,
  label,
  value,
  unit,
  icon,
  trend,
  color = 'orange',
}: StatCardProps) {
  const trendUp = Boolean(trend && trend.trim().startsWith('+'));
  const trendDown = Boolean(trend && trend.trim().startsWith('-'));

  return (
    <div
      id={id}
      className={cn(
        'stat-card app-card p-5 transition-colors',
        toneClassByColor[color],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">{label}</p>
          <div className="mt-3 flex items-end gap-2">
            <p className="stat-card__value text-3xl font-bold tracking-tight text-white">{value}</p>
            {unit ? <span className="pb-1 text-sm font-medium text-white/50">{unit}</span> : null}
          </div>
        </div>
        {icon ? (
          <div className="text-current/80">
            {icon}
          </div>
        ) : null}
      </div>

      {trend ? (
        <div
          className={cn(
            'stat-card__trend mt-4 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
            trendUp && 'stat-card__trend--up border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
            trendDown && 'stat-card__trend--down border-red-400/20 bg-red-400/10 text-red-200',
            !trendUp && !trendDown && 'border-white/10 bg-white/6 text-white/55',
          )}
        >
          {trend}
        </div>
      ) : null}
    </div>
  );
}
