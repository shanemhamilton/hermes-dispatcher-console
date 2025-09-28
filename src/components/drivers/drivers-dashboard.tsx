'use client';

import React, { useState, useEffect } from 'react';
import { useDriverStore, useUIStore } from '@/store';
import { DriverStatus, DriverAvailability, VehicleType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  RefreshCw,
  Filter,
  Car,
  Users,
  Clock,
  MapPin,
  UserCheck,
  UserX,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { DriversList } from './drivers-list';
import { DriversMap } from './drivers-map';
import { DriverFilters } from './driver-filters';
import { CreateDriverForm } from './create-driver-form';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

export function DriversDashboard() {
  const { drivers, isLoading, setLoading, setDrivers, filters } = useDriverStore();
  const { addNotification } = useUIStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');

  // Load drivers on component mount
  useEffect(() => {
    loadDrivers();
  }, [filters]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await api.drivers.getDrivers(filters, { page: 1, limit: 100 });
      if (response.success && response.data) {
        setDrivers(response.data.drivers);
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load drivers. Please try again.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDrivers();
    setRefreshing(false);
    addNotification({
      type: 'success',
      title: 'Updated',
      message: 'Drivers list has been refreshed.',
      duration: 3000
    });
  };

  const handleDriverCreated = (driver: any) => {
    setShowCreateDialog(false);
    addNotification({
      type: 'success',
      title: 'Driver Created',
      message: `Driver ${driver.firstName} ${driver.lastName} has been added successfully.`,
      duration: 5000
    });
  };

  // Calculate driver statistics
  const driverStats = {
    total: drivers.length,
    online: drivers.filter(d => d.isOnline).length,
    available: drivers.filter(d => d.status === DriverStatus.AVAILABLE).length,
    busy: drivers.filter(d => d.status === DriverStatus.BUSY).length,
    offline: drivers.filter(d => !d.isOnline).length,
    onBreak: drivers.filter(d => d.status === DriverStatus.BREAK).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600">Manage driver roster and availability</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border rounded-lg p-1">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              <Users className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={view === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('map')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Map
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <CreateDriverForm
                onSuccess={handleDriverCreated}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold">{driverStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-2xl font-bold text-green-600">{driverStats.online}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-emerald-600">{driverStats.available}</p>
              </div>
              <UserCheck className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-orange-600">{driverStats.busy}</p>
              </div>
              <Car className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Break</p>
                <p className="text-2xl font-bold text-yellow-600">{driverStats.onBreak}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-600">{driverStats.offline}</p>
              </div>
              <UserX className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <DriverFilters />
          </CardContent>
        </Card>
      )}

      {/* Active Drivers Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Available Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drivers
                .filter(d => d.status === DriverStatus.AVAILABLE)
                .slice(0, 5)
                .map(driver => (
                  <div key={driver.id} className="flex items-center justify-between text-sm">
                    <span>{driver.firstName} {driver.lastName}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                  </div>
                ))}
              {drivers.filter(d => d.status === DriverStatus.AVAILABLE).length === 0 && (
                <p className="text-sm text-gray-500">No available drivers</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-orange-600" />
              Busy Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drivers
                .filter(d => d.status === DriverStatus.BUSY)
                .slice(0, 5)
                .map(driver => (
                  <div key={driver.id} className="flex items-center justify-between text-sm">
                    <span>{driver.firstName} {driver.lastName}</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Busy
                    </Badge>
                  </div>
                ))}
              {drivers.filter(d => d.status === DriverStatus.BUSY).length === 0 && (
                <p className="text-sm text-gray-500">No busy drivers</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drivers
                .filter(d => !d.isOnline || d.status === DriverStatus.MAINTENANCE)
                .slice(0, 5)
                .map(driver => (
                  <div key={driver.id} className="flex items-center justify-between text-sm">
                    <span>{driver.firstName} {driver.lastName}</span>
                    <Badge variant="destructive">
                      {!d.isOnline ? 'Offline' : 'Maintenance'}
                    </Badge>
                  </div>
                ))}
              {drivers.filter(d => !d.isOnline || d.status === DriverStatus.MAINTENANCE).length === 0 && (
                <p className="text-sm text-gray-500">All drivers operational</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {view === 'list' ? 'Drivers List' : 'Drivers Map'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {driverStats.online} of {driverStats.total} drivers online
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {view === 'list' ? (
            <DriversList
              drivers={drivers}
              isLoading={isLoading}
              onRefresh={loadDrivers}
            />
          ) : (
            <DriversMap
              drivers={drivers}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DriversDashboard;