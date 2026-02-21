import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, History, MoreHorizontal } from "lucide-react";
import { Item } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ItemsTableProps {
  items: Array<Item & { 
    categoryName?: string; 
    departmentName?: string; 
    custodianName?: string;
  }>;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onViewHistory?: (id: string) => void;
  showDepartment?: boolean;
  showCustodian?: boolean;
  className?: string;
}

export function ItemsTable({
  items,
  onView,
  onEdit,
  onViewHistory,
  showDepartment = true,
  showCustodian = true,
  className,
}: ItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-8 text-center", className)}>
        <p className="text-sm font-medium text-foreground">No items found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Items will appear here when added to the system
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Item Name</th>
              <th>Category</th>
              {showDepartment && <th>Department</th>}
              <th>Status</th>
              {showCustodian && <th>Custodian</th>}
              <th>Condition</th>
              <th className="w-[80px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {item.assetTag}
                  </span>
                </td>
                <td>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    {item.serialNumber && (
                      <p className="text-xs text-muted-foreground">S/N: {item.serialNumber}</p>
                    )}
                  </div>
                </td>
                <td>
                  <span className="text-sm">{item.categoryName || '-'}</span>
                </td>
                {showDepartment && (
                  <td>
                    <span className="text-sm">{item.departmentName || '-'}</span>
                  </td>
                )}
                <td>
                  <StatusBadge status={item.status} variant="item" />
                </td>
                {showCustodian && (
                  <td>
                    <span className="text-sm">{item.custodianName || 'Unassigned'}</span>
                  </td>
                )}
                <td>
                  <span className={cn(
                    "text-xs font-medium capitalize",
                    item.condition === 'excellent' && "text-success",
                    item.condition === 'good' && "text-info",
                    item.condition === 'fair' && "text-warning",
                    item.condition === 'poor' && "text-destructive",
                  )}>
                    {item.condition}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onView(item.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onViewHistory && (
                          <DropdownMenuItem onClick={() => onViewHistory(item.id)}>
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
