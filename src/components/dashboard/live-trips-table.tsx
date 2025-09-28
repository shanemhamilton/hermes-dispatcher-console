'use client';

import React, { useState } from 'react';
import { Trip, TripStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Navigation,
  Clock,
  User,
  Car,
  Phone,
  MoreHorizontal,
  Eye,
  AlertTriangle
} from 'lucide-react';
import {
  formatRelativeTime,
  formatDuration,
  formatPhoneNumber,
  getInitials,
  getAvatarColor,
  cn
} from '@/lib/utils';

interface LiveTripsTableProps {
  trips: Trip[];
}

export function LiveTripsTable({ trips }: LiveTripsTableProps) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return 'bg-orange-100 text-orange-800';
      case TripStatus.ASSIGNED:
        return 'bg-blue-100 text-blue-800';
      case TripStatus.EN_ROUTE_TO_PICKUP:
        return 'bg-purple-100 text-purple-800';
      case TripStatus.ARRIVED_AT_PICKUP:
        return 'bg-indigo-100 text-indigo-800';
      case TripStatus.RIDER_ON_BOARD:
        return 'bg-cyan-100 text-cyan-800';
      case TripStatus.EN_ROUTE_TO_DESTINATION:
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return <Clock className="h-3 w-3" />;
      case TripStatus.ASSIGNED:
        return <User className="h-3 w-3" />;
      case TripStatus.EN_ROUTE_TO_PICKUP:
      case TripStatus.EN_ROUTE_TO_DESTINATION:
        return <Navigation className="h-3 w-3" />;
      case TripStatus.ARRIVED_AT_PICKUP:
        return <MapPin className="h-3 w-3" />;
      case TripStatus.RIDER_ON_BOARD:
        return <Car className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getUrgencyLevel = (trip: Trip) => {
    const now = new Date();
    const requestTime = new Date(trip.requestedAt);
    const waitTime = (now.getTime() - requestTime.getTime()) / (1000 * 60); // minutes

    if (trip.status === TripStatus.PENDING && waitTime > 10) {
      return 'urgent';
    }

    if (trip.scheduledAt) {
      const scheduledTime = new Date(trip.scheduledAt);
      const timeUntilScheduled = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
      if (timeUntilScheduled < 15 && timeUntilScheduled > 0) {
        return 'soon';
      }
    }

    return 'normal';
  };

  if (trips.length === 0) {
    return (
      <div className="text-center py-8">
        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Trips</h3>
        <p className="text-gray-600">All quiet on the dispatch front!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {trips.map((trip) => {
            const urgency = getUrgencyLevel(trip);

            return (
              <div
                key={trip.id}
                className={cn(
                  'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                  urgency === 'urgent' && 'border-l-4 border-red-500 bg-red-50',
                  urgency === 'soon' && 'border-l-4 border-yellow-500 bg-yellow-50',
                  selectedTrip?.id === trip.id && 'bg-blue-50'
                )}
                onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
              >
                <div className="flex items-start justify-between">
                  {/* Trip Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        #{trip.id.slice(-6).toUpperCase()}
                      </span>

                      <Badge className={cn('text-xs flex items-center gap-1', getStatusColor(trip.status))}>
                        {getStatusIcon(trip.status)}
                        {trip.status.replace(/_/g, ' ').toLowerCase()}
                      </Badge>

                      {urgency === 'urgent' && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Urgent
                        </Badge>
                      )}

                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(trip.requestedAt)}
                      </span>
                    </div>

                    {/* Rider Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {trip.rider.firstName} {trip.rider.lastName}
                      </span>
                      {trip.rider.isVip && (
                        <Badge variant="secondary" className="text-xs">VIP</Badge>
                      )}
                    </div>

                    {/* Driver Info */}
                    {trip.driver ? (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={trip.driver.avatar} />
                            <AvatarFallback
                              style={{ backgroundColor: getAvatarColor(trip.driver.id) }}
                              className="text-white text-xs"
                            >
                              {getInitials(trip.driver.firstName, trip.driver.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            {trip.driver.firstName} {trip.driver.lastName}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {trip.driver.vehicle.make} {trip.driver.vehicle.model}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-500 italic">No driver assigned</span>
                      </div>
                    )}

                    {/* Route Info */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-green-600 mt-1 shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-1">
                          {trip.pickup.address}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="h-3 w-3 text-red-600 mt-1 shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-1">
                          {trip.destination.address}
                        </span>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {trip.estimatedDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(trip.estimatedDuration)}</span>
                        </div>
                      )}
                      {trip.estimatedDistance && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{trip.estimatedDistance.toFixed(1)} mi</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4">
                    {trip.rider.phone && (
                      <Button variant="ghost" size="sm" title="Call Rider">
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}

                    {trip.driver?.phone && (
                      <Button variant="ghost" size="sm" title="Call Driver">
                        <Car className="h-3 w-3" />
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" title="View Details">
                      <Eye className="h-3 w-3" />
                    </Button>

                    <Button variant="ghost" size="sm" title="More Actions">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedTrip?.id === trip.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Rider Contact</p>
                        <p className="text-gray-600">{formatPhoneNumber(trip.rider.phone)}</p>
                        {trip.rider.email && (
                          <p className="text-gray-600">{trip.rider.email}</p>
                        )}
                      </div>

                      {trip.driver && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Driver Contact</p>
                          <p className="text-gray-600">{formatPhoneNumber(trip.driver.phone)}</p>
                          <p className="text-gray-600">Rating: {trip.driver.rating.toFixed(1)}</p>
                        </div>
                      )}

                      {trip.specialInstructions && (
                        <div className="col-span-2">
                          <p className="font-medium text-gray-700 mb-1">Special Instructions</p>
                          <p className="text-gray-600">{trip.specialInstructions}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline">
                        View Full Details
                      </Button>
                      <Button size="sm" variant="outline">
                        Track on Map
                      </Button>
                      {trip.status === TripStatus.PENDING && !trip.driver && (
                        <Button size="sm">
                          Assign Driver
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {trips.length > 10 && (
        <div className="border-t bg-gray-50 px-4 py-3 text-center">
          <Button variant="ghost" size="sm">
            View All Active Trips ({trips.length})
          </Button>
        </div>
      )}
    </div>
  );
}

export default LiveTripsTable;