import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
}

/**
 * Format a date and time to a human-readable string
 */
export function formatDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
}

/**
 * Format time to a human-readable string
 */
export function formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  });
}

/**
 * Get relative time from now (e.g., "2 minutes ago", "in 5 hours")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffInMs / (1000 * 60));

  if (Math.abs(diffInMinutes) < 1) {
    return 'Just now';
  }

  if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes > 0
      ? `in ${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'}`
      : `${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return diffInHours > 0
      ? `in ${diffInHours} hour${diffInHours === 1 ? '' : 's'}`
      : `${Math.abs(diffInHours)} hour${Math.abs(diffInHours) === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (Math.abs(diffInDays) < 7) {
    return diffInDays > 0
      ? `in ${diffInDays} day${diffInDays === 1 ? '' : 's'}`
      : `${Math.abs(diffInDays)} day${Math.abs(diffInDays) === 1 ? '' : 's'} ago`;
  }

  // For longer periods, show the actual date
  return formatDate(dateObj);
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format distance with appropriate units
 */
export function formatDistance(distance: number, unit: 'miles' | 'kilometers' = 'miles'): string {
  if (distance < 1) {
    const feet = distance * (unit === 'miles' ? 5280 : 1000);
    return `${Math.round(feet)} ${unit === 'miles' ? 'ft' : 'm'}`;
  }

  return `${distance.toFixed(1)} ${unit === 'miles' ? 'mi' : 'km'}`;
}

/**
 * Format duration in minutes to hours and minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hr${hours === 1 ? '' : 's'} ${remainingMinutes} min`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original if we can't format it
  return phone;
}

/**
 * Generate initials from a name
 */
export function getInitials(firstName: string, lastName?: string): string {
  if (!firstName) return '';

  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';

  return first + last;
}

/**
 * Generate a random color for avatars
 */
export function getAvatarColor(seed: string): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#EC4899', // pink
    '#6366F1'  // indigo
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as any;

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if we're running in the browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}