'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signIn, signOut, fetchAuthSession } from '@aws-amplify/auth';
import { User, UserRole, Permission, Tenant } from '@/types';

// Amplify configuration - these should come from environment variables
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: false
      }
    }
  }
};

// Only configure if we have the required values
if (amplifyConfig.Auth.Cognito.userPoolId && amplifyConfig.Auth.Cognito.userPoolClientId) {
  Amplify.configure(amplifyConfig);
}

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
          const tenants = await fetchUserTenants(accessToken);

          const user: User = {
            id: currentUser.userId,
            email: userInfo.email,
            firstName: userInfo.given_name || '',
            lastName: userInfo.family_name || '',
            role: userInfo['custom:role'] as UserRole || UserRole.DISPATCHER,
            tenantId: userInfo['custom:tenant_id'] || '',
            permissions: parsePermissions(userInfo['custom:permissions'] || ''),
            isActive: true,
            avatar: userInfo.picture
          };

          // Find current tenant or use first available
          const currentTenant = tenants.find(t => t.id === user.tenantId) || tenants[0] || null;

          setAuthState({
            user,
            currentTenant,
            availableTenants: tenants,
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

      // Update user's current tenant in the backend
      if (authState.accessToken) {
        await updateUserTenant(authState.accessToken, tenantId);
      }

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

async function fetchUserTenants(accessToken: string): Promise<Tenant[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/user/tenants`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user tenants');
    }

    const data = await response.json();
    return data.tenants || [];
  } catch (error) {
    console.error('Failed to fetch user tenants:', error);
    return [];
  }
}

async function updateUserTenant(accessToken: string, tenantId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/user/tenant`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tenantId })
    });

    if (!response.ok) {
      throw new Error('Failed to update user tenant');
    }
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