import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, Check, X, Eye, Calendar, User, Package } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TransferApprovalsPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const { data: pendingTransfers = [], isLoading } = useQuery({
    queryKey: ['pending-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_transfers')
        .select(`
          *,
          items(name, asset_tag),
          initiator:profiles!initiator_id(full_name),
          receiver:profiles!receiver_id(full_name)
        `)
        .eq('status', 'pending_storekeeper')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  const approveTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      console.log('Storekeeper approving transfer:', transferId);
      
      // Update transfer status to pending receiver acceptance
      const { error } = await supabase
        .from('item_transfers')
        .update({
          status: 'pending_receiver_acceptance',
          storekeeper_approver_id: profile?.id
        })
        .eq('id', transferId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: "Success",
        description: "Transfer approved. Waiting for receiver acceptance.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve transfer",
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
          approved_by_id: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      toast({
        title: "Success",
        description: "Transfer rejected",
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

  const handleView = (transfer: any) => {
    setSelectedTransfer(transfer);
    setIsViewOpen(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
  } = usePagination(pendingTransfers, 25);

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Transfer Approvals"
      pageSubtitle="Review and approve item transfer requests between departments"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Pending Transfer Requests ({pendingTransfers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading transfer requests...
              </div>
            ) : pendingTransfers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending transfer requests
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedData.map((transfer) => (
                  <div key={transfer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="h-5 w-5 text-gray-400" />
                          <h3 className="font-medium text-gray-900">
                            {transfer.items?.name}
                          </h3>
                          <Badge className="bg-blue-100 text-blue-800">
                            {transfer.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Asset Tag:</span> {transfer.items?.asset_tag}
                          </div>
                          <div>
                            <span className="font-medium">From:</span> {transfer.initiator?.full_name}
                          </div>
                          <div>
                            <span className="font-medium">To:</span> {transfer.receiver?.full_name}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Transfer Type: {transfer.transfer_type?.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(transfer.requested_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {transfer.reason && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">Reason:</span> {transfer.reason}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(transfer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveTransferMutation.mutate(transfer.id)}
                          disabled={approveTransferMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectTransferMutation.mutate(transfer.id)}
                          disabled={rejectTransferMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingTransfers.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Transfer Request Details</DialogTitle>
            <DialogDescription>
              Review the complete details of this transfer request.
            </DialogDescription>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Item Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedTransfer.items?.name}</div>
                    <div><span className="font-medium">Asset Tag:</span> {selectedTransfer.items?.asset_tag}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Transfer Details</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">From:</span> {selectedTransfer.initiator?.full_name}</div>
                    <div><span className="font-medium">To:</span> {selectedTransfer.receiver?.full_name}</div>
                    <div><span className="font-medium">Type:</span> 
                      <Badge className="ml-2 bg-blue-100 text-blue-800">
                        {selectedTransfer.transfer_type?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Request Information</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Initiated by:</span> {selectedTransfer.initiator?.full_name}</div>
                  <div><span className="font-medium">Date:</span> {new Date(selectedTransfer.requested_at).toLocaleString()}</div>
                </div>
              </div>

              {selectedTransfer.reason && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Reason for Transfer</h4>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedTransfer.reason}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    approveTransferMutation.mutate(selectedTransfer.id);
                    setIsViewOpen(false);
                  }}
                  disabled={approveTransferMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    rejectTransferMutation.mutate(selectedTransfer.id);
                    setIsViewOpen(false);
                  }}
                  disabled={rejectTransferMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}