'use client';

import React from 'react';
import { Alert, AlertSeverity, AlertType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Clock,
  Car,
  MapPin,
  DollarSign,
  Users,
  Shield,
  Activity,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';

interface AlertsWidgetProps {
  alerts: Alert[];
}

export function AlertsWidget({ alerts }: AlertsWidgetProps) {
  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'bg-red-100 text-red-700 border-red-200';
      case AlertSeverity.HIGH:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case AlertSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case AlertSeverity.LOW:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.TRIP_DELAY:
        return <Clock className="h-4 w-4" />;
      case AlertType.DRIVER_OFFLINE:
        return <Users className="h-4 w-4" />;
      case AlertType.VEHICLE_BREAKDOWN:
        return <Car className="h-4 w-4" />;
      case AlertType.EMERGENCY:
        return <Shield className="h-4 w-4" />;
      case AlertType.PAYMENT_FAILED:
        return <DollarSign className="h-4 w-4" />;
      case AlertType.NO_DRIVERS_AVAILABLE:
        return <Users className="h-4 w-4" />;
      case AlertType.RIDER_NO_SHOW:
      case AlertType.DRIVER_NO_SHOW:
        return <X className="h-4 w-4" />;
      case AlertType.ROUTE_DEVIATION:
        return <MapPin className="h-4 w-4" />;
      case AlertType.SYSTEM_ERROR:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.isResolved);
  const criticalCount = unresolvedAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
  const highCount = unresolvedAlerts.filter(a => a.severity === AlertSeverity.HIGH).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts
            {unresolvedAlerts.length > 0 && (
              <Badge variant="destructive">{unresolvedAlerts.length}</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {unresolvedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No active alerts at this time.</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-red-600">{criticalCount}</p>
                  <p className="text-xs text-gray-600">Critical</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">{highCount}</p>
                  <p className="text-xs text-gray-600">High</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">
                    {unresolvedAlerts.filter(a => a.severity === AlertSeverity.MEDIUM).length}
                  </p>
                  <p className="text-xs text-gray-600">Medium</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">
                    {unresolvedAlerts.filter(a => a.severity === AlertSeverity.LOW).length}
                  </p>
                  <p className="text-xs text-gray-600">Low</p>
                </div>
              </div>
            </div>

            {/* Alerts List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
              {unresolvedAlerts
                .sort((a, b) => {
                  // Sort by severity first, then by creation time
                  const severityOrder = {
                    [AlertSeverity.CRITICAL]: 4,
                    [AlertSeverity.HIGH]: 3,
                    [AlertSeverity.MEDIUM]: 2,
                    [AlertSeverity.LOW]: 1
                  };

                  const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
                  if (severityDiff !== 0) return severityDiff;

                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .slice(0, 10)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 transition-colors border-l-4',
                      alert.severity === AlertSeverity.CRITICAL && 'border-l-red-500 bg-red-50',
                      alert.severity === AlertSeverity.HIGH && 'border-l-orange-500 bg-orange-50',
                      alert.severity === AlertSeverity.MEDIUM && 'border-l-yellow-500 bg-yellow-50',
                      alert.severity === AlertSeverity.LOW && 'border-l-blue-500 bg-blue-50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Alert Icon */}
                        <div className={cn(
                          'p-2 rounded-full',
                          getSeverityColor(alert.severity)
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>

                        {/* Alert Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {alert.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', getSeverityColor(alert.severity))}
                            >
                              {alert.severity}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {alert.message}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{formatRelativeTime(alert.createdAt)}</span>

                            {alert.tripId && (
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                Trip #{alert.tripId.slice(-6).toUpperCase()}
                              </span>
                            )}

                            {alert.driverId && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Driver
                              </span>
                            )}

                            {alert.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-3">
                        <Button variant="ghost" size="sm" title="View Details">
                          <Eye className="h-3 w-3" />
                        </Button>

                        <Button variant="ghost" size="sm" title="Mark Resolved">
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Actions for specific alert types */}
                    {alert.actionRequired && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          {alert.type === AlertType.NO_DRIVERS_AVAILABLE && (
                            <Button size="sm" variant="outline">
                              Find Drivers
                            </Button>
                          )}

                          {alert.type === AlertType.TRIP_DELAY && (
                            <>
                              <Button size="sm" variant="outline">
                                Reassign Driver
                              </Button>
                              <Button size="sm" variant="outline">
                                Notify Rider
                              </Button>
                            </>
                          )}

                          {alert.type === AlertType.EMERGENCY && (
                            <Button size="sm" className="bg-red-600 hover:bg-red-700">
                              Emergency Response
                            </Button>
                          )}

                          <Button size="sm" variant="ghost">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {unresolvedAlerts.length > 10 && (
              <div className="border-t bg-gray-50 px-4 py-3 text-center">
                <Button variant="ghost" size="sm">
                  View All Alerts ({unresolvedAlerts.length})
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertsWidget;