'use client';

import React, { useState } from 'react';
import { useTripStore } from '@/store';
import { TripStatus, ServiceType, TripPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  X,
  Calendar as CalendarIcon,
  Search,
  Filter,
  RotateCcw
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export function TripFilters() {
  const { filters, setFilters } = useTripStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: filters.dateRange?.start,
    to: filters.dateRange?.end
  });

  const handleStatusToggle = (status: TripStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    setFilters({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleServiceTypeToggle = (serviceType: ServiceType) => {
    const currentTypes = filters.serviceType || [];
    const newTypes = currentTypes.includes(serviceType)
      ? currentTypes.filter(t => t !== serviceType)
      : [...currentTypes, serviceType];

    setFilters({ serviceType: newTypes.length > 0 ? newTypes : undefined });
  };

  const handlePriorityToggle = (priority: TripPriority) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];

    setFilters({ priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    if (range.from && range.to) {
      setFilters({
        dateRange: {
          start: range.from,
          end: range.to,
          period: 'day' as any
        }
      });
    } else {
      setFilters({ dateRange: undefined });
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setFilters({ search: value || undefined });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchInput('');
    setDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = Boolean(
    filters.status?.length ||
    filters.serviceType?.length ||
    filters.priority?.length ||
    filters.dateRange ||
    filters.search ||
    filters.driverId ||
    filters.riderId
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by trip ID, rider name, or address..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !dateRange.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                  </>
                ) : (
                  formatDate(dateRange.from)
                )
              ) : (
                'Pick a date range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => handleDateRangeChange(range || { from: undefined, to: undefined })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Tags */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Status
          </label>
          <div className="flex flex-wrap gap-1">
            {Object.values(TripStatus).map((status) => {
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
                  {status.replace(/_/g, ' ').toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Service Type Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Service Type
          </label>
          <div className="flex flex-wrap gap-1">
            {Object.values(ServiceType).map((type) => {
              const isSelected = filters.serviceType?.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => handleServiceTypeToggle(type)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-colors',
                    isSelected
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {type.replace(/_/g, ' ').toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Priority
          </label>
          <div className="flex flex-wrap gap-1">
            {Object.values(TripPriority).map((priority) => {
              const isSelected = filters.priority?.includes(priority);
              return (
                <button
                  key={priority}
                  onClick={() => handlePriorityToggle(priority)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-md border transition-colors',
                    isSelected
                      ? 'bg-orange-100 border-orange-300 text-orange-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {priority.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>

          {filters.status?.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => handleStatusToggle(status)}
            >
              {status.replace(/_/g, ' ').toLowerCase()}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}

          {filters.serviceType?.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => handleServiceTypeToggle(type)}
            >
              {type.replace(/_/g, ' ').toLowerCase()}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}

          {filters.priority?.map((priority) => (
            <Badge
              key={priority}
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => handlePriorityToggle(priority)}
            >
              {priority.toLowerCase()}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}

          {filters.dateRange && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => handleDateRangeChange({ from: undefined, to: undefined })}
            >
              {formatDate(filters.dateRange.start)} - {formatDate(filters.dateRange.end)}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}

          {filters.search && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-red-100 hover:text-red-800"
              onClick={() => handleSearchChange('')}
            >
              "{filters.search}"
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default TripFilters;