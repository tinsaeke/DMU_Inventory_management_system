import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ArrowLeftRight } from "lucide-react";

export default function DepartmentTransferApprovalsPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingTransfers = [], isLoading } = useQuery({
    queryKey: ['department-transfer-approvals', profile?.department_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_transfers')
        .select(`
          *,
          items(name, asset_tag),
          initiator:profiles!initiator_id(full_name, department_id),
          receiver:profiles!receiver_id(full_name, department_id)
        `)
        .or(`status.eq.pending_dept_head_approval,status.eq.pending_dean_approval`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Filter for transfers where receiver is in this department
      return (data || []).filter(t => 
        t.receiver?.department_id === profile?.department_id
      );
    },
    enabled: !!profile?.department_id,
    refetchInterval: 30000
  });

  const approveTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      // Get transfer to determine next status
      const { data: transfer } = await supabase
        .from('item_transfers')
        .select('status, receiver:profiles!receiver_id(department_id, departments(college_id))')
        .eq('id', transferId)
        .single();
      
      let nextStatus = 'pending_storekeeper_approval';
      
      // If current status is pending_dept_head, move to dean
      if (transfer?.status === 'pending_dept_head_approval') {
        nextStatus = 'pending_dean_approval';
      }
      
      const { error } = await supabase
        .from('item_transfers')
        .update({
          status: nextStatus,
          approved_by_id: profile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transferId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-transfer-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dean-transfer-approvals'] });
      toast({ title: "Success", description: "Transfer approved successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to approve transfer", variant: "destructive" });
    }
  });

  const rejectTransferMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string, reason: string }) => {
      const { error } = await supabase
        .from('item_transfers')
        .update({ 
          status: 'rejected', 
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transferId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-transfer-approvals'] });
      toast({ title: "Success", description: "Transfer rejected" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to reject transfer", variant: "destructive" });
    }
  });

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      pageTitle="Transfer Approvals"
      pageSubtitle="Approve cross-department and cross-college transfers"
      notificationCount={pendingTransfers.length}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Pending Transfer Approvals ({pendingTransfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                      Loading pending transfers...
                    </td>
                  </tr>
                ) : pendingTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1">
                      <div className="font-medium text-sm">{transfer.items?.name}</div>
                      <div className="text-xs text-gray-500">{transfer.items?.asset_tag}</div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="font-medium text-sm">{transfer.initiator?.full_name}</div>
                      <div className="text-xs text-gray-500">Initiator</div>
                    </td>
                    <td className="px-2 py-1">
                      <div className="font-medium text-sm">{transfer.receiver?.full_name}</div>
                      <div className="text-xs text-gray-500">Receiver</div>
                    </td>
                    <td className="px-2 py-1">
                      <Badge variant="outline" className="text-xs">
                        {transfer.transfer_type?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-2 py-1 max-w-xs">
                      <div className="text-sm truncate">
                        No reason provided
                      </div>
                    </td>
                    <td className="px-2 py-1 text-sm text-gray-500">
                      {new Date(transfer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => approveTransferMutation.mutate(transfer.id)}
                          disabled={approveTransferMutation.isPending}
                          className="h-6 w-6 p-0"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectTransferMutation.mutate({ 
                            transferId: transfer.id, 
                            reason: 'Rejected by department head' 
                          })}
                          disabled={rejectTransferMutation.isPending}
                          className="h-6 w-6 p-0"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && pendingTransfers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                      No pending transfer approvals
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}