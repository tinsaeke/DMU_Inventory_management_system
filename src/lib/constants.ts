// Transfer Status Constants
export const TRANSFER_STATUS = {
  PENDING_STOREKEEPER: 'pending_storekeeper',
  PENDING_RECEIVER_ACCEPTANCE: 'pending_receiver_acceptance',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

// Item Status Constants
export const ITEM_STATUS = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  UNDER_MAINTENANCE: 'Under Maintenance',
  DAMAGED: 'Damaged',
} as const;

// Request Status Constants
export const REQUEST_STATUS = {
  PENDING_DEPT_HEAD: 'pending_dept_head',
  PENDING_DEAN: 'pending_dean',
  PENDING_STOREKEEPER: 'pending_storekeeper',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// User Roles Constants
export const USER_ROLES = {
  ADMIN: 'admin',
  COLLEGE_DEAN: 'college_dean',
  DEPARTMENT_HEAD: 'department_head',
  STOREKEEPER: 'storekeeper',
  STAFF: 'staff',
} as const;

// Urgency Levels
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  MY_ITEMS: 'my-items',
  MY_REQUESTS: 'my-requests',
  PENDING_ALLOCATIONS: 'pending-allocations',
  PENDING_APPROVALS: 'pending-approvals',
  PENDING_TRANSFERS: 'pending-transfers',
  INCOMING_TRANSFERS: 'incoming-transfers',
  TRANSFER_HISTORY: 'transfer-history',
  STAFF_TRANSFER_HISTORY: 'staff-transfer-history',
  STOREKEEPER_TRANSFER_HISTORY: 'storekeeper-transfer-history',
  DEPARTMENT_TRANSFERS: 'department-transfers',
  DEAN_TRANSFERS: 'dean-transfers',
  AVAILABLE_ITEMS: 'available-items',
  ITEMS_REGISTRY: 'items-registry',
  INVENTORY_ITEMS: 'inventory-items',
  INVENTORY_STATS: 'inventory-stats',
  NOTIFICATION_COUNT: 'notification-count',
  COLLEGES: 'colleges',
  DEPARTMENTS: 'departments',
  STAFF_MEMBERS: 'staff-members',
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    ITEM_ADDED: 'Item added successfully',
    ITEM_UPDATED: 'Item updated successfully',
    ITEM_DELETED: 'Item deleted successfully',
    TRANSFER_SUBMITTED: 'Transfer request submitted',
    TRANSFER_APPROVED: 'Transfer approved successfully',
    TRANSFER_COMPLETED: 'Transfer completed successfully',
    REQUEST_SUBMITTED: 'Request submitted successfully',
    ALLOCATION_SUCCESS: 'Item(s) allocated successfully',
  },
  ERROR: {
    ALLOCATION_FAILED: 'Allocation Failed',
    DELETE_FAILED: 'Delete Failed',
    TRANSFER_FAILED: 'Failed to process transfer',
    GENERIC: 'An error occurred. Please try again.',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  DUPLICATE_ASSET_TAG: 'Asset tag or serial number already exists. Please use a unique value.',
  ITEM_IN_USE: 'Failed to delete item. It may be in use.',
  QUANTITY_MISMATCH: (requested: number, selected: number) => 
    `Please select exactly ${requested} item(s). Currently selected: ${selected}`,
  TRANSFER_NOT_FOUND: 'Transfer not found',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
} as const;

// Refetch Intervals (in milliseconds)
export const REFETCH_INTERVALS = {
  FAST: 10000,    // 10 seconds
  NORMAL: 30000,  // 30 seconds
  SLOW: 60000,    // 1 minute
} as const;

// Database Error Codes
export const DB_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
} as const;

export type TransferStatus = typeof TRANSFER_STATUS[keyof typeof TRANSFER_STATUS];
export type ItemStatus = typeof ITEM_STATUS[keyof typeof ITEM_STATUS];
export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UrgencyLevel = typeof URGENCY_LEVELS[keyof typeof URGENCY_LEVELS];
