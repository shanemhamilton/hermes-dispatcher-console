/**
 * Core TypeScript types and interfaces for the Hermes Dispatcher Console
 */

// Authentication and User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  permissions: Permission[];
  avatar?: string;
  lastLogin?: Date;
  isActive: boolean;
}

export enum UserRole {
  DISPATCHER = 'dispatcher',
  MANAGER = 'manager',
  SUPPORT = 'support',
  ADMIN = 'admin'
}

export enum Permission {
  VIEW_TRIPS = 'view_trips',
  CREATE_TRIPS = 'create_trips',
  EDIT_TRIPS = 'edit_trips',
  CANCEL_TRIPS = 'cancel_trips',
  VIEW_DRIVERS = 'view_drivers',
  MANAGE_DRIVERS = 'manage_drivers',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  MANAGE_TENANTS = 'manage_tenants',
  VIEW_AUDIT_LOGS = 'view_audit_logs'
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logo?: string;
  primaryColor: string;
  timezone: string;
  address: Address;
  settings: TenantSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  maxDrivers: number;
  operatingHours: OperatingHours;
  serviceTypes: ServiceType[];
  autoDispatch: boolean;
  requireSignature: boolean;
  enableTips: boolean;
  currency: string;
  distanceUnit: 'miles' | 'kilometers';
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isActive: boolean;
  openTime: string; // HH:mm format
  closeTime: string; // HH:mm format
}

// Trip types
export interface Trip {
  id: string;
  tenantId: string;
  requestId: string;
  status: TripStatus;
  serviceType: ServiceType;
  rider: Rider;
  driver?: Driver;
  pickup: Location;
  destination: Location;
  estimatedDuration: number; // minutes
  estimatedDistance: number; // miles/km
  estimatedFare: number;
  actualFare?: number;
  requestedAt: Date;
  scheduledAt?: Date;
  assignedAt?: Date;
  pickedUpAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  specialInstructions?: string;
  rating?: Rating;
  route?: RoutePoint[];
  waypoints?: Location[];
  paymentMethod: PaymentMethod;
  promoCode?: string;
  discount?: number;
  tags: string[];
  priority: TripPriority;
  metadata: Record<string, any>;
}

export enum TripStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  EN_ROUTE_TO_PICKUP = 'en_route_to_pickup',
  ARRIVED_AT_PICKUP = 'arrived_at_pickup',
  RIDER_ON_BOARD = 'rider_on_board',
  EN_ROUTE_TO_DESTINATION = 'en_route_to_destination',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum TripPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ServiceType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  WHEELCHAIR = 'wheelchair',
  GROUP = 'group',
  DELIVERY = 'delivery'
}

// Driver types
export interface Driver {
  id: string;
  tenantId: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: DriverStatus;
  availability: DriverAvailability;
  currentLocation?: Location;
  vehicle: Vehicle;
  licenseNumber: string;
  licenseExpiry: Date;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  isOnline: boolean;
  lastActive: Date;
  shift?: Shift;
  documents: DriverDocument[];
  emergencyContact: EmergencyContact;
  createdAt: Date;
  updatedAt: Date;
}

export enum DriverStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  EN_ROUTE = 'en_route',
  OFFLINE = 'offline',
  BREAK = 'break',
  MAINTENANCE = 'maintenance'
}

export enum DriverAvailability {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  AWAY = 'away'
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string;
  capacity: number;
  type: VehicleType;
  isWheelchairAccessible: boolean;
  fuelType: string;
  insuranceExpiry: Date;
  registrationExpiry: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  mileage: number;
}

export enum VehicleType {
  SEDAN = 'sedan',
  SUV = 'suv',
  VAN = 'van',
  WHEELCHAIR_VAN = 'wheelchair_van',
  TRUCK = 'truck'
}

export interface Shift {
  id: string;
  driverId: string;
  startTime: Date;
  endTime?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  totalHours?: number;
  totalBreakTime?: number;
  totalTrips: number;
  totalEarnings: number;
  status: ShiftStatus;
}

export enum ShiftStatus {
  ACTIVE = 'active',
  ON_BREAK = 'on_break',
  COMPLETED = 'completed'
}

// Rider types
export interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  defaultPaymentMethod?: PaymentMethod;
  rating?: number;
  totalTrips: number;
  isVip: boolean;
  accessibilityNeeds?: AccessibilityNeed[];
  emergencyContact?: EmergencyContact;
  notes?: string;
  createdAt: Date;
}

export enum AccessibilityNeed {
  WHEELCHAIR = 'wheelchair',
  WALKER = 'walker',
  SERVICE_ANIMAL = 'service_animal',
  VISUAL_IMPAIRMENT = 'visual_impairment',
  HEARING_IMPAIRMENT = 'hearing_impairment'
}

// Location and Geography types
export interface Location {
  id?: string;
  address: string;
  coordinates: Coordinates;
  placeId?: string;
  type?: LocationType;
  name?: string;
  instructions?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export enum LocationType {
  HOME = 'home',
  WORK = 'work',
  AIRPORT = 'airport',
  HOSPITAL = 'hospital',
  SCHOOL = 'school',
  SHOPPING = 'shopping',
  OTHER = 'other'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  unit?: string;
}

export interface RoutePoint {
  coordinates: Coordinates;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

// Payment types
export interface PaymentMethod {
  id: string;
  type: PaymentType;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  CORPORATE = 'corporate',
  VOUCHER = 'voucher'
}

// Rating and Review types
export interface Rating {
  id: string;
  tripId: string;
  raterId: string;
  raterType: 'rider' | 'driver';
  ratedId: string;
  ratedType: 'rider' | 'driver';
  score: number; // 1-5
  comment?: string;
  categories?: RatingCategory[];
  createdAt: Date;
}

export interface RatingCategory {
  name: string;
  score: number;
}

// Document types
export interface DriverDocument {
  id: string;
  type: DocumentType;
  url: string;
  expiryDate?: Date;
  isVerified: boolean;
  uploadedAt: Date;
}

export enum DocumentType {
  DRIVERS_LICENSE = 'drivers_license',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  INSURANCE = 'insurance',
  BACKGROUND_CHECK = 'background_check',
  MEDICAL_CLEARANCE = 'medical_clearance'
}

// Contact types
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Alert and Notification types
export interface Alert {
  id: string;
  tenantId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  tripId?: string;
  driverId?: string;
  riderId?: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  actionRequired: boolean;
  metadata: Record<string, any>;
}

export enum AlertType {
  TRIP_DELAY = 'trip_delay',
  DRIVER_OFFLINE = 'driver_offline',
  VEHICLE_BREAKDOWN = 'vehicle_breakdown',
  EMERGENCY = 'emergency',
  PAYMENT_FAILED = 'payment_failed',
  NO_DRIVERS_AVAILABLE = 'no_drivers_available',
  RIDER_NO_SHOW = 'rider_no_show',
  DRIVER_NO_SHOW = 'driver_no_show',
  ROUTE_DEVIATION = 'route_deviation',
  SYSTEM_ERROR = 'system_error'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Analytics and Metrics types
export interface DashboardMetrics {
  tenantId: string;
  timeRange: TimeRange;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  activeTrips: number;
  pendingTrips: number;
  totalDrivers: number;
  activeDrivers: number;
  averageWaitTime: number; // minutes
  averageRating: number;
  totalRevenue: number;
  averageFare: number;
  completionRate: number; // percentage
  cancellationRate: number; // percentage
  updatedAt: Date;
}

export interface TimeRange {
  start: Date;
  end: Date;
  period: TimePeriod;
}

export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  driverId: string;
  period: TimeRange;
  totalTrips: number;
  totalHours: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
  onTimePercentage: number;
  cancellationRate: number;
  totalDistance: number;
  fuelEfficiency?: number;
}

// Audit and Logging types
export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  description: string;
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ASSIGN = 'assign',
  CANCEL = 'cancel',
  COMPLETE = 'complete',
  EXPORT = 'export'
}

// WebSocket message types
export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: Date;
  tenantId: string;
  userId?: string;
}

export enum MessageType {
  TRIP_UPDATE = 'trip_update',
  DRIVER_LOCATION_UPDATE = 'driver_location_update',
  DRIVER_STATUS_UPDATE = 'driver_status_update',
  NEW_TRIP_REQUEST = 'new_trip_request',
  ALERT_CREATED = 'alert_created',
  METRICS_UPDATE = 'metrics_update',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Query and Filter types
export interface TripFilters {
  status?: TripStatus[];
  serviceType?: ServiceType[];
  driverId?: string;
  riderId?: string;
  dateRange?: TimeRange;
  priority?: TripPriority[];
  search?: string;
}

export interface DriverFilters {
  status?: DriverStatus[];
  availability?: DriverAvailability[];
  vehicleType?: VehicleType[];
  search?: string;
  onlineOnly?: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Form types
export interface TripCreateRequest {
  riderId?: string;
  riderInfo?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  pickup: Location;
  destination: Location;
  serviceType: ServiceType;
  scheduledAt?: Date;
  specialInstructions?: string;
  paymentMethod: PaymentMethod;
  priority: TripPriority;
  waypoints?: Location[];
}

export interface DriverAssignmentRequest {
  tripId: string;
  driverId: string;
  override?: boolean;
  notes?: string;
}

// UI State types
export interface UIState {
  sidebarCollapsed: boolean;
  activeTab: string;
  selectedTrip?: string;
  selectedDriver?: string;
  mapCenter: Coordinates;
  mapZoom: number;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: Date;
}

// Map types
export interface MapMarker {
  id: string;
  type: MarkerType;
  coordinates: Coordinates;
  data: any;
  onClick?: () => void;
}

export enum MarkerType {
  DRIVER = 'driver',
  PICKUP = 'pickup',
  DESTINATION = 'destination',
  WAYPOINT = 'waypoint'
}

// All types are exported above