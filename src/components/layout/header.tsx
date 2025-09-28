'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useAlertStore } from '@/store';
import { useWebSocket } from '@/services/websocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell,
  Settings,
  LogOut,
  User,
  Building2,
  ChevronDown,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { TenantSelector } from '@/components/auth/tenant-selector';

export function Header() {
  const { user, currentTenant, availableTenants, signOut, switchTenant } = useAuth();
  const { alerts, unreadCount } = useAlertStore();
  const { isConnected } = useWebSocket();
  const [showTenantSelector, setShowTenantSelector] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const recentAlerts = alerts.slice(0, 5);

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      {/* Left side - Page title and breadcrumbs could go here */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">
          {/* This could be dynamic based on current page */}
          Dispatcher Console
        </h1>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Wifi className="h-3 w-3" />
              <span className="hidden sm:inline">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Tenant switcher, alerts, user menu */}
      <div className="flex items-center gap-4">
        {/* Tenant Switcher */}
        {availableTenants.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">{currentTenant?.name}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => switchTenant(tenant.id)}
                  className="flex items-center gap-3"
                >
                  <div
                    className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: tenant.primaryColor || '#3B82F6' }}
                  >
                    {tenant.logo ? (
                      <img
                        src={tenant.logo}
                        alt={tenant.name}
                        className="h-4 w-4 rounded object-cover"
                      />
                    ) : (
                      tenant.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tenant.subdomain}.hermes-dispatch.com
                    </p>
                  </div>
                  {tenant.id === currentTenant?.id && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Alerts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Alerts
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {recentAlerts.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {recentAlerts.map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          alert.severity === 'critical'
                            ? 'bg-red-500'
                            : alert.severity === 'high'
                            ? 'bg-orange-500'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <span className="font-medium text-sm truncate flex-1">
                        {alert.title}
                      </span>
                      {!alert.isRead && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {alert.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(alert.createdAt)}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm" className="w-full">
                    View all alerts
                  </Button>
                </DropdownMenuItem>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No alerts
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback>
                  {getInitials(user?.firstName || '', user?.lastName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;