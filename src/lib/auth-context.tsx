'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signIn, signOut, fetchAuthSession } from '@aws-amplify/auth';
import { User, UserRole, Permission, Tenant, ServiceType } from '@/types';

// Amplify configuration - these should come from environment variables
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || '',
      signUpVerificationMethod: 'code',
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN || '',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')],
          redirectSignOut: [process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')],
          responseType: 'code'
        },
        email: true,
        username: false
      }
    }
  }
};

Amplify.configure(amplifyConfig);

interface AuthState {
  user: User | null;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    currentTenant: null,
    availableTenants: [],
    isLoading: true,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null
  });

  // Initialize authentication state
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      if (currentUser && session.tokens) {
        const accessToken = session.tokens.accessToken?.toString();
        const idToken = session.tokens.idToken?.toString();

        if (accessToken && idToken) {
          // Decode the ID token to get user info
          const userInfo = parseJWT(idToken);
          console.log('User info from JWT:', userInfo);

          // Get user groups from Cognito
          const userGroups = userInfo['cognito:groups'] || [];
          console.log('User groups:', userGroups);
          console.log('User email:', userInfo.email);

          // Determine role based on groups - default to DISPATCHER if in Dispatchers group
          let userRole = UserRole.DISPATCHER;
          if (userGroups.includes('Admins')) {
            userRole = UserRole.ADMIN;
          } else if (userGroups.includes('Managers')) {
            userRole = UserRole.MANAGER;
          } else if (userGroups.includes('Support')) {
            userRole = UserRole.SUPPORT;
          }

          // Get basic permissions based on role
          const permissions = getPermissionsForRole(userRole);

          const user: User = {
            id: currentUser.userId,
            email: userInfo.email || '',
            firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
            lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
            role: userRole,
            tenantId: 'default-tenant', // Use default tenant for now
            permissions,
            isActive: true,
            avatar: userInfo.picture
          };

          // Create a mock tenant for now - will be replaced with real multi-tenant support later
          const mockTenant: Tenant = {
            id: 'default-tenant',
            name: 'Default Tenant',
            subdomain: 'default',
            primaryColor: '#3B82F6',
            timezone: 'America/New_York',
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'US'
            },
            settings: {
              maxDrivers: 100,
              operatingHours: {
                monday: { isActive: true, openTime: '06:00', closeTime: '22:00' },
                tuesday: { isActive: true, openTime: '06:00', closeTime: '22:00' },
                wednesday: { isActive: true, openTime: '06:00', closeTime: '22:00' },
                thursday: { isActive: true, openTime: '06:00', closeTime: '22:00' },
                friday: { isActive: true, openTime: '06:00', closeTime: '22:00' },
                saturday: { isActive: true, openTime: '08:00', closeTime: '20:00' },
                sunday: { isActive: true, openTime: '08:00', closeTime: '20:00' }
              },
              serviceTypes: [ServiceType.STANDARD, ServiceType.PREMIUM],
              autoDispatch: true,
              requireSignature: false,
              enableTips: true,
              currency: 'USD',
              distanceUnit: 'miles'
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          setAuthState({
            user,
            currentTenant: mockTenant,
            availableTenants: [mockTenant],
            isLoading: false,
            isAuthenticated: true,
            accessToken,
            refreshToken: session.tokens.refreshToken?.toString() || null
          });
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          currentTenant: null,
          availableTenants: [],
          isLoading: false,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null
        }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        currentTenant: null,
        availableTenants: [],
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null
      }));
    }
  };

  const handleSignIn = async (email: string, password?: string) => {
    try {
      if (password) {
        // Traditional email/password login
        await signIn({ username: email, password });
      } else {
        // Passwordless or OAuth login
        // This would trigger OAuth flow or send magic link
        throw new Error('Passwordless login not implemented yet');
      }

      await checkAuthState();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthState({
        user: null,
        currentTenant: null,
        availableTenants: [],
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      const tenant = authState.availableTenants.find(t => t.id === tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // For now, just update local state since multi-tenant switching isn't implemented yet
      // Update user's current tenant in the backend when API is ready
      // if (authState.accessToken) {
      //   await updateUserTenant(authState.accessToken, tenantId);
      // }

      // Update local state
      setAuthState(prev => ({
        ...prev,
        currentTenant: tenant,
        user: prev.user ? { ...prev.user, tenantId } : null
      }));

      // Refresh any tenant-specific data
      window.location.reload(); // Simple approach - could be more elegant
    } catch (error) {
      console.error('Tenant switch failed:', error);
      throw error;
    }
  };

  const refreshAuth = async () => {
    await checkAuthState();
  };

  const hasPermission = (permission: Permission): boolean => {
    return authState.user?.permissions.includes(permission) || false;
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!authState.user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(authState.user.role);
  };

  const contextValue: AuthContextType = {
    ...authState,
    signIn: handleSignIn,
    signOut: handleSignOut,
    switchTenant,
    refreshAuth,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Utility functions
function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return {};
  }
}

function parsePermissions(permissionsString: string): Permission[] {
  try {
    return permissionsString ? permissionsString.split(',') as Permission[] : [];
  } catch (error) {
    console.error('Failed to parse permissions:', error);
    return [];
  }
}

// Get default permissions based on user role
function getPermissionsForRole(role: UserRole): Permission[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        Permission.VIEW_TRIPS,
        Permission.CREATE_TRIPS,
        Permission.EDIT_TRIPS,
        Permission.CANCEL_TRIPS,
        Permission.VIEW_DRIVERS,
        Permission.MANAGE_DRIVERS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
        Permission.MANAGE_TENANTS,
        Permission.VIEW_AUDIT_LOGS
      ];
    case UserRole.MANAGER:
      return [
        Permission.VIEW_TRIPS,
        Permission.CREATE_TRIPS,
        Permission.EDIT_TRIPS,
        Permission.CANCEL_TRIPS,
        Permission.VIEW_DRIVERS,
        Permission.MANAGE_DRIVERS,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA
      ];
    case UserRole.SUPPORT:
      return [
        Permission.VIEW_TRIPS,
        Permission.EDIT_TRIPS,
        Permission.VIEW_DRIVERS,
        Permission.VIEW_ANALYTICS
      ];
    case UserRole.DISPATCHER:
    default:
      return [
        Permission.VIEW_TRIPS,
        Permission.CREATE_TRIPS,
        Permission.EDIT_TRIPS,
        Permission.CANCEL_TRIPS,
        Permission.VIEW_DRIVERS
      ];
  }
}

async function fetchUserTenants(accessToken: string): Promise<Tenant[]> {
  try {
    // For now, return empty array since multi-tenant API isn't implemented yet
    // This will be replaced with actual API call once backend is ready
    console.log('fetchUserTenants called with token:', accessToken ? 'present' : 'missing');
    return [];
  } catch (error) {
    console.error('Failed to fetch user tenants:', error);
    return [];
  }
}

async function updateUserTenant(accessToken: string, tenantId: string): Promise<void> {
  try {
    // For now, this is a no-op since multi-tenant API isn't implemented yet
    // This will be replaced with actual API call once backend is ready
    console.log('updateUserTenant called with:', { tenantId, hasToken: !!accessToken });

    // Simulate success for now
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to update user tenant:', error);
    throw error;
  }
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please sign in to continue.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for role-based access control
export function useRoleAccess(allowedRoles: UserRole[]) {
  const { user, hasRole } = useAuth();

  return {
    hasAccess: hasRole(allowedRoles),
    userRole: user?.role,
    isManager: hasRole([UserRole.MANAGER, UserRole.ADMIN]),
    isAdmin: hasRole(UserRole.ADMIN)
  };
}

// Hook for permission-based access control
export function usePermissionAccess(requiredPermissions: Permission[]) {
  const { hasPermission } = useAuth();

  return {
    hasAccess: requiredPermissions.every(permission => hasPermission(permission)),
    checkPermission: hasPermission
  };
}