'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Tenant } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight, Loader2, MapPin } from 'lucide-react';

interface TenantSelectorProps {
  onTenantSelected?: (tenant: Tenant) => void;
}

export function TenantSelector({ onTenantSelected }: TenantSelectorProps) {
  const { availableTenants, currentTenant, switchTenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const handleTenantSelect = async (tenant: Tenant) => {
    if (tenant.id === currentTenant?.id) {
      // Already selected
      if (onTenantSelected) {
        onTenantSelected(tenant);
      }
      return;
    }

    setIsLoading(true);
    setSelectedTenantId(tenant.id);

    try {
      await switchTenant(tenant.id);
      if (onTenantSelected) {
        onTenantSelected(tenant);
      }
    } catch (error) {
      console.error('Failed to switch tenant:', error);
      // Could show error notification here
    } finally {
      setIsLoading(false);
      setSelectedTenantId(null);
    }
  };

  if (!availableTenants.length) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tenants Available</h3>
          <p className="text-gray-600 text-center">
            You don't have access to any tenants. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Select Organization
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose the organization you want to access. You can switch between organizations anytime.
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {availableTenants.map((tenant) => {
            const isSelected = tenant.id === currentTenant?.id;
            const isProcessing = isLoading && selectedTenantId === tenant.id;

            return (
              <button
                key={tenant.id}
                onClick={() => handleTenantSelect(tenant)}
                disabled={isLoading}
                className={`
                  w-full p-4 border rounded-lg text-left transition-all duration-200
                  hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {tenant.logo ? (
                        <img
                          src={tenant.logo}
                          alt={`${tenant.name} logo`}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: tenant.primaryColor || '#3B82F6' }}
                        >
                          {tenant.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {tenant.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {tenant.subdomain}.hermes-dispatch.com
                        </p>
                      </div>

                      {isSelected && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Current
                        </Badge>
                      )}

                      {!isSelected && !tenant.isActive && (
                        <Badge variant="destructive">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center text-xs text-gray-500 gap-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{tenant.address.city}, {tenant.address.state}</span>
                      </div>
                      <div>
                        Timezone: {tenant.timezone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3">
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {currentTenant && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Currently accessing: {currentTenant.name}
                </p>
                <p className="text-xs text-gray-500">
                  All operations will be performed under this organization
                </p>
              </div>

              <Button
                onClick={() => onTenantSelected?.(currentTenant)}
                disabled={isLoading}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TenantSelector;