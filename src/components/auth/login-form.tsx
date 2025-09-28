'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);

      if (onSuccess) {
        onSuccess();
      } else if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handlePasswordlessLogin = async () => {
    if (!formData.email) {
      setError('Please enter your email address first.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // This would trigger a passwordless flow (magic link or code)
      await signIn(formData.email);
      setError('A sign-in link has been sent to your email address.');
    } catch (err: any) {
      console.error('Passwordless login failed:', err);
      setError(err.message || 'Failed to send sign-in link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sign in to Hermes Dispatch
        </CardTitle>
        <p className="text-sm text-gray-600 text-center">
          Enter your credentials to access the dispatcher console
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant={error.includes('sent to your email') ? 'default' : 'destructive'}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="dispatcher@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                required
                className="pl-10"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                required
                className="pl-10 pr-10"
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handlePasswordlessLogin}
              disabled={!formData.email || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                'Send Magic Link'
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <a
              href="/auth/reset-password"
              className="text-blue-600 hover:text-blue-500 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
        </form>

        <div className="mt-6 border-t pt-6">
          <div className="text-center text-sm text-gray-600">
            Need help signing in?{' '}
            <a
              href="mailto:support@hermes-dispatch.com"
              className="text-blue-600 hover:text-blue-500 hover:underline"
            >
              Contact Support
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LoginForm;