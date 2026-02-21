import { Badge } from './badge';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'available' | 'allocated' | 'under_maintenance' | 'damaged'
  | 'pending' | 'approved' | 'rejected' | 'completed'
  | 'low' | 'medium' | 'high' | 'critical';

interface StatusBadgeConsistentProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Item Status
  available: { label: 'Available', className: 'bg-green-100 text-green-800' },
  allocated: { label: 'Allocated', className: 'bg-blue-100 text-blue-800' },
  under_maintenance: { label: 'Under Maintenance', className: 'bg-yellow-100 text-yellow-800' },
  damaged: { label: 'Damaged', className: 'bg-red-100 text-red-800' },
  
  // Request Status
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800' },
  
  // Urgency Levels
  low: { label: 'Low', className: 'bg-green-100 text-green-800' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
};

export function StatusBadgeConsistent({ status, className }: StatusBadgeConsistentProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  
  return (
    <Badge className={cn('text-xs font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
