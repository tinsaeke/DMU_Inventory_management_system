/**
 * Application Configuration
 * Centralized configuration for environment variables and app settings
 */

export const config = {
  // Application Info
  app: {
    name: 'University Asset Guardian',
    shortName: 'DMU Inventory',
    version: '1.0.0',
    description: 'Inventory Management System for Debre Markos University',
  },

  // API Configuration
  api: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // Feature Flags
  features: {
    enableNotifications: true,
    enableExport: true,
    enableTransfers: true,
    enableMaintenance: true,
    enableAuditLog: true,
  },

  // Pagination Settings
  pagination: {
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    maxPageSize: 100,
  },

  // Polling Intervals (milliseconds)
  polling: {
    notifications: 30000,  // 30 seconds
    transfers: 30000,      // 30 seconds
    requests: 30000,       // 30 seconds
  },

  // File Upload Limits
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },

  // Date Formats
  dateFormats: {
    display: 'MMM dd, yyyy',
    displayWithTime: 'MMM dd, yyyy HH:mm',
    iso: 'yyyy-MM-dd',
  },

  // Toast Duration
  toast: {
    duration: 5000, // 5 seconds
    errorDuration: 7000, // 7 seconds
  },

  // Cache Times (milliseconds)
  cache: {
    colleges: 5 * 60 * 1000,      // 5 minutes
    departments: 5 * 60 * 1000,   // 5 minutes
    categories: 10 * 60 * 1000,   // 10 minutes
  },

  // Validation Rules
  validation: {
    minPasswordLength: 8,
    minJustificationLength: 10,
    maxDescriptionLength: 500,
    assetTagPattern: /^[A-Z]{2,4}\d{3,6}$/,
  },

  // UI Settings
  ui: {
    sidebarWidth: 256, // pixels
    headerHeight: 64,  // pixels
    compactTablePadding: 'px-2 py-1',
    normalTablePadding: 'px-4 py-2',
  },
} as const;

// Type-safe config access
export type Config = typeof config;

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}
