import { cn } from "@/lib/utils";
import { ItemStatus, ApprovalStatus, UserRole } from "@/types";

interface StatusBadgeProps {
  status: ItemStatus | ApprovalStatus | UserRole | string;
  variant?: 'item' | 'approval' | 'role' | 'urgency';
  size?: 'sm' | 'md';
  className?: string;
}

const itemStatusConfig: Record<ItemStatus, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'bg-status-available/15 text-status-available border-status-available/30',
  },
  allocated: {
    label: 'Allocated',
    className: 'bg-status-allocated/15 text-status-allocated border-status-allocated/30',
  },
  under_maintenance: {
    label: 'Under Maintenance',
    className: 'bg-status-maintenance/15 text-status-maintenance border-status-maintenance/30',
  },
  damaged: {
    label: 'Damaged',
    className: 'bg-status-damaged/15 text-status-damaged border-status-damaged/30',
  },
};

const approvalStatusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-stage-pending/15 text-stage-pending border-stage-pending/30',
  },
  approved: {
    label: 'Approved',
    className: 'bg-stage-approved/15 text-stage-approved border-stage-approved/30',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-stage-rejected/15 text-stage-rejected border-stage-rejected/30',
  },
};

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: 'System Admin',
    className: 'bg-role-admin/15 text-role-admin border-role-admin/30',
  },
  college_dean: {
    label: 'College Dean',
    className: 'bg-role-dean/15 text-role-dean border-role-dean/30',
  },
  department_head: {
    label: 'Department Head',
    className: 'bg-role-department/15 text-role-department border-role-department/30',
  },
  storekeeper: {
    label: 'Storekeeper',
    className: 'bg-role-storekeeper/15 text-role-storekeeper border-role-storekeeper/30',
  },
  staff: {
    label: 'Staff',
    className: 'bg-role-staff/15 text-role-staff border-role-staff/30',
  },
};

const urgencyConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-muted text-muted-foreground border-border',
  },
  medium: {
    label: 'Medium',
    className: 'bg-info/15 text-info border-info/30',
  },
  high: {
    label: 'High',
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  critical: {
    label: 'Critical',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
};

export function StatusBadge({ status, variant = 'item', size = 'sm', className }: StatusBadgeProps) {
  let config: { label: string; className: string };

  switch (variant) {
    case 'item':
      config = itemStatusConfig[status as ItemStatus] || { label: status, className: 'bg-muted text-muted-foreground' };
      break;
    case 'approval':
      config = approvalStatusConfig[status as ApprovalStatus] || { label: status, className: 'bg-muted text-muted-foreground' };
      break;
    case 'role':
      config = roleConfig[status as UserRole] || { label: status, className: 'bg-muted text-muted-foreground' };
      break;
    case 'urgency':
      config = urgencyConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
      break;
    default:
      config = { label: status, className: 'bg-muted text-muted-foreground' };
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
