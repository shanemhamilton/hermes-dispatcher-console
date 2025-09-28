'use client';

import React, { useState } from 'react';
import { Trip, Driver, TripStatus, DriverStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Navigation,
  Car,
  User,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DispatchMapProps {
  trips: Trip[];
  drivers: Driver[];
}

export function DispatchMap({ trips, drivers }: DispatchMapProps) {
  const [selectedItem, setSelectedItem] = useState<{ type: 'trip' | 'driver'; id: string } | null>(null);
  const [showDrivers, setShowDrivers] = useState(true);
  const [showTrips, setShowTrips] = useState(true);
  const [zoom, setZoom] = useState(12);

  // Filter active items
  const activeTrips = trips.filter(trip =>
    trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED
  );

  const onlineDrivers = drivers.filter(driver => driver.isOnline);

  // Get marker colors based on status
  const getTripMarkerColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return '#F59E0B'; // amber
      case TripStatus.ASSIGNED:
      case TripStatus.EN_ROUTE_TO_PICKUP:
        return '#3B82F6'; // blue
      case TripStatus.ARRIVED_AT_PICKUP:
      case TripStatus.RIDER_ON_BOARD:
        return '#8B5CF6'; // purple
      case TripStatus.EN_ROUTE_TO_DESTINATION:
        return '#10B981'; // emerald
      default:
        return '#6B7280'; // gray
    }
  };

  const getDriverMarkerColor = (status: DriverStatus) => {
    switch (status) {
      case DriverStatus.AVAILABLE:
        return '#10B981'; // green
      case DriverStatus.BUSY:
      case DriverStatus.EN_ROUTE:
        return '#F59E0B'; // orange
      case DriverStatus.BREAK:
        return '#6B7280'; // gray
      case DriverStatus.MAINTENANCE:
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const handleMarkerClick = (type: 'trip' | 'driver', id: string) => {
    setSelectedItem(selectedItem?.id === id ? null : { type, id });
  };

  const selectedTrip = selectedItem?.type === 'trip'
    ? trips.find(t => t.id === selectedItem.id)
    : null;

  const selectedDriver = selectedItem?.type === 'driver'
    ? drivers.find(d => d.id === selectedItem.id)
    : null;

  return (
    <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div className="w-full h-full relative">
        {/* Simulated Map Background */}
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative">
          {/* Grid lines to simulate map */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full border-t border-gray-400"
                style={{ top: `${i * 5}%` }}
              />
            ))}
            {[...Array(20)].map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full border-l border-gray-400"
                style={{ left: `${i * 5}%` }}
              />
            ))}
          </div>

          {/* Trip Markers */}
          {showTrips && activeTrips.map((trip, index) => (
            <div key={`trip-${trip.id}`} className="absolute">
              {/* Pickup Marker */}
              <button
                onClick={() => handleMarkerClick('trip', trip.id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-200"
                style={{
                  left: `${15 + (index % 8) * 10}%`,
                  top: `${15 + Math.floor(index / 8) * 12}%`
                }}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: getTripMarkerColor(trip.status) }}
                >
                  <MapPin className="h-3 w-3 text-white" />
                </div>
              </button>

              {/* Destination Marker */}
              <button
                onClick={() => handleMarkerClick('trip', trip.id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-200"
                style={{
                  left: `${25 + (index % 8) * 10}%`,
                  top: `${25 + Math.floor(index / 8) * 12}%`
                }}
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: getTripMarkerColor(trip.status) }}
                >
                  <Navigation className="h-3 w-3 text-white" />
                </div>
              </button>

              {/* Route Line */}
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: `${15 + (index % 8) * 10}%`,
                  top: `${15 + Math.floor(index / 8) * 12}%`,
                  width: '10%',
                  height: '12%'
                }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2="100%"
                  y2="100%"
                  stroke={getTripMarkerColor(trip.status)}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              </svg>
            </div>
          ))}

          {/* Driver Markers */}
          {showDrivers && onlineDrivers.map((driver, index) => (
            <button
              key={`driver-${driver.id}`}
              onClick={() => handleMarkerClick('driver', driver.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-200"
              style={{
                left: `${20 + (index % 7) * 11}%`,
                top: `${20 + Math.floor(index / 7) * 15}%`
              }}
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: getDriverMarkerColor(driver.status) }}
                >
                  <Car className="h-4 w-4 text-white" />
                </div>

                {/* Pulse animation for available drivers */}
                {driver.status === DriverStatus.AVAILABLE && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: getDriverMarkerColor(driver.status) }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(20, zoom + 1))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(1, zoom - 1))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Layers
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTrips}
              onChange={(e) => setShowTrips(e.target.checked)}
              className="rounded"
            />
            Trips ({activeTrips.length})
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDrivers}
              onChange={(e) => setShowDrivers(e.target.checked)}
              className="rounded"
            />
            Drivers ({onlineDrivers.length})
          </label>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-medium mb-2">Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>En Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Pickup</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Busy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Break</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Item Info Panel */}
      {(selectedTrip || selectedDriver) && (
        <div className="absolute bottom-4 right-4 w-80">
          <Card>
            <CardContent className="p-4">
              {selectedTrip && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Trip #{selectedTrip.id.slice(-6).toUpperCase()}</h3>
                    <Badge className={cn('text-xs', getStatusColor(selectedTrip.status))}>
                      {selectedTrip.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItem(null)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{selectedTrip.rider.firstName} {selectedTrip.rider.lastName}</span>
                    </div>

                    {selectedTrip.driver && (
                      <div className="flex items-center gap-2">
                        <Car className="h-3 w-3" />
                        <span>{selectedTrip.driver.firstName} {selectedTrip.driver.lastName}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex items-start gap-2 mb-1">
                        <MapPin className="h-3 w-3 text-green-600 mt-1" />
                        <span className="text-xs">{selectedTrip.pickup.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="h-3 w-3 text-red-600 mt-1" />
                        <span className="text-xs">{selectedTrip.destination.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedDriver && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{selectedDriver.firstName} {selectedDriver.lastName}</h3>
                    <Badge className={cn('text-xs', getDriverStatusColor(selectedDriver.status))}>
                      {selectedDriver.status.replace('_', ' ').toLowerCase()}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItem(null)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3" />
                      <span>{selectedDriver.vehicle.make} {selectedDriver.vehicle.model}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Rating: {selectedDriver.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{selectedDriver.totalTrips} trips</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Statistics */}
      <div className="absolute top-4 right-20 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Active Trips: {activeTrips.length}</div>
          <div>Online Drivers: {onlineDrivers.length}</div>
          <div>Available: {onlineDrivers.filter(d => d.status === DriverStatus.AVAILABLE).length}</div>
        </div>
      </div>
    </div>
  );
}

// Helper function for status colors (reuse from other components)
const getStatusColor = (status: TripStatus) => {
  switch (status) {
    case TripStatus.PENDING:
      return 'bg-orange-100 text-orange-800';
    case TripStatus.ASSIGNED:
      return 'bg-blue-100 text-blue-800';
    case TripStatus.EN_ROUTE_TO_PICKUP:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getDriverStatusColor = (status: DriverStatus) => {
  switch (status) {
    case DriverStatus.AVAILABLE:
      return 'bg-green-100 text-green-700';
    case DriverStatus.BUSY:
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

export default DispatchMap;