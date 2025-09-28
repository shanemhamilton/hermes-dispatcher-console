'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import { TenantSelector } from '@/components/auth/tenant-selector';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Building2 } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, isLoading, currentTenant, availableTenants } = useAuth();
  const [step, setStep] = useState<'login' | 'tenant-selection' | 'redirecting'>('login');

  useEffect(() => {
    // Redirect if already authenticated and has selected tenant
    if (isAuthenticated && currentTenant) {
      setStep('redirecting');
      window.location.href = '/';
      return;
    }

    // Show tenant selection if authenticated but no tenant selected
    if (isAuthenticated && availableTenants.length > 0 && !currentTenant) {
      setStep('tenant-selection');
      return;
    }

    // Show login form if not authenticated
    if (!isAuthenticated && !isLoading) {
      setStep('login');
    }
  }, [isAuthenticated, currentTenant, availableTenants, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hermes Dispatch
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Operational Command Center
          </p>
        </div>

        {/* Content based on step */}
        {step === 'login' && (
          <LoginForm
            onSuccess={() => {
              // After successful login, check if tenant selection is needed
              if (availableTenants.length > 1 || !currentTenant) {
                setStep('tenant-selection');
              } else {
                setStep('redirecting');
                window.location.href = '/';
              }
            }}
          />
        )}

        {step === 'tenant-selection' && (
          <TenantSelector
            onTenantSelected={() => {
              setStep('redirecting');
              window.location.href = '/';
            }}
          />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 space-y-2">
          <p>© 2024 Hermes Technologies. All rights reserved.</p>
          <div className="flex justify-center space-x-4">
            <a href="/privacy" className="hover:text-gray-700">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-700">Terms of Service</a>
            <a href="/support" className="hover:text-gray-700">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}