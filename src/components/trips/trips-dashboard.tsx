'use client';

import React, { useState, useEffect } from 'react';
import { useTripStore, useUIStore } from '@/store';
import { TripStatus, ServiceType, TripPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  User,
  Car,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { TripCreationWizard } from './trip-creation-wizard';
import { TripsList } from './trips-list';
import { TripFilters } from './trip-filters';
import { api } from '@/services/api';
import { formatRelativeTime, formatCurrency, cn } from '@/lib/utils';

export function TripsDashboard() {
  const { trips, isLoading, setLoading, setTrips, filters } = useTripStore();
  const { addNotification } = useUIStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load trips on component mount
  useEffect(() => {
    loadTrips();
  }, [filters]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await api.trips.getTrips(filters, { page: 1, limit: 50 });
      if (response.success && response.data) {
        setTrips(response.data.trips);
      }
    } catch (error) {
      console.error('Failed to load trips:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load trips. Please try again.',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
    addNotification({
      type: 'success',
      title: 'Updated',
      message: 'Trips list has been refreshed.',
      duration: 3000
    });
  };

  const handleTripCreated = (trip: any) => {
    setShowCreateDialog(false);
    addNotification({
      type: 'success',
      title: 'Trip Created',
      message: `Trip ${trip.id} has been created successfully.`,
      duration: 5000
    });
  };

  // Calculate trip statistics
  const tripStats = {
    total: trips.length,
    pending: trips.filter(t => t.status === TripStatus.PENDING).length,
    active: trips.filter(t => [
      TripStatus.ASSIGNED,
      TripStatus.EN_ROUTE_TO_PICKUP,
      TripStatus.ARRIVED_AT_PICKUP,
      TripStatus.RIDER_ON_BOARD,
      TripStatus.EN_ROUTE_TO_DESTINATION
    ].includes(t.status)).length,
    completed: trips.filter(t => t.status === TripStatus.COMPLETED).length,
    cancelled: trips.filter(t => t.status === TripStatus.CANCELLED).length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600">Manage and monitor all trips</p>
        </div>

        <div className="flex items-center gap-3">
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
                New Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <TripCreationWizard
                onSuccess={handleTripCreated}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold">{tripStats.total}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{tripStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{tripStats.active}</p>
              </div>
              <Car className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{tripStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{tripStats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
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
            <TripFilters />
          </CardContent>
        </Card>
      )}

      {/* Trips List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Trips</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {tripStats.total} trips
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TripsList
            trips={trips}
            isLoading={isLoading}
            onRefresh={loadTrips}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default TripsDashboard;