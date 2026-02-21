import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ApprovalQueueTable } from "@/components/tables/ApprovalQueueTable";
import ProcessApproval from "@/components/shared/ProcessApproval";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, User, Building2, AlertCircle, FileText, Search, Check, Package } from "lucide-react";

const fetchPendingAllocations = async () => {
  const { data, error } = await supabase
    .from('item_requests')
    .select(`
      id,
      item_name,
      quantity,
      urgency,
      created_at,
      justification,
      requester_id,
      requester_department_id,
      profiles!requester_id(full_name),
      departments(name, colleges(name))
    `)
    .eq('status', 'pending_storekeeper')
    .order('created_at', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data?.map(request => ({
    id: request.id,
    type: 'request' as const,
    requesterName: request.profiles?.full_name || 'Unknown',
    requesterId: request.requester_id,
    requesterDepartment: request.departments?.name || 'Unknown',
    requesterDepartmentId: request.requester_department_id,
    itemName: request.item_name,
    quantity: request.quantity,
    justification: request.justification || '',
    urgency: request.urgency as 'low' | 'medium' | 'high' | 'critical',
    submittedAt: new Date(request.created_at),
    previousApprovals: [
      { role: 'dept_head', status: 'approved' as const },
      { role: 'dean', status: 'approved' as const },
      { role: 'storekeeper', status: 'pending' as const }
    ]
  })) || [];
};

export default function AllocationsPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [viewRequest, setViewRequest] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  // Allocation State
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocationRequest, setAllocationRequest] = useState<any>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  
  const queryClient = useQueryClient();
  
  const { data: pendingAllocations = [] } = useQuery({
    queryKey: ['pending-allocations'],
    queryFn: fetchPendingAllocations,
  });

  const { data: availableItems = [] } = useQuery({
    queryKey: ['available-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'Available');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAllocateOpen,
  });

  const allocateMutation = useMutation({
    mutationFn: async () => {
      if (!allocationRequest || selectedItemIds.length === 0) return;

      const requestedQty = allocationRequest.quantity || 1;
      
      // Check if this is a transfer request
      const isTransferRequest = allocationRequest.itemName.includes('Transfer Request - Item ID:');
      
      if (isTransferRequest) {
        const itemIdMatch = allocationRequest.itemName.match(/Item ID: ([a-f0-9-]+)/);
        const originalItemId = itemIdMatch ? itemIdMatch[1] : null;
        
        if (originalItemId) {
          const { error: itemError } = await supabase
            .from('items')
            .update({ 
              current_custodian_id: allocationRequest.requesterId,
              owner_department_id: allocationRequest.requesterDepartmentId,
              status: 'Allocated',
              updated_at: new Date().toISOString()
            })
            .eq('id', originalItemId);

          if (itemError) throw itemError;
        }
      } else {
        // Validate quantity matches
        if (selectedItemIds.length !== requestedQty) {
          throw new Error(`Please select exactly ${requestedQty} item(s). Currently selected: ${selectedItemIds.length}`);
        }
        
        // Allocate all selected items
        for (const itemId of selectedItemIds) {
          const { error: itemError } = await supabase
            .from('items')
            .update({ 
              status: 'Allocated',
              current_custodian_id: allocationRequest.requesterId,
              owner_department_id: allocationRequest.requesterDepartmentId,
              updated_at: new Date().toISOString()
            })
            .eq('id', itemId);

          if (itemError) throw itemError;
        }
      }

      // Update request status
      const { error: reqError } = await supabase
        .from('item_requests')
        .update({ 
          status: 'approved',
          allocated_item_id: isTransferRequest ? null : selectedItemIds[0],
          storekeeper_allocator_id: profile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', allocationRequest.id);

      if (reqError) throw reqError;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedItemIds.length} item(s) allocated successfully`,
      });
      setIsAllocateOpen(false);
      setAllocationRequest(null);
      setSelectedItemIds([]);
      queryClient.invalidateQueries({ queryKey: ['pending-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['available-items'] });
      queryClient.invalidateQueries({ queryKey: ['items-registry'] });
    },
    onError: (error: any) => {
      console.error('Allocation error:', error);
      toast({
        title: "Allocation Failed",
        description: error.message || "Failed to allocate item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredItems = availableItems.filter(item => 
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.asset_tag.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleApprove = (id: string) => {
    const request = pendingAllocations.find(r => r.id === id);
    if (request) {
      setAllocationRequest(request);
      setSelectedItemIds([]);
      
      const isTransferRequest = request.itemName.includes('Transfer Request - Item ID:');
      if (isTransferRequest) {
        const itemIdMatch = request.itemName.match(/Item ID: ([a-f0-9-]+)/);
        if (itemIdMatch) {
          setSelectedItemIds([itemIdMatch[1]]);
        }
      } else {
        setItemSearch(request.itemName);
      }
      
      setIsAllocateOpen(true);
    }
  };

  const handleReject = (id: string) => {
    setSelectedRequest(id);
    setIsApprovalOpen(true);
  };

  const handleView = (id: string) => {
    const request = pendingAllocations.find(r => r.id === id);
    if (request) {
      setViewRequest(request);
      setIsViewOpen(true);
    }
  };

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Pending Allocations"
      pageSubtitle="Review and process item allocation requests"
    >
      <ApprovalQueueTable
        items={pendingAllocations}
        onApprove={handleApprove}
        onReject={handleReject}
        onView={handleView}
      />
      
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Review the full details of this allocation request.
            </DialogDescription>
          </DialogHeader>
          {viewRequest && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{viewRequest.itemName}</h3>
                <Badge variant={viewRequest.urgency === 'critical' ? 'destructive' : 'secondary'}>
                  {viewRequest.urgency.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{viewRequest.requesterName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{viewRequest.requesterDepartment}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{viewRequest.submittedAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Status: Pending Storekeeper</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <FileText className="h-4 w-4" />
                  Justification
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {viewRequest.justification || "No justification provided."}
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Dept. Head Approved
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Dean Approved
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Allocate Item</DialogTitle>
            <DialogDescription>
              Select an available item from inventory to allocate for this request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {allocationRequest && (
              <div className="p-3 bg-gray-50 border rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Requested: <span className="text-lg font-bold text-blue-600">{allocationRequest.quantity || 1}</span> item(s)
                  {selectedItemIds.length > 0 && (
                    <span className="ml-2 text-sm">| Selected: <span className="font-bold text-green-600">{selectedItemIds.length}</span></span>
                  )}
                </p>
              </div>
            )}
            {allocationRequest?.itemName.includes('Transfer Request - Item ID:') ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Transfer Request</h3>
                <p className="text-sm text-blue-700">
                  This is a transfer request. The item will be transferred to the new custodian.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Item ID: {allocationRequest.itemName.match(/Item ID: ([a-f0-9-]+)/)?.[1]}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search available items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="border rounded-md h-[300px] overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Package className="h-8 w-8 mb-2 opacity-50" />
                      <p>No available items found</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredItems.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                              isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                              } else {
                                setSelectedItemIds(prev => [...prev, item.id]);
                              }
                            }}
                          >
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">Tag: {item.asset_tag}</p>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllocateOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => allocateMutation.mutate()} 
              disabled={selectedItemIds.length === 0 || allocateMutation.isPending}
            >
              {allocateMutation.isPending ? 'Processing...' : (allocationRequest?.itemName.includes('Transfer Request') ? 'Confirm Transfer' : 'Confirm Allocation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRequest && (
        <ProcessApproval
          requestId={selectedRequest}
          requestType="item_request"
          currentStage="storekeeper"
          isOpen={isApprovalOpen}
          onClose={() => {
            setIsApprovalOpen(false);
            setSelectedRequest(null);
            queryClient.invalidateQueries({ queryKey: ['pending-allocations'] });
          }}
        />
      )}
    </DashboardLayout>
  );
}