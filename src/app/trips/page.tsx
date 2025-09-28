import { MainLayout } from '@/components/layout/main-layout';
import { TripsDashboard } from '@/components/trips/trips-dashboard';

export default function TripsPage() {
  return (
    <MainLayout>
      <TripsDashboard />
    </MainLayout>
  );
}