import { MainLayout } from '@/components/layout/main-layout';
import { DriversDashboard } from '@/components/drivers/drivers-dashboard';

export default function DriversPage() {
  return (
    <MainLayout>
      <DriversDashboard />
    </MainLayout>
  );
}