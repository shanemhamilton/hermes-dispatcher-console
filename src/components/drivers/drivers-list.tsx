'use client';

import React, { useState } from 'react';
import { Driver, DriverStatus, DriverAvailability } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Car,
  MapPin,
  Clock,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  Activity,
  Navigation,
  Star,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  Calendar
} from 'lucide-react';
import {
  formatRelativeTime,
  formatPhoneNumber,
  getInitials,
  getAvatarColor,
  cn
} from '@/lib/utils';
import { useDriverStore, useUIStore } from '@/store';
import { api } from '@/services/api';

interface DriversListProps {
  drivers: Driver[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function DriversList({ drivers, isLoading, onRefresh }: DriversListProps) {
  const { updateDriver } = useDriverStore();
  const { addNotification } = useUIStore();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const getStatusBadgeVariant = (status: DriverStatus) => {
    switch (status) {
      case DriverStatus.AVAILABLE:
        return 'secondary';
      case DriverStatus.BUSY:
      case DriverStatus.EN_ROUTE:
        return 'default';
      case DriverStatus.BREAK:
        return 'secondary';
      case DriverStatus.OFFLINE:
        return 'secondary';
      case DriverStatus.MAINTENANCE:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: DriverStatus, isOnline: boolean) => {
    if (!isOnline) {
      return 'text-gray-600 bg-gray-100';
    }

    switch (status) {
      case DriverStatus.AVAILABLE:
        return 'text-green-700 bg-green-100';
      case DriverStatus.BUSY:
      case DriverStatus.EN_ROUTE:
        return 'text-blue-700 bg-blue-100';
      case DriverStatus.BREAK:
        return 'text-yellow-700 bg-yellow-100';
      case DriverStatus.MAINTENANCE:
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvailabilityIcon = (availability: DriverAvailability, isOnline: boolean) => {
    if (!isOnline) {
      return <UserX className="h-3 w-3 text-gray-500" />;
    }

    switch (availability) {
      case DriverAvailability.ONLINE:
        return <Activity className="h-3 w-3 text-green-500" />;
      case DriverAvailability.BUSY:
        return <Car className="h-3 w-3 text-orange-500" />;
      case DriverAvailability.AWAY:
        return <Pause className="h-3 w-3 text-yellow-500" />;
      default:
        return <UserX className="h-3 w-3 text-gray-500" />;
    }
  };

  const handleDriverAction = async (driverId: string, action: string, data?: any) => {
    setActionLoading(driverId);

    try {
      let response;
      switch (action) {
        case 'updateStatus':
          response = await api.drivers.updateDriverStatus(driverId, data.status, data.availability);
          break;
        case 'deactivate':
          response = await api.drivers.updateDriver(driverId, { isActive: false });
          break;
        default:
          throw new Error('Unknown action');
      }

      if (response.success && response.data) {
        updateDriver(driverId, response.data);
        addNotification({
          type: 'success',
          title: 'Driver Updated',
          message: `Driver status has been updated successfully.`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Driver action failed:', error);
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: 'Failed to update driver. Please try again.',
        duration: 5000
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateDriver = () => {
    if (selectedDriver) {
      handleDriverAction(selectedDriver.id, 'deactivate');
      setShowDeactivateDialog(false);
      setSelectedDriver(null);
    }
  };

  const canUpdateStatus = (driver: Driver) => {
    return driver.isActive;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
        <p className="text-gray-600">No drivers match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {drivers.map((driver) => (
        <div key={driver.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            {/* Driver Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={driver.avatar} alt={driver.firstName} />
                  <AvatarFallback
                    style={{ backgroundColor: getAvatarColor(driver.id) }}
                    className="text-white font-medium"
                  >
                    {getInitials(driver.firstName, driver.lastName)}
                  </AvatarFallback>
                </Avatar>

                {/* Online Status Indicator */}
                <div className="absolute -bottom-1 -right-1">
                  {getAvailabilityIcon(driver.availability, driver.isOnline)}
                </div>
              </div>

              {/* Driver Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {driver.firstName} {driver.lastName}
                  </h3>

                  <Badge
                    variant={getStatusBadgeVariant(driver.status)}
                    className={cn('text-xs', getStatusColor(driver.status, driver.isOnline))}
                  >
                    {driver.isOnline ? driver.status.replace('_', ' ').toLowerCase() : 'offline'}
                  </Badge>

                  {driver.employeeId && (
                    <span className="text-xs text-gray-500">#{driver.employeeId}</span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{formatPhoneNumber(driver.phone)}</span>
                  </div>
                  {driver.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {/* Vehicle Info */}
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    <span>
                      {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.licensePlate})
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    <span>{driver.rating.toFixed(1)}</span>
                  </div>

                  {/* Total Trips */}
                  <div className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    <span>{driver.totalTrips} trips</span>
                  </div>

                  {/* Last Active */}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(driver.lastActive)}</span>
                  </div>
                </div>

                {/* Current Location (if available) */}
                {driver.currentLocation && driver.isOnline && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {driver.currentLocation.coordinates.latitude.toFixed(4)}, {driver.currentLocation.coordinates.longitude.toFixed(4)}
                    </span>
                  </div>
                )}

                {/* Active Shift Info */}
                {driver.shift && driver.shift.status === 'active' && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Shift started {formatRelativeTime(driver.shift.startTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Status Actions */}
              {driver.isOnline && canUpdateStatus(driver) && (
                <div className="flex items-center gap-1">
                  {driver.status === DriverStatus.AVAILABLE && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDriverAction(driver.id, 'updateStatus', {
                        status: DriverStatus.BREAK,
                        availability: DriverAvailability.AWAY
                      })}
                      disabled={actionLoading === driver.id}
                      title="Set on break"
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}

                  {driver.status === DriverStatus.BREAK && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDriverAction(driver.id, 'updateStatus', {
                        status: DriverStatus.AVAILABLE,
                        availability: DriverAvailability.ONLINE
                      })}
                      disabled={actionLoading === driver.id}
                      title="Set available"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading === driver.id}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Driver Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Driver
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Navigation className="mr-2 h-4 w-4" />
                    View Trips
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <MapPin className="mr-2 h-4 w-4" />
                    Track Location
                  </DropdownMenuItem>

                  {canUpdateStatus(driver) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Activity className="mr-2 h-4 w-4" />
                        Update Status
                      </DropdownMenuItem>

                      {driver.status !== DriverStatus.MAINTENANCE && (
                        <DropdownMenuItem>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Set Maintenance
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {driver.isActive && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDeactivateDialog(true);
                        }}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate Driver
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedDriver?.firstName} {selectedDriver?.lastName}?
              They will no longer be able to receive trip assignments until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateDriver}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate Driver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DriversList;