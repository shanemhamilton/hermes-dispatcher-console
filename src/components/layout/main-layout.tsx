'use client';

import React, { useEffect, ReactNode } from 'react';
import { useAuth, withAuth } from '@/lib/auth-context';
import { useWebSocket } from '@/services/websocket';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Notifications } from './notifications';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutComponent({ children }: MainLayoutProps) {
  const { currentTenant, user, accessToken } = useAuth();
  const { connect } = useWebSocket();
  const { sidebarCollapsed } = useUIStore();

  // Initialize WebSocket connection when user and tenant are available
  useEffect(() => {
    if (user && currentTenant && accessToken) {
      connect({
        tenantId: currentTenant.id,
        userId: user.id,
        accessToken
      });
    }
  }, [user, currentTenant, accessToken, connect]);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto bg-gray-50/50',
            'transition-all duration-300'
          )}
        >
          {children}
        </main>
      </div>

      {/* Global notifications */}
      <Notifications />
    </div>
  );
}

// Apply authentication HOC
export const MainLayout = withAuth(MainLayoutComponent);

export default MainLayout;