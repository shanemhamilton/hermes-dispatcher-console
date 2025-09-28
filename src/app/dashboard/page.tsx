import { MainLayout } from '@/components/layout/main-layout';
import { OperationsDashboard } from '@/components/dashboard/operations-dashboard';

export default function DashboardPage() {
  return (
    <MainLayout>
      <OperationsDashboard />
    </MainLayout>
  );
}