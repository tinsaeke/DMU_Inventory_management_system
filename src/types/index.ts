// Database Types
export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  college_id: string | null;
  department_id: string | null;
  email?: string;
  updated_at: string;
  departments?: Department;
  colleges?: College;
}

export interface College {
  id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  college_id: string;
  created_at: string;
  colleges?: College;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  serial_number: string | null;
  category_id: string | null;
  asset_tag: string;
  status: ItemStatus;
  owner_department_id: string | null;
  current_custodian_id: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  created_at: string;
  updated_at: string;
  item_categories?: ItemCategory;
}

export interface ItemCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface ItemRequest {
  id: string;
  requester_id: string;
  requester_department_id: string;
  item_name: string;
  item_description: string | null;
  justification: string | null;
  quantity: number;
  urgency: UrgencyLevel;
  status: RequestStatus;
  rejection_reason: string | null;
  dept_head_approver_id: string | null;
  dean_approver_id: string | null;
  storekeeper_allocator_id: string | null;
  allocated_item_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  departments?: Department;
}

export interface ItemTransfer {
  id: string;
  item_id: string;
  initiator_id: string;
  receiver_id: string;
  status: TransferStatus;
  reason: string | null;
  transfer_type: string | null;
  initiator_department_id: string | null;
  receiver_department_id: string | null;
  rejection_reason: string | null;
  dept_head_approver_id: string | null;
  dean_approver_id: string | null;
  storekeeper_approver_id: string | null;
  requested_at: string;
  created_at: string;
  updated_at: string;
  items?: Item;
  initiator?: Profile;
  receiver?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  item_id: string;
  requester_id: string;
  maintenance_type: MaintenanceType;
  issue_description: string;
  urgency: UrgencyLevel;
  status: string;
  created_at: string;
  updated_at: string;
}

// Enums and Union Types
export type UserRole = 'admin' | 'college_dean' | 'department_head' | 'storekeeper' | 'staff';

export type ItemStatus = 'Available' | 'Allocated' | 'Under Maintenance' | 'Damaged';

export type RequestStatus = 
  | 'pending_dept_head' 
  | 'pending_dean' 
  | 'pending_storekeeper' 
  | 'approved' 
  | 'rejected';

export type TransferStatus = 
  | 'pending_storekeeper'
  | 'pending_receiver_acceptance' 
  | 'completed' 
  | 'rejected';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'approval';

export type MaintenanceType = 'repair' | 'service' | 'replacement' | 'upgrade';

// Component Props Types
export interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
  userEmail: string;
  collegeName?: string;
  departmentName?: string;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  notificationCount?: number;
}

export interface ApprovalQueueItem {
  id: string;
  type: 'request' | 'transfer';
  requesterName: string;
  requesterId: string;
  requesterDepartment: string;
  requesterDepartmentId: string;
  itemName: string;
  justification?: string;
  urgency: UrgencyLevel;
  submittedAt: Date;
  previousApprovals: Array<{
    role: string;
    status: 'approved' | 'rejected' | 'pending';
  }>;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// API Response Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// Form Types
export interface ItemRequestFormData {
  item_name: string;
  item_description?: string;
  justification: string;
  quantity: number;
  urgency: UrgencyLevel;
}

export interface TransferRequestFormData {
  item_id: string;
  college_id: string;
  department_id: string;
  receiver_id: string;
  reason?: string;
}

export interface MaintenanceRequestFormData {
  item_id: string;
  maintenance_type: MaintenanceType;
  issue_description: string;
  urgency: UrgencyLevel;
}

// Utility Types
export interface InventoryStats {
  total: number;
  available: number;
  allocated: number;
  maintenance: number;
  damaged: number;
}

export interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

// Export all types
export type {
  Profile,
  College,
  Department,
  Item,
  ItemCategory,
  ItemRequest,
  ItemTransfer,
  Notification,
  MaintenanceRequest,
};
