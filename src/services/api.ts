/**
 * API service layer for the Hermes Dispatcher Console
 * Handles all backend communication with proper error handling and type safety
 */

import {
  Trip,
  Driver,
  Rider,
  Alert,
  DashboardMetrics,
  TripCreateRequest,
  DriverAssignmentRequest,
  TripFilters,
  DriverFilters,
  ApiResponse,
  PaginationInfo,
  TimeRange,
  PerformanceMetrics,
  AuditLog,
  Tenant,
  TripStatus
} from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.hermes-dispatch.com';
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'https://api.hermes-dispatch.com/graphql';

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client with authentication and error handling
class HttpClient {
  private getAuthHeaders(): HeadersInit {
    const token = this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Tenant-ID': this.getCurrentTenantId()
    };
  }

  private getAccessToken(): string | null {
    // This would typically come from your auth context/store
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private getCurrentTenantId(): string {
    // This would typically come from your auth context/store
    if (typeof window !== 'undefined') {
      return localStorage.getItem('currentTenantId') || '';
    }
    return '';
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'Request failed',
          response.status,
          data.code || 'UNKNOWN_ERROR',
          data.details
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        'Network error occurred',
        0,
        'NETWORK_ERROR',
        error
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  }
}

const httpClient = new HttpClient();

// Trip API Service
export const tripService = {
  async getTrips(filters?: TripFilters, pagination?: { page: number; limit: number }) {
    const params = {
      ...filters,
      ...pagination,
      // Convert date ranges to ISO strings
      dateRangeStart: filters?.dateRange?.start?.toISOString(),
      dateRangeEnd: filters?.dateRange?.end?.toISOString()
    };

    return httpClient.get<{
      trips: Trip[];
      pagination: PaginationInfo;
    }>('/trips', params);
  },

  async getTripById(tripId: string) {
    return httpClient.get<Trip>(`/trips/${tripId}`);
  },

  async createTrip(tripData: TripCreateRequest) {
    return httpClient.post<Trip>('/trips', tripData);
  },

  async updateTrip(tripId: string, updates: Partial<Trip>) {
    return httpClient.patch<Trip>(`/trips/${tripId}`, updates);
  },

  async cancelTrip(tripId: string, reason: string) {
    return httpClient.patch<Trip>(`/trips/${tripId}/cancel`, { reason });
  },

  async assignDriver(tripId: string, assignmentData: DriverAssignmentRequest) {
    return httpClient.post<Trip>(`/trips/${tripId}/assign`, assignmentData);
  },

  async unassignDriver(tripId: string) {
    return httpClient.delete<Trip>(`/trips/${tripId}/assign`);
  },

  async updateTripStatus(tripId: string, status: TripStatus, metadata?: Record<string, any>) {
    return httpClient.patch<Trip>(`/trips/${tripId}/status`, { status, metadata });
  },

  async getTripRoute(tripId: string) {
    return httpClient.get<{ route: any; estimatedTime: number }>(`/trips/${tripId}/route`);
  },

  async exportTrips(filters?: TripFilters, format: 'csv' | 'xlsx' = 'csv') {
    const params = { ...filters, format };
    const response = await httpClient.get<Blob>('/trips/export', params);
    return response.data;
  }
};

// Driver API Service
export const driverService = {
  async getDrivers(filters?: DriverFilters, pagination?: { page: number; limit: number }) {
    return httpClient.get<{
      drivers: Driver[];
      pagination: PaginationInfo;
    }>('/drivers', { ...filters, ...pagination });
  },

  async getDriverById(driverId: string) {
    return httpClient.get<Driver>(`/drivers/${driverId}`);
  },

  async createDriver(driverData: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) {
    return httpClient.post<Driver>('/drivers', driverData);
  },

  async updateDriver(driverId: string, updates: Partial<Driver>) {
    return httpClient.patch<Driver>(`/drivers/${driverId}`, updates);
  },

  async deleteDriver(driverId: string) {
    return httpClient.delete<void>(`/drivers/${driverId}`);
  },

  async updateDriverStatus(driverId: string, status: string, availability?: string) {
    return httpClient.patch<Driver>(`/drivers/${driverId}/status`, { status, availability });
  },

  async getDriverLocation(driverId: string) {
    return httpClient.get<{ location: { latitude: number; longitude: number }; timestamp: string }>(`/drivers/${driverId}/location`);
  },

  async getDriverTrips(driverId: string, timeRange?: TimeRange) {
    const params = timeRange ? {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    } : {};
    return httpClient.get<Trip[]>(`/drivers/${driverId}/trips`, params);
  },

  async getDriverPerformance(driverId: string, timeRange: TimeRange) {
    return httpClient.get<PerformanceMetrics>(`/drivers/${driverId}/performance`, {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    });
  },

  async getAvailableDrivers(pickup: { latitude: number; longitude: number }, serviceType?: string) {
    return httpClient.get<Driver[]>('/drivers/available', {
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      serviceType
    });
  }
};

// Rider API Service
export const riderService = {
  async searchRiders(query: string) {
    return httpClient.get<Rider[]>('/riders/search', { q: query });
  },

  async getRiderById(riderId: string) {
    return httpClient.get<Rider>(`/riders/${riderId}`);
  },

  async createRider(riderData: Omit<Rider, 'id' | 'createdAt'>) {
    return httpClient.post<Rider>('/riders', riderData);
  },

  async updateRider(riderId: string, updates: Partial<Rider>) {
    return httpClient.patch<Rider>(`/riders/${riderId}`, updates);
  },

  async getRiderTrips(riderId: string, timeRange?: TimeRange) {
    const params = timeRange ? {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    } : {};
    return httpClient.get<Trip[]>(`/riders/${riderId}/trips`, params);
  }
};

// Alert API Service
export const alertService = {
  async getAlerts(pagination?: { page: number; limit: number }) {
    return httpClient.get<{
      alerts: Alert[];
      pagination: PaginationInfo;
    }>('/alerts', pagination);
  },

  async getAlertById(alertId: string) {
    return httpClient.get<Alert>(`/alerts/${alertId}`);
  },

  async markAlertAsRead(alertId: string) {
    return httpClient.patch<Alert>(`/alerts/${alertId}`, { isRead: true });
  },

  async markAllAlertsAsRead() {
    return httpClient.patch<void>('/alerts/mark-all-read');
  },

  async resolveAlert(alertId: string, resolution?: string) {
    return httpClient.patch<Alert>(`/alerts/${alertId}/resolve`, { resolution });
  },

  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt'>) {
    return httpClient.post<Alert>('/alerts', alertData);
  }
};

// Analytics API Service
export const analyticsService = {
  async getDashboardMetrics(timeRange: TimeRange) {
    return httpClient.get<DashboardMetrics>('/analytics/dashboard', {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString(),
      period: timeRange.period
    });
  },

  async getTripAnalytics(timeRange: TimeRange) {
    return httpClient.get<{
      completionRate: number;
      cancellationRate: number;
      averageWaitTime: number;
      averageRating: number;
      tripsByStatus: Array<{ status: string; count: number }>;
      tripsByHour: Array<{ hour: number; count: number }>;
    }>('/analytics/trips', {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    });
  },

  async getDriverAnalytics(timeRange: TimeRange) {
    return httpClient.get<{
      totalDrivers: number;
      activeDrivers: number;
      averageUtilization: number;
      topPerformers: Array<{ driverId: string; name: string; rating: number; trips: number }>;
    }>('/analytics/drivers', {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    });
  },

  async getRevenueAnalytics(timeRange: TimeRange) {
    return httpClient.get<{
      totalRevenue: number;
      averageFare: number;
      revenueByDay: Array<{ date: string; revenue: number }>;
      revenueByServiceType: Array<{ serviceType: string; revenue: number }>;
    }>('/analytics/revenue', {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    });
  }
};

// Tenant API Service
export const tenantService = {
  async getTenants() {
    return httpClient.get<Tenant[]>('/tenants');
  },

  async getTenantById(tenantId: string) {
    return httpClient.get<Tenant>(`/tenants/${tenantId}`);
  },

  async updateTenant(tenantId: string, updates: Partial<Tenant>) {
    return httpClient.patch<Tenant>(`/tenants/${tenantId}`, updates);
  },

  async getTenantSettings(tenantId: string) {
    return httpClient.get<Tenant['settings']>(`/tenants/${tenantId}/settings`);
  },

  async updateTenantSettings(tenantId: string, settings: Partial<Tenant['settings']>) {
    return httpClient.patch<Tenant['settings']>(`/tenants/${tenantId}/settings`, settings);
  }
};

// Audit API Service
export const auditService = {
  async getAuditLogs(pagination?: { page: number; limit: number }, filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const params = {
      ...pagination,
      ...filters,
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString()
    };

    return httpClient.get<{
      logs: AuditLog[];
      pagination: PaginationInfo;
    }>('/audit', params);
  },

  async createAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>) {
    return httpClient.post<AuditLog>('/audit', logData);
  }
};

// Geocoding and Mapping Service
export const geoService = {
  async geocodeAddress(address: string) {
    return httpClient.get<{
      address: string;
      coordinates: { latitude: number; longitude: number };
      placeId: string;
    }>('/geo/geocode', { address });
  },

  async reverseGeocode(latitude: number, longitude: number) {
    return httpClient.get<{
      address: string;
      components: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
    }>('/geo/reverse', { latitude, longitude });
  },

  async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    waypoints?: Array<{ latitude: number; longitude: number }>
  ) {
    return httpClient.post<{
      route: Array<{ latitude: number; longitude: number }>;
      distance: number;
      duration: number;
      estimatedFare: number;
    }>('/geo/route', { origin, destination, waypoints });
  },

  async searchPlaces(query: string, location?: { latitude: number; longitude: number }) {
    return httpClient.get<Array<{
      placeId: string;
      name: string;
      address: string;
      coordinates: { latitude: number; longitude: number };
      type: string;
    }>>('/geo/places', { query, ...location });
  }
};

// Real-time tracking service
export const trackingService = {
  async startTripTracking(tripId: string) {
    return httpClient.post<void>(`/tracking/trips/${tripId}/start`);
  },

  async stopTripTracking(tripId: string) {
    return httpClient.post<void>(`/tracking/trips/${tripId}/stop`);
  },

  async updateDriverLocation(driverId: string, location: { latitude: number; longitude: number }) {
    return httpClient.post<void>(`/tracking/drivers/${driverId}/location`, location);
  },

  async getTripTracking(tripId: string) {
    return httpClient.get<{
      trip: Trip;
      driverLocation?: { latitude: number; longitude: number };
      route: Array<{ latitude: number; longitude: number; timestamp: string }>;
    }>(`/tracking/trips/${tripId}`);
  }
};

// File upload service
export const uploadService = {
  async uploadFile(file: File, type: 'document' | 'image' | 'avatar') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return httpClient.request<{
      url: string;
      filename: string;
      size: number;
      type: string;
    }>('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header for FormData
        'Authorization': `Bearer ${httpClient['getAccessToken']()}`,
        'X-Tenant-ID': httpClient['getCurrentTenantId']()
      }
    });
  }
};

// Export all services
export const api = {
  trips: tripService,
  drivers: driverService,
  riders: riderService,
  alerts: alertService,
  analytics: analyticsService,
  tenants: tenantService,
  audit: auditService,
  geo: geoService,
  tracking: trackingService,
  upload: uploadService
};

export default api;