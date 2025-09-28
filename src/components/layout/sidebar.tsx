'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  Building2,
  LayoutDashboard,
  Car,
  Users,
  Route,
  BarChart3,
  AlertTriangle,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  permissions?: string[];
  description?: string;
}

const navigationItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and key metrics'
  },
  {
    id: 'trips',
    label: 'Trips',
    href: '/trips',
    icon: Route,
    description: 'Manage active and past trips'
  },
  {
    id: 'drivers',
    label: 'Drivers',
    href: '/drivers',
    icon: Car,
    description: 'Driver roster and availability'
  },
  {
    id: 'riders',
    label: 'Riders',
    href: '/riders',
    icon: Users,
    description: 'Customer management'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Performance insights and reports'
  },
  {
    id: 'alerts',
    label: 'Alerts',
    href: '/alerts',
    icon: AlertTriangle,
    description: 'System alerts and notifications'
  }
];

const bottomItems: SidebarItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'System configuration'
  },
  {
    id: 'help',
    label: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
    description: 'Documentation and support'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentTenant, hasPermission } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const renderNavItem = (item: SidebarItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const showBadge = item.badge && item.badge > 0;

    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          isActive && 'bg-accent text-accent-foreground',
          sidebarCollapsed && 'justify-center px-2'
        )}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <item.icon className={cn('h-4 w-4 shrink-0')} />

        {!sidebarCollapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {showBadge && (
              <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-medium shrink-0"
              style={{ backgroundColor: currentTenant?.primaryColor || '#3B82F6' }}
            >
              {currentTenant?.logo ? (
                <img
                  src={currentTenant.logo}
                  alt={currentTenant.name}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                currentTenant?.name?.charAt(0).toUpperCase() || 'H'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {currentTenant?.name || 'Hermes Dispatch'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Dispatcher Console
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 shrink-0"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigationItems.map(renderNavItem)}
        </nav>
      </div>

      {/* Bottom Items */}
      <div className="border-t p-2">
        <nav className="space-y-1">
          {bottomItems.map(renderNavItem)}
        </nav>
      </div>

      {/* Tenant Info (when collapsed) */}
      {sidebarCollapsed && currentTenant && (
        <div className="border-t p-2">
          <div className="flex justify-center">
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: currentTenant.primaryColor || '#3B82F6' }}
              title={currentTenant.name}
            >
              {currentTenant.logo ? (
                <img
                  src={currentTenant.logo}
                  alt={currentTenant.name}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                currentTenant.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;