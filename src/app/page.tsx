import { MainLayout } from '@/components/layout/main-layout';
import { OperationsDashboard } from '@/components/dashboard/operations-dashboard';

export default function HomePage() {
  return (
    <MainLayout>
      <OperationsDashboard />
    </MainLayout>
  );
}