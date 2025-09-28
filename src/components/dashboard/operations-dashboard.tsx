'use client';

import React, { useState, useEffect } from 'react';
import { useTripStore, useDriverStore, useAlertStore, useMetricsStore, useUIStore } from '@/store';
import { useWebSocket } from '@/services/websocket';
import { TripStatus, DriverStatus, AlertSeverity } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  Car,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  Plus,
  Filter
} from 'lucide-react';
import { LiveTripsTable } from './live-trips-table';
import { ActiveDriversWidget } from './active-drivers-widget';
import { AlertsWidget } from './alerts-widget';
import { MetricsOverview } from './metrics-overview';
import { DispatchMap } from './dispatch-map';
import { api } from '@/services/api';
import { formatCurrency, formatDuration, cn } from '@/lib/utils';

export function OperationsDashboard() {
  const { trips, setTrips, setLoading: setTripsLoading } = useTripStore();
  const { drivers, setDrivers, setLoading: setDriversLoading } = useDriverStore();
  const { alerts, setAlerts } = useAlertStore();
  const { metrics, setMetrics, setLoading: setMetricsLoading } = useMetricsStore();
  const { addNotification } = useUIStore();
  const { isConnected } = useWebSocket();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'map'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh interval
    const interval = autoRefresh ? setInterval(loadDashboardData, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    setRefreshing(true);

    try {
      // Load active trips
      setTripsLoading(true);
      const tripsResponse = await api.trips.getTrips({
        status: [
          TripStatus.PENDING,
          TripStatus.ASSIGNED,
          TripStatus.EN_ROUTE_TO_PICKUP,
          TripStatus.ARRIVED_AT_PICKUP,
          TripStatus.RIDER_ON_BOARD,
          TripStatus.EN_ROUTE_TO_DESTINATION
        ]
      }, { page: 1, limit: 50 });

      if (tripsResponse.success) {
        setTrips(tripsResponse.data?.trips || []);
      }

      // Load active drivers
      setDriversLoading(true);
      const driversResponse = await api.drivers.getDrivers({
        onlineOnly: true
      }, { page: 1, limit: 100 });

      if (driversResponse.success) {
        setDrivers(driversResponse.data?.drivers || []);
      }

      // Load recent alerts
      const alertsResponse = await api.alerts.getAlerts({ page: 1, limit: 20 });
      if (alertsResponse.success) {
        setAlerts(alertsResponse.data?.alerts || []);
      }

      // Load dashboard metrics
      setMetricsLoading(true);
      const metricsResponse = await api.analytics.getDashboardMetrics({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
        period: 'hour' as any
      });

      if (metricsResponse.success) {
        setMetrics(metricsResponse.data!);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load dashboard data. Please try again.',
        duration: 5000
      });
    } finally {
      setTripsLoading(false);
      setDriversLoading(false);
      setMetricsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData();
    addNotification({
      type: 'success',
      title: 'Updated',
      message: 'Dashboard has been refreshed.',
      duration: 3000
    });
  };

  // Calculate real-time statistics
  const stats = {
    activeTrips: trips.filter(t => [
      TripStatus.ASSIGNED,
      TripStatus.EN_ROUTE_TO_PICKUP,
      TripStatus.ARRIVED_AT_PICKUP,
      TripStatus.RIDER_ON_BOARD,
      TripStatus.EN_ROUTE_TO_DESTINATION
    ].includes(t.status)).length,

    pendingTrips: trips.filter(t => t.status === TripStatus.PENDING).length,

    onlineDrivers: drivers.filter(d => d.isOnline).length,

    availableDrivers: drivers.filter(d =>
      d.isOnline && d.status === DriverStatus.AVAILABLE
    ).length,

    criticalAlerts: alerts.filter(a =>
      !a.isResolved && a.severity === AlertSeverity.CRITICAL
    ).length,

    totalRevenue: metrics?.totalRevenue || 0,

    averageWaitTime: metrics?.averageWaitTime || 0,

    completionRate: metrics?.completionRate || 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-600">Real-time operational overview</p>
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border rounded-lg p-1">
            <Button
              variant={selectedView === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('overview')}
            >
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={selectedView === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('map')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Map View
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            Auto Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Active Trips</p>
                <p className="text-lg font-bold text-blue-600">{stats.activeTrips}</p>
              </div>
              <Car className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-orange-600">{stats.pendingTrips}</p>
              </div>
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Online</p>
                <p className="text-lg font-bold text-green-600">{stats.onlineDrivers}</p>
              </div>
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Available</p>
                <p className="text-lg font-bold text-emerald-600">{stats.availableDrivers}</p>
              </div>
              <Activity className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Alerts</p>
                <p className="text-lg font-bold text-red-600">{stats.criticalAlerts}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Avg Wait</p>
                <p className="text-lg font-bold text-indigo-600">
                  {formatDuration(stats.averageWaitTime)}
                </p>
              </div>
              <Clock className="h-6 w-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Success Rate</p>
                <p className="text-lg font-bold text-teal-600">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {selectedView === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trips and Drivers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Trips */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Active Trips
                    <Badge variant="secondary">{stats.activeTrips}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New Trip
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <LiveTripsTable trips={trips} />
              </CardContent>
            </Card>

            {/* Metrics Overview */}
            <MetricsOverview metrics={metrics} />
          </div>

          {/* Right Column - Drivers and Alerts */}
          <div className="space-y-6">
            {/* Active Drivers */}
            <ActiveDriversWidget drivers={drivers} />

            {/* Recent Alerts */}
            <AlertsWidget alerts={alerts} />
          </div>
        </div>
      ) : (
        /* Map View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Dispatch Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DispatchMap trips={trips} drivers={drivers} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OperationsDashboard;