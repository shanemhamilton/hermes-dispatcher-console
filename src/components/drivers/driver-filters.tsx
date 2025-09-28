'use client';

import React, { useState } from 'react';
import { useDriverStore } from '@/store';
import { DriverStatus, DriverAvailability, VehicleType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DriverFilters() {
  const { filters, setFilters } = useDriverStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleStatusToggle = (status: DriverStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleAvailabilityToggle = (availability: DriverAvailability) => {
    const currentAvailabilities = filters.availability || [];
    const newAvailabilities = currentAvailabilities.includes(availability)
      ? currentAvailabilities.filter(a => a !== availability)
      : [...currentAvailabilities, availability];

    setFilters({ availability: newAvailabilities.length > 0 ? newAvailabilities : undefined });
  };

  const handleVehicleTypeToggle = (vehicleType: VehicleType) => {
    const currentTypes = filters.vehicleType || [];
    const newTypes = currentTypes.includes(vehicleType)
      ? currentTypes.filter(t => t !== vehicleType)
      : [...currentTypes, vehicleType];

    setFilters({ vehicleType: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setFilters({ search: value || undefined });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, phone, or employee ID..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={clearAllFilters}>
          Clear All
        </Button>
      </div>

      {/* Filter Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
          <div className="flex flex-wrap gap-1">
            {Object.values(DriverStatus).map((status) => {
              const isSelected = filters.status?.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-colors',
                    isSelected
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {status.replace('_', ' ').toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Availability</label>
          <div className="flex flex-wrap gap-1">
            {Object.values(DriverAvailability).map((availability) => {
              const isSelected = filters.availability?.includes(availability);
              return (
                <button
                  key={availability}
                  onClick={() => handleAvailabilityToggle(availability)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-colors',
                    isSelected
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {availability.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Type Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Vehicle Type</label>
          <div className="flex flex-wrap gap-1">
            {Object.values(VehicleType).map((type) => {
              const isSelected = filters.vehicleType?.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => handleVehicleTypeToggle(type)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-colors',
                    isSelected
                      ? 'bg-purple-100 border-purple-300 text-purple-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {type.replace('_', ' ').toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Online Only Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="online-only"
          checked={filters.onlineOnly || false}
          onChange={(e) => setFilters({ onlineOnly: e.target.checked || undefined })}
          className="rounded border-gray-300"
        />
        <label htmlFor="online-only" className="text-sm text-gray-700">
          Show only online drivers
        </label>
      </div>
    </div>
  );
}

export default DriverFilters;