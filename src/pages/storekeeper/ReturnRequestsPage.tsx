import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Package } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function ReturnRequestsPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: returnRequests = [], isLoading } = useQuery({
    queryKey: ['return-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          items(name, asset_tag, status),
          profiles!return_requests_requester_id_fkey(full_name)
        `)
        .order('requested_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching return requests:', error);
        return [];
      }
      return data || [];
    },
    refetchInterval: 30000
  });

  const approveReturnMutation = useMutation({
    mutationFn: async (requestId: string) => {
      console.log('Approving return request:', requestId);
      
      // Get the return request details first
      const { data: request, error: fetchError } = await supabase
        .from('return_requests')
        .select('item_id')
        .eq('id', requestId)
        .single();
      
      if (fetchError || !request) {
        console.error('Failed to fetch return request:', fetchError);
        throw new Error('Return request not found');
      }
      
      console.log('Found return request for item:', request.item_id);
      
      // Create or get Store department for returned items
      let storeDeptId = null;
      
      // Try to find existing Store department
      const { data: existingStore } = await supabase
        .from('departments')
        .select('id')
        .ilike('name', '%store%')
        .limit(1)
        .single();
      
      if (existingStore) {
        storeDeptId = existingStore.id;
      } else {
        // Create Store department if it doesn't exist
        const { data: colleges } = await supabase
          .from('colleges')
          .select('id')
          .limit(1)
          .single();
        
        if (colleges) {
          const { data: newStore } = await supabase
            .from('departments')
            .insert({
              name: 'Store Department',
              college_id: colleges.id
            })
            .select('id')
            .single();
          
          storeDeptId = newStore?.id;
        }
      }
      
      // Update item status and assign to store department
      const { error: itemError } = await supabase
        .from('items')
        .update({
          status: 'Available',
          current_custodian_id: null,
          owner_department_id: storeDeptId,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.item_id);
      
      if (itemError) {
        console.error('Failed to update item:', itemError);
        throw itemError;
      }
      
      console.log('Item updated successfully');
      
      // Update return request
      const { error: requestError } = await supabase
        .from('return_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by_id: profile?.id
        })
        .eq('id', requestId);
      
      if (requestError) {
        console.error('Failed to update return request:', requestError);
        throw requestError;
      }
      
      console.log('Return request approved successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['items-registry'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
      toast({
        title: "Success",
        description: "Return request approved and item returned to store",
      });
    },
    onError: (error) => {
      console.error('Approve error:', error);
      toast({
        title: "Error",
        description: "Failed to approve return request",
        variant: "destructive",
      });
    }
  });

  const rejectReturnMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('return_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by_id: profile?.id
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      toast({
        title: "Success",
        description: "Return request rejected",
      });
    },
    onError: (error) => {
      console.error('Reject error:', error);
      toast({
        title: "Error",
        description: "Failed to reject return request",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingRequests = returnRequests.filter(req => req.status === 'pending');

  const {
    paginatedData: paginatedPending,
    currentPage: pendingPage,
    pageSize: pendingPageSize,
    totalPages: pendingTotalPages,
    totalItems: pendingTotalItems,
    handlePageChange: handlePendingPageChange,
    handlePageSizeChange: handlePendingPageSizeChange,
  } = usePagination(pendingRequests, 25);

  const {
    paginatedData: paginatedAll,
    currentPage: allPage,
    pageSize: allPageSize,
    totalPages: allTotalPages,
    totalItems: allTotalItems,
    handlePageChange: handleAllPageChange,
    handlePageSizeChange: handleAllPageSizeChange,
  } = usePagination(returnRequests, 25);

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Return Requests"
      pageSubtitle="Review and process item return requests from staff"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pending Return Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                        Loading return requests...
                      </td>
                    </tr>
                  ) : paginatedPending.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-sm font-medium">{request.items?.name || 'Unknown Item'}</td>
                      <td className="px-2 py-1 text-xs font-mono">{request.items?.asset_tag || 'N/A'}</td>
                      <td className="px-2 py-1 text-sm">{request.profiles?.full_name || 'Unknown'}</td>
                      <td className="px-2 py-1 text-xs">{new Date(request.requested_at).toLocaleDateString()}</td>
                      <td className="px-2 py-1 text-xs max-w-32 truncate" title={request.reason}>{request.reason || 'No reason'}</td>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => approveReturnMutation.mutate(request.id)}
                            disabled={approveReturnMutation.isPending}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 text-xs px-2"
                            onClick={() => rejectReturnMutation.mutate(request.id)}
                            disabled={rejectReturnMutation.isPending}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && pendingRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                        No pending return requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {pendingRequests.length > 0 && (
                <Pagination
                  currentPage={pendingPage}
                  totalPages={pendingTotalPages}
                  pageSize={pendingPageSize}
                  totalItems={pendingTotalItems}
                  onPageChange={handlePendingPageChange}
                  onPageSizeChange={handlePendingPageSizeChange}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Show all requests for reference */}
        {returnRequests.length > pendingRequests.length && (
          <Card>
            <CardHeader>
              <CardTitle>All Return Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paginatedAll.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{request.items?.name || 'Unknown Item'}</div>
                      <div className="text-sm text-gray-600">
                        {request.profiles?.full_name} • {new Date(request.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
              {returnRequests.length > 0 && (
                <Pagination
                  currentPage={allPage}
                  totalPages={allTotalPages}
                  pageSize={allPageSize}
                  totalItems={allTotalItems}
                  onPageChange={handleAllPageChange}
                  onPageSizeChange={handleAllPageSizeChange}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}