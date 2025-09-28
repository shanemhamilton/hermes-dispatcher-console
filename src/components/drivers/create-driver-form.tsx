'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { VehicleType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';

interface CreateDriverFormProps {
  onSuccess: (driver: any) => void;
  onCancel: () => void;
}

export function CreateDriverForm({ onSuccess, onCancel }: CreateDriverFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      vehicle: {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        licensePlate: '',
        type: VehicleType.SEDAN,
        capacity: 4
      }
    }
  });

  const { handleSubmit, register, formState: { errors } } = form;

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.drivers.createDriver({
        ...data,
        employeeId: `EMP${Date.now()}`,
        rating: 5.0,
        totalTrips: 0,
        totalEarnings: 0,
        isOnline: false,
        status: 'offline' as any,
        availability: 'offline' as any,
        documents: [],
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      });

      if (response.success && response.data) {
        onSuccess(response.data);
      } else {
        setError(response.error?.message || 'Failed to create driver');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create driver');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Add New Driver</h2>
        <p className="text-sm text-gray-600">Create a new driver profile</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  {...register('firstName', { required: 'First name is required' })}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  {...register('lastName', { required: 'Last name is required' })}
                  placeholder="Smith"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="john.smith@email.com"
                type="email"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                {...register('phone', { required: 'Phone number is required' })}
                placeholder="+1 (555) 123-4567"
                type="tel"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Driver's License Number *</label>
              <Input
                {...register('licenseNumber', { required: 'License number is required' })}
                placeholder="DL123456789"
              />
              {errors.licenseNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.licenseNumber.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Make *</label>
                <Input
                  {...register('vehicle.make', { required: 'Vehicle make is required' })}
                  placeholder="Toyota"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Model *</label>
                <Input
                  {...register('vehicle.model', { required: 'Vehicle model is required' })}
                  placeholder="Camry"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Year *</label>
                <Input
                  {...register('vehicle.year', {
                    required: 'Year is required',
                    min: { value: 2000, message: 'Year must be 2000 or later' },
                    max: { value: new Date().getFullYear() + 1, message: 'Invalid year' }
                  })}
                  placeholder="2020"
                  type="number"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color *</label>
                <Input
                  {...register('vehicle.color', { required: 'Color is required' })}
                  placeholder="Silver"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <Input
                  {...register('vehicle.capacity')}
                  placeholder="4"
                  type="number"
                  min="1"
                  max="15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">License Plate *</label>
                <Input
                  {...register('vehicle.licensePlate', { required: 'License plate is required' })}
                  placeholder="ABC123"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Vehicle Type *</label>
                <Select defaultValue={VehicleType.SEDAN}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VehicleType.SEDAN}>Sedan</SelectItem>
                    <SelectItem value={VehicleType.SUV}>SUV</SelectItem>
                    <SelectItem value={VehicleType.VAN}>Van</SelectItem>
                    <SelectItem value={VehicleType.WHEELCHAIR_VAN}>Wheelchair Van</SelectItem>
                    <SelectItem value={VehicleType.TRUCK}>Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Driver'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateDriverForm;