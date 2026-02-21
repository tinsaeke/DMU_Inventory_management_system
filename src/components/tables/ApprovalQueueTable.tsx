import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApprovalWorkflow } from "@/components/ui/approval-workflow";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, Clock } from "lucide-react";
import { ApprovalQueueItem } from "@/types";

interface ApprovalQueueTableProps {
  items: ApprovalQueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
  className?: string;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ApprovalQueueTable({
  items,
  onApprove,
  onReject,
  onView,
  className,
}: ApprovalQueueTableProps) {
  if (items.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No pending approvals</p>
        <p className="mt-1 text-xs text-muted-foreground">
          All requests have been processed
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justification</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-2 py-1">
                  <div className="text-sm font-medium">{item.requesterName}</div>
                  <div className="text-xs text-gray-500">{item.requesterDepartment}</div>
                </td>
                <td className="px-2 py-1 text-sm font-medium">{item.itemName || 'New Request'}</td>
                <td className="px-2 py-1 text-xs max-w-32 truncate" title={item.justification}>{item.justification}</td>
                <td className="px-2 py-1">
                  <StatusBadge status={item.urgency} variant="urgency" />
                </td>
                <td className="px-2 py-1 text-xs">{formatDate(item.submittedAt)}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(item.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApprove(item.id)}
                      className="h-6 w-6 p-0 text-success hover:text-success hover:bg-success/10"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(item.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
