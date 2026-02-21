import { DB_ERROR_CODES, ERROR_MESSAGES } from './constants';

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

/**
 * Formats a date to a localized date string
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

/**
 * Formats a date to a localized date and time string
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString();
};

/**
 * Calculates days since a given date
 */
export const daysSince = (date: string | Date): number => {
  return Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
};

/**
 * Checks if a date is within the current month
 */
export const isCurrentMonth = (date: string | Date): boolean => {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

/**
 * Formats a status string for display (replaces underscores with spaces and capitalizes)
 */
export const formatStatus = (status: string): string => {
  return status?.replace(/_/g, ' ').toUpperCase() || '';
};

/**
 * Handles Supabase errors and returns user-friendly messages
 */
export const handleSupabaseError = (error: unknown): string => {
  if (!error) return ERROR_MESSAGES.GENERIC;

  const supabaseError = error as SupabaseError;

  // Check for duplicate key violation
  if (supabaseError.code === DB_ERROR_CODES.UNIQUE_VIOLATION || 
      supabaseError.message?.includes('duplicate') || 
      supabaseError.message?.includes('unique')) {
    return ERROR_MESSAGES.DUPLICATE_ASSET_TAG;
  }

  // Check for foreign key violation
  if (supabaseError.code === DB_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
    return ERROR_MESSAGES.ITEM_IN_USE;
  }

  // Return the error message if available
  return supabaseError.message || ERROR_MESSAGES.GENERIC;
};

/**
 * Safely parses a float value
 */
export const parseFloatSafe = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
};

/**
 * Truncates text to a specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Gets initials from a full name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

/**
 * Validates if a string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Filters array by search term (case-insensitive)
 */
export const filterBySearch = <T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] => {
  if (!searchTerm) return items;
  const lowerSearch = searchTerm.toLowerCase();
  return items.filter(item =>
    fields.some(field => 
      String(item[field] || '').toLowerCase().includes(lowerSearch)
    )
  );
};

/**
 * Groups array by a key
 */
export const groupBy = <T extends Record<string, unknown>>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Safely accesses nested object properties
 */
export const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};
