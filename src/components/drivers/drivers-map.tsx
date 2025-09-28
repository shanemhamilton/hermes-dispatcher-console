'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Driver, DriverStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Car,
  MapPin,
  Navigation,
  Star,
  Phone,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import {
  formatPhoneNumber,
  getInitials,
  getAvatarColor,
  cn
} from '@/lib/utils';

interface DriversMapProps {
  drivers: Driver[];
  isLoading: boolean;
}

export function DriversMap({ drivers, isLoading }: DriversMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // San Francisco default

  // Filter drivers with location data
  const driversWithLocation = drivers.filter(
    driver => driver.currentLocation && driver.isOnline
  );

  useEffect(() => {
    // In a real implementation, this would initialize the map
    // For now, we'll simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getDriverStatusColor = (status: DriverStatus) => {
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

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver);
    if (driver.currentLocation) {
      setCenter({
        lat: driver.currentLocation.coordinates.latitude,
        lng: driver.currentLocation.coordinates.longitude
      });
    }
  };

  const handleRecenter = () => {
    if (driversWithLocation.length > 0) {
      // Calculate center based on all driver locations
      const avgLat = driversWithLocation.reduce((sum, driver) =>
        sum + driver.currentLocation!.coordinates.latitude, 0) / driversWithLocation.length;
      const avgLng = driversWithLocation.reduce((sum, driver) =>
        sum + driver.currentLocation!.coordinates.longitude, 0) / driversWithLocation.length;

      setCenter({ lat: avgLat, lng: avgLng });
      setZoom(12);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full relative">
        {!mapLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Simulated Map Background */}
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative">
              {/* Grid lines to simulate map */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full border-t border-gray-400"
                    style={{ top: `${i * 10}%` }}
                  />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full border-l border-gray-400"
                    style={{ left: `${i * 10}%` }}
                  />
                ))}
              </div>

              {/* Driver Markers */}
              {driversWithLocation.map((driver, index) => (
                <button
                  key={driver.id}
                  onClick={() => handleDriverClick(driver)}
                  className={cn(
                    'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    selectedDriver?.id === driver.id && 'scale-125 z-10'
                  )}
                  style={{
                    left: `${20 + (index % 6) * 12}%`,
                    top: `${20 + Math.floor(index / 6) * 15}%`
                  }}
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: getDriverStatusColor(driver.status) }}
                    >
                      <Car className="h-4 w-4 text-white" />
                    </div>
                    {/* Pulse animation for available drivers */}
                    {driver.status === DriverStatus.AVAILABLE && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ backgroundColor: getDriverStatusColor(driver.status) }}
                        opacity={0.4}
                      />
                    )}
                  </div>
                </button>
              ))}

              {/* No drivers message */}
              {driversWithLocation.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center bg-white rounded-lg p-6 shadow-lg">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Drivers on Map</h3>
                    <p className="text-gray-600">No online drivers with location data available.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(20, zoom + 1))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(1, zoom - 1))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleRecenter}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Driver Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-medium mb-2">Driver Status</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Busy</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>On Break</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Maintenance</span>
          </div>
        </div>
      </div>

      {/* Driver Info Panel */}
      {selectedDriver && (
        <div className="absolute bottom-4 left-4 right-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedDriver.avatar} alt={selectedDriver.firstName} />
                    <AvatarFallback
                      style={{ backgroundColor: getAvatarColor(selectedDriver.id) }}
                      className="text-white font-medium"
                    >
                      {getInitials(selectedDriver.firstName, selectedDriver.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {selectedDriver.firstName} {selectedDriver.lastName}
                      </h3>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${getDriverStatusColor(selectedDriver.status)}20`,
                          color: getDriverStatusColor(selectedDriver.status)
                        }}
                      >
                        {selectedDriver.status.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        <span>
                          {selectedDriver.vehicle.make} {selectedDriver.vehicle.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{selectedDriver.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span>{selectedDriver.totalTrips} trips</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDriver(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Statistics */}
      <div className="absolute top-4 right-20 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Online: {driversWithLocation.length}</div>
          <div>Available: {driversWithLocation.filter(d => d.status === DriverStatus.AVAILABLE).length}</div>
          <div>Busy: {driversWithLocation.filter(d => d.status === DriverStatus.BUSY).length}</div>
        </div>
      </div>
    </div>
  );
}

export default DriversMap;