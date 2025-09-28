'use client';

import React from 'react';
import { useUIStore } from '@/store';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Notifications() {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string) => {
    return type === 'error' ? 'destructive' : 'default';
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-600';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 [&>svg]:text-red-600';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          variant={getVariant(notification.type)}
          className={cn(
            'relative pr-8 shadow-lg border',
            getColorClasses(notification.type)
          )}
        >
          {getIcon(notification.type)}

          <div className="flex-1">
            <AlertTitle className="font-medium">
              {notification.title}
            </AlertTitle>
            <AlertDescription className="mt-1">
              {notification.message}
            </AlertDescription>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-70 hover:opacity-100"
            onClick={() => removeNotification(notification.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}

export default Notifications;