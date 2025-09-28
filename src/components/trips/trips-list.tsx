'use client';

import React, { useState } from 'react';
import { Trip, TripStatus, TripPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  User,
  Car,
  MoreHorizontal,
  Eye,
  Edit,
  X,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Phone,
  MessageSquare
} from 'lucide-react';
import {
  formatRelativeTime,
  formatCurrency,
  formatDuration,
  formatPhoneNumber,
  cn
} from '@/lib/utils';
import { useTripStore, useUIStore } from '@/store';
import { api } from '@/services/api';

interface TripsListProps {
  trips: Trip[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function TripsList({ trips, isLoading, onRefresh }: TripsListProps) {
  const { updateTrip } = useTripStore();
  const { addNotification } = useUIStore();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const getStatusBadgeVariant = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return 'secondary';
      case TripStatus.ASSIGNED:
      case TripStatus.EN_ROUTE_TO_PICKUP:
      case TripStatus.ARRIVED_AT_PICKUP:
        return 'default';
      case TripStatus.RIDER_ON_BOARD:
      case TripStatus.EN_ROUTE_TO_DESTINATION:
        return 'default';
      case TripStatus.COMPLETED:
        return 'secondary';
      case TripStatus.CANCELLED:
      case TripStatus.NO_SHOW:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return 'text-orange-600 bg-orange-50';
      case TripStatus.ASSIGNED:
        return 'text-blue-600 bg-blue-50';
      case TripStatus.EN_ROUTE_TO_PICKUP:
      case TripStatus.ARRIVED_AT_PICKUP:
        return 'text-purple-600 bg-purple-50';
      case TripStatus.RIDER_ON_BOARD:
      case TripStatus.EN_ROUTE_TO_DESTINATION:
        return 'text-indigo-600 bg-indigo-50';
      case TripStatus.COMPLETED:
        return 'text-green-600 bg-green-50';
      case TripStatus.CANCELLED:
      case TripStatus.NO_SHOW:
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority: TripPriority) => {
    switch (priority) {
      case TripPriority.URGENT:
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case TripPriority.HIGH:
        return <AlertTriangle className="h-3 w-3 text-orange-600" />;
      default:
        return null;
    }
  };

  const handleTripAction = async (tripId: string, action: string, data?: any) => {
    setActionLoading(tripId);

    try {
      let response;
      switch (action) {
        case 'cancel':
          response = await api.trips.cancelTrip(tripId, data.reason);
          break;
        case 'assign':
          response = await api.trips.assignDriver(tripId, data);
          break;
        case 'updateStatus':
          response = await api.trips.updateTripStatus(tripId, data.status, data.metadata);
          break;
        default:
          throw new Error('Unknown action');
      }

      if (response.success && response.data) {
        updateTrip(tripId, response.data);
        addNotification({
          type: 'success',
          title: 'Trip Updated',
          message: `Trip ${tripId} has been updated successfully.`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Trip action failed:', error);
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: 'Failed to update trip. Please try again.',
        duration: 5000
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTrip = () => {
    if (selectedTrip && cancelReason.trim()) {
      handleTripAction(selectedTrip.id, 'cancel', { reason: cancelReason });
      setShowCancelDialog(false);
      setSelectedTrip(null);
      setCancelReason('');
    }
  };

  const canCancelTrip = (trip: Trip) => {
    return [
      TripStatus.PENDING,
      TripStatus.ASSIGNED,
      TripStatus.EN_ROUTE_TO_PICKUP,
      TripStatus.ARRIVED_AT_PICKUP
    ].includes(trip.status);
  };

  const canUpdateStatus = (trip: Trip) => {
    return trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
        <p className="text-gray-600">No trips match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {trips.map((trip) => (
        <div key={trip.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between">
            {/* Trip Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-sm text-gray-900">
                  #{trip.id.slice(-8).toUpperCase()}
                </span>

                <Badge
                  variant={getStatusBadgeVariant(trip.status)}
                  className={cn('text-xs', getStatusColor(trip.status))}
                >
                  {trip.status.replace(/_/g, ' ').toLowerCase()}
                </Badge>

                {getPriorityIcon(trip.priority)}

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
                <span className="text-sm text-gray-500">
                  {formatPhoneNumber(trip.rider.phone)}
                </span>
                {trip.rider.isVip && (
                  <Badge variant="secondary" className="text-xs">VIP</Badge>
                )}
              </div>

              {/* Locations */}
              <div className="space-y-1 mb-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-green-600 mt-1 shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">
                    {trip.pickup.address}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="h-3 w-3 text-red-600 mt-1 shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">
                    {trip.destination.address}
                  </span>
                </div>
              </div>

              {/* Driver Info */}
              {trip.driver && (
                <div className="flex items-center gap-2 mb-2">
                  <Car className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {trip.driver.firstName} {trip.driver.lastName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {trip.driver.vehicle.make} {trip.driver.vehicle.model}
                  </span>
                </div>
              )}

              {/* Trip Details */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {trip.estimatedDuration ? formatDuration(trip.estimatedDuration) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {trip.estimatedDistance ? `${trip.estimatedDistance.toFixed(1)} mi` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>
                    {trip.actualFare
                      ? formatCurrency(trip.actualFare)
                      : trip.estimatedFare
                      ? `Est. ${formatCurrency(trip.estimatedFare)}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              {trip.driver && (
                <Button variant="ghost" size="sm">
                  <Phone className="h-3 w-3" />
                </Button>
              )}

              <Button variant="ghost" size="sm">
                <MessageSquare className="h-3 w-3" />
              </Button>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading === trip.id}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Trip Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Trip
                  </DropdownMenuItem>

                  {!trip.driver && trip.status === TripStatus.PENDING && (
                    <DropdownMenuItem>
                      <Car className="mr-2 h-4 w-4" />
                      Assign Driver
                    </DropdownMenuItem>
                  )}

                  {canUpdateStatus(trip) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" />
                        Update Status
                      </DropdownMenuItem>
                    </>
                  )}

                  {canCancelTrip(trip) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowCancelDialog(true);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Trip
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel trip #{selectedTrip?.id.slice(-8).toUpperCase()}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <label className="text-sm font-medium">Cancellation Reason</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation"
              className="w-full mt-1 p-2 border rounded-md text-sm"
              rows={3}
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTrip}
              disabled={!cancelReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TripsList;