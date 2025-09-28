'use client';

import React from 'react';
import { DashboardMetrics } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Star,
  Activity,
  Target
} from 'lucide-react';
import { formatCurrency, formatDuration, cn } from '@/lib/utils';

interface MetricsOverviewProps {
  metrics: DashboardMetrics | null;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRateChange = 2.3; // Mock change percentage
  const revenueChange = 8.7;
  const waitTimeChange = -1.2;
  const ratingChange = 0.1;

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    change,
    format = 'number'
  }: {
    title: string;
    value: number;
    icon: any;
    change?: number;
    format?: 'number' | 'currency' | 'duration' | 'percentage' | 'rating';
  }) => {
    const formatValue = (value: number, format: string) => {
      switch (format) {
        case 'currency':
          return formatCurrency(value);
        case 'duration':
          return formatDuration(value);
        case 'percentage':
          return `${value}%`;
        case 'rating':
          return value.toFixed(1);
        default:
          return value.toLocaleString();
      }
    };

    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5 text-gray-600" />
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {change >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value, format)}
          </p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Key Metrics
          <span className="text-sm font-normal text-gray-500">
            (Last 24 hours)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={metrics.totalRevenue}
            icon={DollarSign}
            change={revenueChange}
            format="currency"
          />

          <MetricCard
            title="Completion Rate"
            value={metrics.completionRate}
            icon={Target}
            change={completionRateChange}
            format="percentage"
          />

          <MetricCard
            title="Avg Wait Time"
            value={metrics.averageWaitTime}
            icon={Clock}
            change={waitTimeChange}
            format="duration"
          />

          <MetricCard
            title="Avg Rating"
            value={metrics.averageRating}
            icon={Star}
            change={ratingChange}
            format="rating"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Trips</p>
            <p className="text-xl font-bold text-gray-900">{metrics.totalTrips}</p>
            <p className="text-xs text-gray-500">
              {metrics.completedTrips} completed, {metrics.cancelledTrips} cancelled
            </p>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Active Trips</p>
            <p className="text-xl font-bold text-blue-600">{metrics.activeTrips}</p>
            <p className="text-xs text-gray-500">
              {metrics.pendingTrips} pending assignment
            </p>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Online Drivers</p>
            <p className="text-xl font-bold text-green-600">{metrics.activeDrivers}</p>
            <p className="text-xs text-gray-500">
              of {metrics.totalDrivers} total drivers
            </p>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Fare</p>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(metrics.averageFare)}
            </p>
            <p className="text-xs text-gray-500">
              {((metrics.totalRevenue / metrics.completedTrips) || 0).toFixed(0)} trips avg
            </p>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Indicators</h4>
          <div className="space-y-3">
            {/* Completion Rate Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Completion Rate</span>
                <span>{metrics.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(metrics.completionRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Cancellation Rate Bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Cancellation Rate</span>
                <span>{metrics.cancellationRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(metrics.cancellationRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Driver Utilization */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Driver Utilization</span>
                <span>{Math.round((metrics.activeDrivers / metrics.totalDrivers) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((metrics.activeDrivers / metrics.totalDrivers) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricsOverview;