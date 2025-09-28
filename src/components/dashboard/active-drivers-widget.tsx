'use client';

import React from 'react';
import { Driver, DriverStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Car,
  MapPin,
  Clock,
  Activity,
  Phone,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import {
  formatRelativeTime,
  getInitials,
  getAvatarColor,
  cn
} from '@/lib/utils';

interface ActiveDriversWidgetProps {
  drivers: Driver[];
}

export function ActiveDriversWidget({ drivers }: ActiveDriversWidgetProps) {
  const getStatusColor = (status: DriverStatus, isOnline: boolean) => {
    if (!isOnline) {
      return 'bg-gray-100 text-gray-600';
    }

    switch (status) {
      case DriverStatus.AVAILABLE:
        return 'bg-green-100 text-green-700';
      case DriverStatus.BUSY:
      case DriverStatus.EN_ROUTE:
        return 'bg-orange-100 text-orange-700';
      case DriverStatus.BREAK:
        return 'bg-yellow-100 text-yellow-700';
      case DriverStatus.MAINTENANCE:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: DriverStatus, isOnline: boolean) => {
    if (!isOnline) {
      return <Clock className="h-3 w-3" />;
    }

    switch (status) {
      case DriverStatus.AVAILABLE:
        return <Activity className="h-3 w-3" />;
      case DriverStatus.BUSY:
      case DriverStatus.EN_ROUTE:
        return <Car className="h-3 w-3" />;
      case DriverStatus.BREAK:
        return <Clock className="h-3 w-3" />;
      case DriverStatus.MAINTENANCE:
        return <MapPin className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Sort drivers by status priority (available first, then busy, etc.)
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (!a.isOnline && b.isOnline) return 1;
    if (a.isOnline && !b.isOnline) return -1;

    const statusPriority = {
      [DriverStatus.AVAILABLE]: 1,
      [DriverStatus.BUSY]: 2,
      [DriverStatus.EN_ROUTE]: 3,
      [DriverStatus.BREAK]: 4,
      [DriverStatus.MAINTENANCE]: 5,
      [DriverStatus.OFFLINE]: 6
    };

    return (statusPriority[a.status] || 6) - (statusPriority[b.status] || 6);
  });

  const onlineCount = drivers.filter(d => d.isOnline).length;
  const availableCount = drivers.filter(d => d.isOnline && d.status === DriverStatus.AVAILABLE).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Drivers
            <Badge variant="secondary">{onlineCount} online</Badge>
          </CardTitle>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {drivers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Drivers Online</h3>
            <p className="text-gray-600">Waiting for drivers to come online...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{availableCount}</p>
                  <p className="text-xs text-gray-600">Available</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">
                    {drivers.filter(d => d.isOnline && d.status === DriverStatus.BUSY).length}
                  </p>
                  <p className="text-xs text-gray-600">Busy</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">
                    {drivers.filter(d => d.isOnline && d.status === DriverStatus.BREAK).length}
                  </p>
                  <p className="text-xs text-gray-600">On Break</p>
                </div>
              </div>
            </div>

            {/* Drivers List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
              {sortedDrivers.slice(0, 10).map((driver) => (
                <div key={driver.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar with Status Indicator */}
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={driver.avatar} alt={driver.firstName} />
                          <AvatarFallback
                            style={{ backgroundColor: getAvatarColor(driver.id) }}
                            className="text-white font-medium"
                          >
                            {getInitials(driver.firstName, driver.lastName)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Status indicator dot */}
                        <div className={cn(
                          'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
                          driver.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                      </div>

                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {driver.firstName} {driver.lastName}
                          </h3>
                          <Badge
                            className={cn('text-xs flex items-center gap-1', getStatusColor(driver.status, driver.isOnline))}
                          >
                            {getStatusIcon(driver.status, driver.isOnline)}
                            {driver.isOnline ? driver.status.replace('_', ' ').toLowerCase() : 'offline'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            <span>{driver.vehicle.make} {driver.vehicle.model}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(driver.lastActive)}</span>
                          </div>
                        </div>

                        {/* Current Location (if available and online) */}
                        {driver.currentLocation && driver.isOnline && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {driver.currentLocation.coordinates.latitude.toFixed(3)}, {driver.currentLocation.coordinates.longitude.toFixed(3)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {driver.isOnline && (
                        <Button variant="ghost" size="sm" title="Call Driver">
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}

                      <Button variant="ghost" size="sm" title="More Actions">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {drivers.length > 10 && (
              <div className="border-t bg-gray-50 px-4 py-3 text-center">
                <Button variant="ghost" size="sm">
                  View All Drivers ({drivers.length})
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ActiveDriversWidget;