import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { fillLastNDays, formatShortDate, type TimeSeriesPoint } from '@/lib/analytics/analyticsUtils';

type MiniLineChartProps = {
  data: TimeSeriesPoint[];
  label: string;
  color?: string;
  id?: string;
};

type HoveredPoint = {
  day: string;
  count: number;
};

function slugifyLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function MiniLineChart({
  data,
  label,
  color = 'var(--color-primary-highlight)',
  id,
}: MiniLineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  const filledData = useMemo(() => fillLastNDays(data, 30), [data]);
  const chartId = id ?? `mini-line-chart-${slugifyLabel(label)}`;

  const geometry = useMemo(() => {
    const width = 640;
    const height = 220;
    const paddingX = 18;
    const paddingTop = 24;
    const paddingBottom = 32;
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingTop - paddingBottom;
    const maxCount = Math.max(...filledData.map((point) => point.count), 0);
    const divisor = Math.max(maxCount, 1);

    const points = filledData.map((point, index) => {
      const x = paddingX + (usableWidth * index) / Math.max(filledData.length - 1, 1);
      const y = paddingTop + usableHeight - (point.count / divisor) * usableHeight;
      return { ...point, x, y };
    });

    const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
    return { width, height, points, polyline };
  }, [filledData]);

  return (
    <div id={chartId} className="relative rounded-3xl border border-white/8 bg-black/10 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-white/45">30 derniers jours</p>
        </div>
        {hoveredPoint ? (
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[var(--text-2xs-plus)] text-white/70">
            {hoveredPoint.count} candidature{hoveredPoint.count > 1 ? 's' : ''} le {formatShortDate(hoveredPoint.day)}
          </div>
        ) : null}
      </div>

      <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="h-[var(--size-chart-height)] w-full overflow-visible">
        {Array.from({ length: 4 }).map((_, index) => {
          const y = 24 + ((220 - 24 - 32) * index) / 3;
          return (
            <line
              key={index}
              x1={18}
              y1={y}
              x2={geometry.width - 18}
              y2={y}
              stroke="var(--color-divider)"
              strokeDasharray="4 6"
            />
          );
        })}

        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={geometry.polyline}
        />

        {geometry.points.map((point, index) => (
          <g key={point.day}>
            <circle
              className="mini-line-chart__point"
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              onMouseEnter={() => setHoveredPoint({ day: point.day, count: point.count })}
              onMouseLeave={() => setHoveredPoint(null)}
            />

            {(index === 0 || index === geometry.points.length - 1 || index % 7 === 0) ? (
              <text
                x={point.x}
                y={geometry.height - 8}
                textAnchor="middle"
                className={cn('fill-white/35 text-[var(--text-2xs)]')}
              >
                {formatShortDate(point.day)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
