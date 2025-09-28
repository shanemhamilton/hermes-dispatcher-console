'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  MapPin,
  User,
  Car,
  Clock,
  DollarSign,
  Search,
  Plus,
  Navigation,
  AlertCircle,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import {
  TripCreateRequest,
  ServiceType,
  TripPriority,
  PaymentType,
  Rider,
  Location,
  Driver
} from '@/types';
import { api } from '@/services/api';
import { useTripStore } from '@/store';
import { formatCurrency, formatDuration } from '@/lib/utils';

// Form validation schema
const tripSchema = z.object({
  riderId: z.string().optional(),
  riderInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email().optional().or(z.literal(''))
  }).optional(),
  pickup: z.object({
    address: z.string().min(1, 'Pickup address is required'),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number()
    }),
    instructions: z.string().optional()
  }),
  destination: z.object({
    address: z.string().min(1, 'Destination address is required'),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number()
    }),
    instructions: z.string().optional()
  }),
  serviceType: z.nativeEnum(ServiceType),
  scheduledAt: z.date().optional(),
  specialInstructions: z.string().optional(),
  paymentMethod: z.object({
    type: z.nativeEnum(PaymentType),
    id: z.string()
  }),
  priority: z.nativeEnum(TripPriority)
});

type TripFormData = z.infer<typeof tripSchema>;

interface TripCreationWizardProps {
  onSuccess?: (trip: any) => void;
  onCancel?: () => void;
  defaultValues?: Partial<TripFormData>;
}

export function TripCreationWizard({
  onSuccess,
  onCancel,
  defaultValues
}: TripCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [riderSearchQuery, setRiderSearchQuery] = useState('');
  const [riderSearchResults, setRiderSearchResults] = useState<Rider[]>([]);
  const [routeEstimate, setRouteEstimate] = useState<any>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);

  const { addTrip } = useTripStore();

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      serviceType: ServiceType.STANDARD,
      priority: TripPriority.NORMAL,
      paymentMethod: {
        type: PaymentType.CREDIT_CARD,
        id: 'default'
      },
      ...defaultValues
    }
  });

  const { handleSubmit, watch, setValue, formState: { errors } } = form;

  const watchedValues = watch();

  // Search for riders
  const handleRiderSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setRiderSearchResults([]);
      return;
    }

    try {
      const response = await api.riders.searchRiders(query);
      if (response.success) {
        setRiderSearchResults(response.data || []);
      }
    } catch (error) {
      console.error('Failed to search riders:', error);
    }
  }, []);

  // Select a rider
  const handleRiderSelect = (rider: Rider) => {
    setSelectedRider(rider);
    setValue('riderId', rider.id);
    setValue('riderInfo', undefined);
    setRiderSearchQuery(`${rider.firstName} ${rider.lastName}`);
    setRiderSearchResults([]);
  };

  // Create new rider
  const handleCreateNewRider = () => {
    setSelectedRider(null);
    setValue('riderId', undefined);
    setRiderSearchQuery('');
    setRiderSearchResults([]);
  };

  // Geocode address
  const handleAddressLookup = async (address: string, type: 'pickup' | 'destination') => {
    if (!address.trim()) return;

    try {
      const response = await api.geo.geocodeAddress(address);
      if (response.success && response.data) {
        setValue(`${type}.coordinates`, response.data.coordinates);

        // If both addresses are set, calculate route
        if (watchedValues.pickup?.coordinates && watchedValues.destination?.coordinates) {
          calculateRoute();
        }
      }
    } catch (error) {
      console.error('Failed to geocode address:', error);
    }
  };

  // Calculate route and estimate
  const calculateRoute = async () => {
    const pickup = watchedValues.pickup;
    const destination = watchedValues.destination;

    if (!pickup?.coordinates || !destination?.coordinates) return;

    try {
      const response = await api.geo.calculateRoute(
        pickup.coordinates,
        destination.coordinates
      );

      if (response.success && response.data) {
        setRouteEstimate(response.data);
      }
    } catch (error) {
      console.error('Failed to calculate route:', error);
    }
  };

  // Get available drivers
  const getAvailableDrivers = async () => {
    const pickup = watchedValues.pickup;
    const serviceType = watchedValues.serviceType;

    if (!pickup?.coordinates) return;

    try {
      const response = await api.drivers.getAvailableDrivers(
        pickup.coordinates,
        serviceType
      );

      if (response.success && response.data) {
        setAvailableDrivers(response.data);
      }
    } catch (error) {
      console.error('Failed to get available drivers:', error);
    }
  };

  // Submit the form
  const onSubmit = async (data: TripFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.trips.createTrip(data as TripCreateRequest);

      if (response.success && response.data) {
        addTrip(response.data);
        onSuccess?.(response.data);
      } else {
        setError(response.error?.message || 'Failed to create trip');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderRiderSelection();
      case 2:
        return renderLocationSelection();
      case 3:
        return renderTripDetails();
      case 4:
        return renderReviewAndConfirm();
      default:
        return null;
    }
  };

  const renderRiderSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select or Create Rider</h3>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search existing riders by name, phone, or email"
              value={riderSearchQuery}
              onChange={(e) => {
                setRiderSearchQuery(e.target.value);
                handleRiderSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          {riderSearchResults.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-48 overflow-y-auto">
                  {riderSearchResults.map((rider) => (
                    <button
                      key={rider.id}
                      onClick={() => handleRiderSelect(rider)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                    >
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{rider.firstName} {rider.lastName}</p>
                        <p className="text-sm text-gray-500">{rider.phone}</p>
                        {rider.email && (
                          <p className="text-sm text-gray-500">{rider.email}</p>
                        )}
                      </div>
                      {rider.isVip && (
                        <Badge variant="secondary">VIP</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedRider ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedRider.firstName} {selectedRider.lastName}</p>
                      <p className="text-sm text-gray-600">{selectedRider.phone}</p>
                      {selectedRider.email && (
                        <p className="text-sm text-gray-600">{selectedRider.email}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateNewRider}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New Rider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name *</label>
                    <Input
                      {...form.register('riderInfo.firstName')}
                      placeholder="John"
                    />
                    {errors.riderInfo?.firstName && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.riderInfo.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input
                      {...form.register('riderInfo.lastName')}
                      placeholder="Smith"
                    />
                    {errors.riderInfo?.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.riderInfo.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number *</label>
                  <Input
                    {...form.register('riderInfo.phone')}
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                  />
                  {errors.riderInfo?.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.riderInfo.phone.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Email (Optional)</label>
                  <Input
                    {...form.register('riderInfo.email')}
                    placeholder="john.smith@email.com"
                    type="email"
                  />
                  {errors.riderInfo?.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.riderInfo.email.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const renderLocationSelection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Trip Locations</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Address *</label>
              <Input
                {...form.register('pickup.address')}
                placeholder="123 Main St, City, State"
                onBlur={(e) => handleAddressLookup(e.target.value, 'pickup')}
              />
              {errors.pickup?.address && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.pickup.address.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Special Instructions</label>
              <Textarea
                {...form.register('pickup.instructions')}
                placeholder="Building entrance, suite number, etc."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Destination Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Address *</label>
              <Input
                {...form.register('destination.address')}
                placeholder="456 Oak Ave, City, State"
                onBlur={(e) => handleAddressLookup(e.target.value, 'destination')}
              />
              {errors.destination?.address && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.destination.address.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Special Instructions</label>
              <Textarea
                {...form.register('destination.instructions')}
                placeholder="Drop-off location details"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Estimate */}
      {routeEstimate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {formatDuration(routeEstimate.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {routeEstimate.distance} miles
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  Est. {formatCurrency(routeEstimate.estimatedFare)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderTripDetails = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Trip Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Service Type</label>
            <Select
              value={watchedValues.serviceType}
              onValueChange={(value) => setValue('serviceType', value as ServiceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ServiceType.STANDARD}>Standard</SelectItem>
                <SelectItem value={ServiceType.PREMIUM}>Premium</SelectItem>
                <SelectItem value={ServiceType.WHEELCHAIR}>Wheelchair Accessible</SelectItem>
                <SelectItem value={ServiceType.GROUP}>Group (6+ passengers)</SelectItem>
                <SelectItem value={ServiceType.DELIVERY}>Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={watchedValues.priority}
              onValueChange={(value) => setValue('priority', value as TripPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TripPriority.LOW}>Low</SelectItem>
                <SelectItem value={TripPriority.NORMAL}>Normal</SelectItem>
                <SelectItem value={TripPriority.HIGH}>High</SelectItem>
                <SelectItem value={TripPriority.URGENT}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Schedule (Optional)</label>
            <Calendar
              mode="single"
              selected={watchedValues.scheduledAt}
              onSelect={(date) => setValue('scheduledAt', date)}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Special Instructions</label>
        <Textarea
          {...form.register('specialInstructions')}
          placeholder="Any special requirements or notes for this trip"
          rows={3}
        />
      </div>
    </div>
  );

  const renderReviewAndConfirm = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Review & Confirm</h3>

      {/* Trip Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trip Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rider Info */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Rider:</span>
            <span className="text-sm">
              {selectedRider
                ? `${selectedRider.firstName} ${selectedRider.lastName}`
                : `${watchedValues.riderInfo?.firstName} ${watchedValues.riderInfo?.lastName}`}
            </span>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Pickup</p>
                <p className="text-sm text-gray-600">{watchedValues.pickup?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Destination</p>
                <p className="text-sm text-gray-600">{watchedValues.destination?.address}</p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-sm font-medium">Service Type</p>
              <p className="text-sm text-gray-600 capitalize">
                {watchedValues.serviceType?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Priority</p>
              <p className="text-sm text-gray-600 capitalize">
                {watchedValues.priority?.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Route Estimate */}
          {routeEstimate && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    {formatDuration(routeEstimate.duration)}
                  </span>
                  <span className="text-sm">
                    {routeEstimate.distance} miles
                  </span>
                </div>
                <span className="text-sm font-medium">
                  Est. {formatCurrency(routeEstimate.estimatedFare)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Drivers */}
      {availableDrivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Drivers ({availableDrivers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableDrivers.slice(0, 3).map((driver) => (
                <div key={driver.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Car className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {driver.firstName} {driver.lastName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {driver.vehicle.make} {driver.vehicle.model} • Rating: {driver.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
              {availableDrivers.length > 3 && (
                <p className="text-xs text-gray-600 text-center">
                  +{availableDrivers.length - 3} more drivers available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`flex items-center ${stepNumber < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Rider</span>
          <span>Locations</span>
          <span>Details</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 2) {
                    calculateRoute();
                  } else if (step === 3) {
                    getAvailableDrivers();
                  }
                  setStep(step + 1);
                }}
                disabled={isLoading}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Trip...' : 'Create Trip'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default TripCreationWizard;