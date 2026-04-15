import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';

export default function Dashboard() {
  const fetchDashboard = useDashboardStore((s) => s.fetch);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return <div className="h-full w-full overflow-y-auto p-6" />;
}
