import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, Check, X, Package, User, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function IncomingTransfersPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine role for layout
  const role = profile?.role === 'department_head' ? 'department_head' : 
               profile?.role === 'college_dean' ? 'college_dean' : 'staff';

  const { data: incomingTransfers = [], isLoading } = useQuery({
    queryKey: ['incoming-transfers', profile?.id],
    queryFn: async () => {
      console.log('Fetching incoming transfers for user:', profile?.id);
      const { data, error } = await supabase
        .from('item_transfers')
        .select(`
          *,
          items(name, asset_tag),
          initiator:profiles!initiator_id(full_name)
        `)
        .eq('receiver_id', profile?.id)
        .eq('status', 'pending_receiver_acceptance')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transfers:', error);
        throw error;
      }
      console.log('Found incoming transfers:', data?.length || 0);
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000
  });

  const acceptTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      console.log('Accepting transfer request:', transferId);
      
      // Get transfer details
      const { data: transfer, error: fetchError } = await supabase
        .from('item_transfers')
        .select('item_id, receiver_id, receiver:profiles!receiver_id(department_id)')
        .eq('id', transferId)
        .single();
      
      if (fetchError || !transfer) throw new Error('Transfer not found');
      
      // Update item ownership
      const { error: itemError } = await supabase
        .from('items')
        .update({
          current_custodian_id: transfer.receiver_id,
          owner_department_id: transfer.receiver?.department_id,
          status: 'Allocated',
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.item_id);
      
      if (itemError) throw itemError;
      
      // Mark transfer as completed to save history
      const { error: updateError } = await supabase
        .from('item_transfers')
        .update({ status: 'completed' })
        .eq('id', transferId);
      
      if (updateError) throw updateError;
      
      console.log('Transfer completed successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
      queryClient.invalidateQueries({ queryKey: ['department-items'] });
      toast({
        title: "Success",
        description: "Transfer completed. Item is now in your custody.",
      });
    },
    onError: (error) => {
      console.error('Accept transfer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept transfer",
        variant: "destructive",
      });
    }
  });

  const rejectTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await supabase
        .from('item_transfers')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: 'Rejected by receiver'
        })
        .eq('id', transferId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-transfers'] });
      toast({
        title: "Success",
        description: "Transfer request rejected",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject transfer",
        variant: "destructive",
      });
    }
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(incomingTransfers, 10);

  return (
    <DashboardLayout
      role={role}
      userName={profile?.full_name || user?.email || "User"}
      userEmail={user?.email || ""}
      pageTitle="Incoming Transfers"
      pageSubtitle="Review and accept item transfer requests sent to you"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Pending Transfer Requests ({totalItems})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                      Loading transfer requests...
                    </td>
                  </tr>
                ) : paginatedData.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-sm font-medium">{transfer.items?.name || 'Unknown Item'}</td>
                    <td className="px-2 py-1 text-xs font-mono">{transfer.items?.asset_tag || 'N/A'}</td>
                    <td className="px-2 py-1 text-sm">{transfer.initiator?.full_name || 'Unknown'}</td>
                    <td className="px-2 py-1 text-xs">{new Date(transfer.created_at).toLocaleDateString()}</td>
                    <td className="px-2 py-1 text-xs max-w-32 truncate" title={transfer.reason}>{transfer.reason || 'No reason'}</td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => acceptTransferMutation.mutate(transfer.id)}
                          disabled={acceptTransferMutation.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 text-xs px-2"
                          onClick={() => rejectTransferMutation.mutate(transfer.id)}
                          disabled={rejectTransferMutation.isPending}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && incomingTransfers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                      No pending transfer requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalItems > 0 && (
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
    </DashboardLayout>
  );
}