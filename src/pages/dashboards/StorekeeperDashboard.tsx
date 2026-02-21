import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataStatCard } from "@/components/ui/data-stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import ProcessApproval from "@/components/shared/ProcessApproval";
import ExportReport from "@/components/shared/ExportReport";
import { AddItemDialog } from "@/components/shared/AddItemDialog";
import InventoryPage from "@/pages/storekeeper/InventoryPage";
import AllocationsPage from "@/pages/storekeeper/AllocationsPage";
import ItemRegistryPage from "@/pages/storekeeper/ItemRegistryPage";
import DistributionLogPage from "@/pages/storekeeper/DistributionLogPage";
import TransferApprovalsPage from "@/pages/storekeeper/TransferApprovalsPage";
import StorekeeperTransferHistoryPage from "@/pages/storekeeper/StorekeeperTransferHistoryPage";
import ReportsPage from "@/pages/storekeeper/ReportsPage";
import NotificationsPage from "@/pages/storekeeper/NotificationsPage";
import ReturnRequestsPage from "@/pages/storekeeper/ReturnRequestsPage";
import {
  Warehouse,
  Package,
  FileCheck,
  ArrowLeftRight,
  AlertTriangle,
  Plus,
  Check,
  Eye,
} from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { DataService } from '@/services/DataService';

const fetchPendingApprovals = async () => {
  const { data, error } = await DataService.supabase
    .from('item_requests')
    .select(`
      id,
      item_name,
      quantity,
      urgency,
      created_at,
      profiles!requester_id(full_name)
    `)
    .eq('status', 'pending_storekeeper')
    .order('created_at', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data || [];
};

const fetchInventoryStats = async () => {
  return DataService.getInventoryStats();
};

const fetchNotificationCount = async (userId: string) => {
  const { data, error } = await DataService.supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
  return data?.length || 0;
};

function StorekeeperDashboardHome() {
  const { profile, user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: fetchPendingApprovals,
  });
  
  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: fetchInventoryStats,
  });
  
  const { data: notificationCount = 0 } = useQuery({
    queryKey: ['notification-count', profile?.id],
    queryFn: () => profile?.id ? fetchNotificationCount(profile.id) : 0,
    enabled: !!profile?.id,
  });
  
  const criticalRequests = pendingApprovals.filter(r => r.urgency === 'critical');
  const oldRequests = pendingApprovals.filter(r => {
    const daysDiff = Math.floor((new Date().getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 3;
  });

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await DataService.supabase
        .from('item_requests')
        .update({
          status: 'approved',
          storekeeper_allocator_id: profile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Store Management"
      pageSubtitle="Inventory control and item allocation"
      showSearch
      searchPlaceholder="Search items, asset tags..."
      headerActions={
        <div className="flex gap-2">
          <ExportReport reportType="inventory" />
          <Button size="sm" onClick={() => setIsAddItemOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      }
      notificationCount={notificationCount}
    >
      <div className="space-y-6">
        {/* Critical Alert */}
        {oldRequests.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {oldRequests.length} allocation{oldRequests.length > 1 ? 's' : ''} pending for 4+ days
              </p>
              <p className="text-xs text-muted-foreground">
                {criticalRequests.length > 0 ? 'Critical items urgently needed' : 'Items awaiting allocation'}
              </p>
            </div>
            <Button size="sm" variant="destructive">
              Review Now
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pendingApprovals.length > 0 && (
            <DataStatCard
              title="Pending Allocations"
              value={pendingApprovals.length}
              subtitle={`${criticalRequests.length} critical priority`}
              icon={FileCheck}
              variant="warning"
            />
          )}
          <DataStatCard
            title="Total Inventory"
            value={inventoryStats?.total || 0}
            subtitle="Across all categories"
            icon={Warehouse}
            variant="primary"
          />
          <DataStatCard
            title="Available Items"
            value={inventoryStats?.available || 0}
            subtitle="Ready for allocation"
            icon={Package}
            variant="success"
          />
          <DataStatCard
            title="Under Maintenance"
            value={inventoryStats?.maintenance || 0}
            subtitle="Items being serviced"
            icon={ArrowLeftRight}
            variant="info"
          />
        </div>

        {/* Recent Allocation Queue Preview */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Allocation Queue</h3>
              <p className="text-xs text-muted-foreground">Latest requests awaiting distribution</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {pendingApprovals.slice(0, 3).map((request) => {
              const daysSinceSubmission = Math.floor(
                (new Date().getTime() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={request.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {request.profiles?.full_name}
                        </span>
                        <StatusBadge status={request.urgency} variant="urgency" size="sm" />
                        {daysSinceSubmission > 3 && (
                          <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            {daysSinceSubmission} days waiting
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Request from user
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Item</p>
                          <p className="text-sm font-medium">{request.item_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="text-sm">{request.quantity}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {pendingApprovals.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No pending allocations
              </div>
            )}
          </div>
        </div>
      </div>
      
      {selectedRequest && (
        <ProcessApproval
          requestId={selectedRequest}
          requestType="item_request"
          currentStage="storekeeper"
          isOpen={isApprovalOpen}
          onClose={() => {
            setIsApprovalOpen(false);
            setSelectedRequest(null);
          }}
        />
      )}
      
      <AddItemDialog
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
          queryClient.invalidateQueries({ queryKey: ['items-registry'] });
        }}
      />
    </DashboardLayout>
  );
}

export default function StorekeeperDashboard() {
  return (
    <Routes>
      <Route index element={<StorekeeperDashboardHome />} />
      <Route path="inventory" element={<InventoryPage />} />
      <Route path="allocations" element={<AllocationsPage />} />
      <Route path="registry" element={<ItemRegistryPage />} />
      <Route path="distribution" element={<DistributionLogPage />} />
      <Route path="transfers" element={<TransferApprovalsPage />} />
      <Route path="transfer-history" element={<StorekeeperTransferHistoryPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="returns" element={<ReturnRequestsPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
    </Routes>
  );
}
