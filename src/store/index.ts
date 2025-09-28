/**
 * Zustand store for global state management in the Hermes Dispatcher Console
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Trip,
  Driver,
  Alert,
  DashboardMetrics,
  UIState,
  Notification,
  TripFilters,
  DriverFilters,
  SortOptions,
  Coordinates,
  WebSocketMessage,
  AuditLog
} from '@/types';

// Trip Store
interface TripState {
  trips: Trip[];
  selectedTrip: Trip | null;
  filters: TripFilters;
  sortOptions: SortOptions;
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface TripActions {
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  removeTrip: (tripId: string) => void;
  selectTrip: (trip: Trip | null) => void;
  setFilters: (filters: Partial<TripFilters>) => void;
  setSortOptions: (sortOptions: SortOptions) => void;
  setLoading: (isLoading: boolean) => void;
  refreshTrips: () => Promise<void>;
  clearTrips: () => void;
}

export const useTripStore = create<TripState & TripActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        trips: [],
        selectedTrip: null,
        filters: {},
        sortOptions: { field: 'requestedAt', direction: 'desc' },
        isLoading: false,
        lastUpdated: null,

        // Actions
        setTrips: (trips) => {
          set((state) => {
            state.trips = trips;
            state.lastUpdated = new Date();
          });
        },

        addTrip: (trip) => {
          set((state) => {
            state.trips.unshift(trip);
            state.lastUpdated = new Date();
          });
        },

        updateTrip: (tripId, updates) => {
          set((state) => {
            const index = state.trips.findIndex(t => t.id === tripId);
            if (index !== -1) {
              state.trips[index] = { ...state.trips[index], ...updates };
              state.lastUpdated = new Date();

              // Update selected trip if it's the one being updated
              if (state.selectedTrip?.id === tripId) {
                state.selectedTrip = { ...state.selectedTrip, ...updates };
              }
            }
          });
        },

        removeTrip: (tripId) => {
          set((state) => {
            state.trips = state.trips.filter(t => t.id !== tripId);
            if (state.selectedTrip?.id === tripId) {
              state.selectedTrip = null;
            }
            state.lastUpdated = new Date();
          });
        },

        selectTrip: (trip) => {
          set((state) => {
            state.selectedTrip = trip;
          });
        },

        setFilters: (filters) => {
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          });
        },

        setSortOptions: (sortOptions) => {
          set((state) => {
            state.sortOptions = sortOptions;
          });
        },

        setLoading: (isLoading) => {
          set((state) => {
            state.isLoading = isLoading;
          });
        },

        refreshTrips: async () => {
          // This would typically call an API service
          set((state) => {
            state.isLoading = true;
          });
          // API call would go here
          set((state) => {
            state.isLoading = false;
          });
        },

        clearTrips: () => {
          set((state) => {
            state.trips = [];
            state.selectedTrip = null;
            state.lastUpdated = null;
          });
        }
      }))
    ),
    { name: 'trip-store' }
  )
);

// Driver Store
interface DriverState {
  drivers: Driver[];
  selectedDriver: Driver | null;
  filters: DriverFilters;
  sortOptions: SortOptions;
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface DriverActions {
  setDrivers: (drivers: Driver[]) => void;
  addDriver: (driver: Driver) => void;
  updateDriver: (driverId: string, updates: Partial<Driver>) => void;
  removeDriver: (driverId: string) => void;
  selectDriver: (driver: Driver | null) => void;
  setFilters: (filters: Partial<DriverFilters>) => void;
  setSortOptions: (sortOptions: SortOptions) => void;
  setLoading: (isLoading: boolean) => void;
  refreshDrivers: () => Promise<void>;
  clearDrivers: () => void;
}

export const useDriverStore = create<DriverState & DriverActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        drivers: [],
        selectedDriver: null,
        filters: {},
        sortOptions: { field: 'firstName', direction: 'asc' },
        isLoading: false,
        lastUpdated: null,

        // Actions
        setDrivers: (drivers) => {
          set((state) => {
            state.drivers = drivers;
            state.lastUpdated = new Date();
          });
        },

        addDriver: (driver) => {
          set((state) => {
            state.drivers.push(driver);
            state.lastUpdated = new Date();
          });
        },

        updateDriver: (driverId, updates) => {
          set((state) => {
            const index = state.drivers.findIndex(d => d.id === driverId);
            if (index !== -1) {
              state.drivers[index] = { ...state.drivers[index], ...updates };
              state.lastUpdated = new Date();

              // Update selected driver if it's the one being updated
              if (state.selectedDriver?.id === driverId) {
                state.selectedDriver = { ...state.selectedDriver, ...updates };
              }
            }
          });
        },

        removeDriver: (driverId) => {
          set((state) => {
            state.drivers = state.drivers.filter(d => d.id !== driverId);
            if (state.selectedDriver?.id === driverId) {
              state.selectedDriver = null;
            }
            state.lastUpdated = new Date();
          });
        },

        selectDriver: (driver) => {
          set((state) => {
            state.selectedDriver = driver;
          });
        },

        setFilters: (filters) => {
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          });
        },

        setSortOptions: (sortOptions) => {
          set((state) => {
            state.sortOptions = sortOptions;
          });
        },

        setLoading: (isLoading) => {
          set((state) => {
            state.isLoading = isLoading;
          });
        },

        refreshDrivers: async () => {
          set((state) => {
            state.isLoading = true;
          });
          // API call would go here
          set((state) => {
            state.isLoading = false;
          });
        },

        clearDrivers: () => {
          set((state) => {
            state.drivers = [];
            state.selectedDriver = null;
            state.lastUpdated = null;
          });
        }
      }))
    ),
    { name: 'driver-store' }
  )
);

// Alert Store
interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  selectedAlert: Alert | null;
  isLoading: boolean;
}

interface AlertActions {
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (alertId: string, updates: Partial<Alert>) => void;
  removeAlert: (alertId: string) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  selectAlert: (alert: Alert | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState & AlertActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        alerts: [],
        unreadCount: 0,
        selectedAlert: null,
        isLoading: false,

        // Actions
        setAlerts: (alerts) => {
          set((state) => {
            state.alerts = alerts;
            state.unreadCount = alerts.filter(a => !a.isRead).length;
          });
        },

        addAlert: (alert) => {
          set((state) => {
            state.alerts.unshift(alert);
            if (!alert.isRead) {
              state.unreadCount += 1;
            }
          });
        },

        updateAlert: (alertId, updates) => {
          set((state) => {
            const index = state.alerts.findIndex(a => a.id === alertId);
            if (index !== -1) {
              const oldAlert = state.alerts[index];
              state.alerts[index] = { ...oldAlert, ...updates };

              // Update unread count
              if (oldAlert.isRead !== updates.isRead) {
                if (updates.isRead) {
                  state.unreadCount = Math.max(0, state.unreadCount - 1);
                } else {
                  state.unreadCount += 1;
                }
              }

              // Update selected alert if it's the one being updated
              if (state.selectedAlert?.id === alertId) {
                state.selectedAlert = { ...state.selectedAlert, ...updates };
              }
            }
          });
        },

        removeAlert: (alertId) => {
          set((state) => {
            const alert = state.alerts.find(a => a.id === alertId);
            state.alerts = state.alerts.filter(a => a.id !== alertId);

            if (alert && !alert.isRead) {
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }

            if (state.selectedAlert?.id === alertId) {
              state.selectedAlert = null;
            }
          });
        },

        markAsRead: (alertId) => {
          get().updateAlert(alertId, { isRead: true });
        },

        markAllAsRead: () => {
          set((state) => {
            state.alerts.forEach(alert => {
              alert.isRead = true;
            });
            state.unreadCount = 0;
          });
        },

        selectAlert: (alert) => {
          set((state) => {
            state.selectedAlert = alert;
          });
        },

        setLoading: (isLoading) => {
          set((state) => {
            state.isLoading = isLoading;
          });
        },

        clearAlerts: () => {
          set((state) => {
            state.alerts = [];
            state.unreadCount = 0;
            state.selectedAlert = null;
          });
        }
      }))
    ),
    { name: 'alert-store' }
  )
);

// Dashboard Metrics Store
interface MetricsState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

interface MetricsActions {
  setMetrics: (metrics: DashboardMetrics) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  refreshMetrics: () => Promise<void>;
  clearMetrics: () => void;
}

export const useMetricsStore = create<MetricsState & MetricsActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      metrics: null,
      isLoading: false,
      lastUpdated: null,
      error: null,

      // Actions
      setMetrics: (metrics) => {
        set((state) => {
          state.metrics = metrics;
          state.lastUpdated = new Date();
          state.error = null;
        });
      },

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
          state.isLoading = false;
        });
      },

      refreshMetrics: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        // API call would go here
        set((state) => {
          state.isLoading = false;
        });
      },

      clearMetrics: () => {
        set((state) => {
          state.metrics = null;
          state.lastUpdated = null;
          state.error = null;
        });
      }
    })),
    { name: 'metrics-store' }
  )
);

// UI State Store
interface UIStateStore extends UIState {
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedTrip: (tripId: string | undefined) => void;
  setSelectedDriver: (driverId: string | undefined) => void;
  setMapCenter: (center: Coordinates) => void;
  setMapZoom: (zoom: number) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIStateStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      activeTab: 'dashboard',
      selectedTrip: undefined,
      selectedDriver: undefined,
      mapCenter: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco default
      mapZoom: 12,
      notifications: [],

      // Actions
      toggleSidebar: () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        });
      },

      setActiveTab: (tab) => {
        set((state) => {
          state.activeTab = tab;
        });
      },

      setSelectedTrip: (tripId) => {
        set((state) => {
          state.selectedTrip = tripId;
        });
      },

      setSelectedDriver: (driverId) => {
        set((state) => {
          state.selectedDriver = driverId;
        });
      },

      setMapCenter: (center) => {
        set((state) => {
          state.mapCenter = center;
        });
      },

      setMapZoom: (zoom) => {
        set((state) => {
          state.mapZoom = zoom;
        });
      },

      addNotification: (notification) => {
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            createdAt: new Date()
          };
          state.notifications.push(newNotification);

          // Auto-remove after duration
          if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration);
          }
        });
      },

      removeNotification: (id) => {
        set((state) => {
          state.notifications = state.notifications.filter(n => n.id !== id);
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.notifications = [];
        });
      }
    })),
    { name: 'ui-store' }
  )
);

// WebSocket Store for real-time updates
interface WebSocketState {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionError: string | null;
}

interface WebSocketActions {
  setConnected: (connected: boolean) => void;
  setLastMessage: (message: WebSocketMessage) => void;
  setConnectionError: (error: string | null) => void;
  handleMessage: (message: WebSocketMessage) => void;
}

export const useWebSocketStore = create<WebSocketState & WebSocketActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      isConnected: false,
      lastMessage: null,
      connectionError: null,

      // Actions
      setConnected: (connected) => {
        set((state) => {
          state.isConnected = connected;
          if (connected) {
            state.connectionError = null;
          }
        });
      },

      setLastMessage: (message) => {
        set((state) => {
          state.lastMessage = message;
        });
      },

      setConnectionError: (error) => {
        set((state) => {
          state.connectionError = error;
          state.isConnected = false;
        });
      },

      handleMessage: (message) => {
        set((state) => {
          state.lastMessage = message;
        });

        // Handle different message types
        const { type, payload } = message;

        switch (type) {
          case 'trip_update':
            useTripStore.getState().updateTrip(payload.id, payload);
            break;

          case 'driver_location_update':
            useDriverStore.getState().updateDriver(payload.driverId, {
              currentLocation: payload.location,
              lastActive: new Date()
            });
            break;

          case 'driver_status_update':
            useDriverStore.getState().updateDriver(payload.driverId, {
              status: payload.status,
              availability: payload.availability
            });
            break;

          case 'new_trip_request':
            useTripStore.getState().addTrip(payload);
            useUIStore.getState().addNotification({
              type: 'info',
              title: 'New Trip Request',
              message: `Trip ${payload.id} has been requested`,
              duration: 5000
            });
            break;

          case 'alert_created':
            useAlertStore.getState().addAlert(payload);
            useUIStore.getState().addNotification({
              type: payload.severity === 'critical' ? 'error' : 'warning',
              title: 'New Alert',
              message: payload.title,
              duration: 10000
            });
            break;

          case 'metrics_update':
            useMetricsStore.getState().setMetrics(payload);
            break;

          default:
            console.log('Unhandled WebSocket message type:', type);
        }
      }
    })),
    { name: 'websocket-store' }
  )
);

// Audit Log Store
interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface AuditActions {
  setLogs: (logs: AuditLog[]) => void;
  addLog: (log: AuditLog) => void;
  setLoading: (isLoading: boolean) => void;
  refreshLogs: () => Promise<void>;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState & AuditActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      logs: [],
      isLoading: false,
      lastUpdated: null,

      // Actions
      setLogs: (logs) => {
        set((state) => {
          state.logs = logs;
          state.lastUpdated = new Date();
        });
      },

      addLog: (log) => {
        set((state) => {
          state.logs.unshift(log);
          state.lastUpdated = new Date();
        });
      },

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      refreshLogs: async () => {
        set((state) => {
          state.isLoading = true;
        });
        // API call would go here
        set((state) => {
          state.isLoading = false;
        });
      },

      clearLogs: () => {
        set((state) => {
          state.logs = [];
          state.lastUpdated = null;
        });
      }
    })),
    { name: 'audit-store' }
  )
);

// Helper functions for computed values
export const getFilteredTrips = () => {
  const { trips, filters, sortOptions } = useTripStore.getState();

  let filteredTrips = trips;

  // Apply filters
  if (filters.status?.length) {
    filteredTrips = filteredTrips.filter(trip => filters.status!.includes(trip.status));
  }

  if (filters.serviceType?.length) {
    filteredTrips = filteredTrips.filter(trip => filters.serviceType!.includes(trip.serviceType));
  }

  if (filters.driverId) {
    filteredTrips = filteredTrips.filter(trip => trip.driver?.id === filters.driverId);
  }

  if (filters.riderId) {
    filteredTrips = filteredTrips.filter(trip => trip.rider.id === filters.riderId);
  }

  if (filters.dateRange) {
    filteredTrips = filteredTrips.filter(trip => {
      const tripDate = new Date(trip.requestedAt);
      return tripDate >= filters.dateRange!.start && tripDate <= filters.dateRange!.end;
    });
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredTrips = filteredTrips.filter(trip =>
      trip.id.toLowerCase().includes(searchLower) ||
      trip.rider.firstName.toLowerCase().includes(searchLower) ||
      trip.rider.lastName.toLowerCase().includes(searchLower) ||
      trip.pickup.address.toLowerCase().includes(searchLower) ||
      trip.destination.address.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  filteredTrips.sort((a, b) => {
    const aValue = (a as any)[sortOptions.field];
    const bValue = (b as any)[sortOptions.field];

    if (sortOptions.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return filteredTrips;
};

export const getFilteredDrivers = () => {
  const { drivers, filters, sortOptions } = useDriverStore.getState();

  let filteredDrivers = drivers;

  // Apply filters
  if (filters.status?.length) {
    filteredDrivers = filteredDrivers.filter(driver => filters.status!.includes(driver.status));
  }

  if (filters.availability?.length) {
    filteredDrivers = filteredDrivers.filter(driver => filters.availability!.includes(driver.availability));
  }

  if (filters.vehicleType?.length) {
    filteredDrivers = filteredDrivers.filter(driver => filters.vehicleType!.includes(driver.vehicle.type));
  }

  if (filters.onlineOnly) {
    filteredDrivers = filteredDrivers.filter(driver => driver.isOnline);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredDrivers = filteredDrivers.filter(driver =>
      driver.firstName.toLowerCase().includes(searchLower) ||
      driver.lastName.toLowerCase().includes(searchLower) ||
      driver.email.toLowerCase().includes(searchLower) ||
      driver.phone.includes(filters.search!) ||
      driver.employeeId?.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  filteredDrivers.sort((a, b) => {
    const aValue = (a as any)[sortOptions.field];
    const bValue = (b as any)[sortOptions.field];

    if (sortOptions.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return filteredDrivers;
};