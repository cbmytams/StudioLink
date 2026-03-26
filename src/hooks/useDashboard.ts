import { useCallback, useEffect, useState } from 'react';
import {
  getApplicationsOverTime,
  getProDashboard,
  getStudioDashboard,
  type ProDashboard,
  type StudioDashboard,
  type TimeSeriesPoint,
} from '@/lib/analytics/analyticsService';

type DashboardRole = 'studio' | 'pro';

type DashboardDataByRole = {
  studio: StudioDashboard;
  pro: ProDashboard;
};

type UseDashboardResult<TRole extends DashboardRole> = {
  data: DashboardDataByRole[TRole] | null;
  chartData: TimeSeriesPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDashboard(userId: string | null | undefined, role: 'studio'): UseDashboardResult<'studio'>;
export function useDashboard(userId: string | null | undefined, role: 'pro'): UseDashboardResult<'pro'>;
export function useDashboard(userId: string | null | undefined, role: DashboardRole) {
  const [data, setData] = useState<StudioDashboard | ProDashboard | null>(null);
  const [chartData, setChartData] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setData(null);
      setChartData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [dashboard, chart] = await Promise.all([
        role === 'studio' ? getStudioDashboard(userId) : getProDashboard(userId),
        getApplicationsOverTime(userId, role),
      ]);

      setData(dashboard);
      setChartData(chart);
    } catch (dashboardError) {
      setData(null);
      setChartData([]);
      setError(
        dashboardError instanceof Error
          ? dashboardError.message
          : 'Impossible de charger les analytics du dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    void refresh();

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  return {
    data,
    chartData,
    loading,
    error,
    refresh,
  } as UseDashboardResult<typeof role>;
}
