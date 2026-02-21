import { useState } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getItemsByCustodian, updateItemStatus, type ItemWithDetails } from '@/lib/itemManagement';

const fetchMyItems = async (userId: string): Promise<ItemWithDetails[]> => {
  return getItemsByCustodian(userId);
};

export default function DepartmentMyItemsPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const { data: myItems = [], isLoading } = useQuery({
    queryKey: ['department-head-items', profile?.id],
    queryFn: () => fetchMyItems(profile?.id || ''),
    enabled: !!profile?.id,
    refetchInterval: 30000
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, newStatus }: { itemId: string, newStatus: string }) => {
      await updateItemStatus(itemId, newStatus as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-head-items'] });
      toast({ title: "Success", description: "Item status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  });

  const returnRequestMutation = useMutation({
    mutationFn: async ({ itemId, reason }: { itemId: string, reason: string }) => {
      const { error } = await supabase
        .from('return_requests')
        .insert({
          item_id: itemId,
          requester_id: profile?.id,
          reason: reason
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-head-items'] });
      toast({ title: "Success", description: "Return request submitted successfully" });
      setIsReturnDialogOpen(false);
      setSelectedItem(null);
      setReturnReason('');
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to submit return request", variant: "destructive" });
    },
  });

  const handleStatusChange = (itemId: string, newStatus: string) => {
    updateItemStatusMutation.mutate({ itemId, newStatus });
  };

  const handleRequestReturn = (item: any) => {
    setSelectedItem(item);
    setIsReturnDialogOpen(true);
  };

  const submitReturnRequest = () => {
    if (selectedItem && returnReason.trim()) {
      returnRequestMutation.mutate({ 
        itemId: selectedItem.id, 
        reason: returnReason.trim() 
      });
    }
  };

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(myItems, 25);

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      pageTitle="My Items"
      pageSubtitle="Items currently assigned to you"
    >
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Items ({myItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Tag
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-2 text-center text-gray-500">
                      Loading your items...
                    </td>
                  </tr>
                ) : paginatedData.map((item) => {
                  const hasPendingRequest = item.return_requests?.some(
                    (req: any) => req.status === 'pending'
                  );
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1">
                        <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {item.asset_tag}
                        </span>
                      </td>
                      <td className="px-2 py-1 font-medium text-gray-900 text-sm">
                        {item.name}
                      </td>
                      <td className="px-2 py-1 text-gray-900 text-sm">
                        {item.item_categories?.name || 'N/A'}
                      </td>
                      <td className="px-2 py-1">
                        <Select 
                          value={item.status} 
                          onValueChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                          disabled={hasPendingRequest}
                        >
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Allocated">Allocated</SelectItem>
                            <SelectItem value="In Use">In Use</SelectItem>
                            <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                            <SelectItem value="Damaged">Damaged</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1 text-gray-500 text-sm">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-2 py-1">
                        <Button
                          onClick={() => handleRequestReturn(item)}
                          disabled={hasPendingRequest || returnRequestMutation.isPending}
                          size="sm"
                          variant={hasPendingRequest ? "secondary" : "outline"}
                          className="h-6 text-xs px-2"
                        >
                          {hasPendingRequest ? 'Return Pending' : 'Request Return'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && myItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                      No items assigned to you yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {myItems.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Item Return</DialogTitle>
            <DialogDescription>
              Submit a return request for {selectedItem?.name}. Please provide a reason for returning this item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Return</label>
              <Textarea
                placeholder="Please explain why you want to return this item..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsReturnDialogOpen(false);
                setSelectedItem(null);
                setReturnReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitReturnRequest}
              disabled={!returnReason.trim() || returnRequestMutation.isPending}
            >
              {returnRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}