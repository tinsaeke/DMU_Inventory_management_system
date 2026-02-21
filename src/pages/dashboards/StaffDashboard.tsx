import { useNavigate, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataStatCard } from "@/components/ui/data-stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApprovalWorkflow } from "@/components/ui/approval-workflow";
import { Button } from "@/components/ui/button";
import CreateItemRequest from "@/components/staff/CreateItemRequest";
import CreateTransferRequest from "@/components/staff/CreateTransferRequest";
import CreateMaintenanceRequest from "@/components/staff/CreateMaintenanceRequest";
import MyItemsPage from "@/pages/staff/MyItemsPage";
import RequestItemPage from "@/pages/staff/RequestItemPage";
import StaffTransferPage from "@/pages/staff/StaffTransferPage";
import StaffRequestsPage from "@/pages/staff/StaffRequestsPage";
import StaffNotificationsPage from "@/pages/staff/StaffNotificationsPage";
import IncomingTransfersPage from "@/pages/staff/IncomingTransfersPage";
import StaffTransferHistoryPage from "@/pages/staff/StaffTransferHistoryPage";
import {
  Package,
  ClipboardList,
  ArrowLeftRight,
  Clock,
  Eye,
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

const fetchMyItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, asset_tag, status, created_at, item_categories(name)')
    .eq('current_custodian_id', userId);
  if (error) throw new Error(error.message);
  return data;
};

const fetchMyRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('item_requests')
    .select('*')
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

function StaffDashboardHome() {
  const { profile, user } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate
  
  const { data: myItems = [] } = useQuery({
    queryKey: ['my-items', profile?.id],
    queryFn: () => fetchMyItems(profile?.id || ''),
    enabled: !!profile?.id,
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-requests', profile?.id],
    queryFn: () => fetchMyRequests(profile?.id || ''),
    enabled: !!profile?.id,
  });

  const activeRequests = (myRequests || []).filter(r => r.status !== 'approved' && r.status !== 'rejected');
  const completedThisMonth = (myRequests || []).filter(r => {
    if (!r.created_at) return false;
    const requestDate = new Date(r.created_at);
    const now = new Date();
    return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear();
  });

  return (
    <DashboardLayout
      role="staff"
      userName={profile?.full_name || user?.email || "Staff Member"}
      userEmail={user?.email || ""}
      departmentName={profile?.departments?.name ?? 'Not Available'}
      pageTitle="My Dashboard"
      pageSubtitle="View your assigned items and requests"
      notificationCount={0}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataStatCard
            title="My Items"
            value={(myItems || []).length}
            subtitle="Currently assigned to you"
            icon={Package}
            variant="primary"
          />
          <DataStatCard
            title="Active Requests"
            value={activeRequests.length}
            subtitle="Awaiting approval"
            icon={ClipboardList}
            variant="warning"
          />
          <DataStatCard
            title="Pending Transfers"
            value={0}
            subtitle="No transfers pending"
            icon={ArrowLeftRight}
            variant="default"
          />
          <DataStatCard
            title="Completed This Month"
            value={completedThisMonth.length}
            subtitle="Requests processed"
            icon={Clock}
            variant="success"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Actions removed from dashboard */}
        </div>

        {/* My Items */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">My Assigned Items</h3>
              <p className="text-xs text-muted-foreground">Items currently in your custody</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(myItems || []).slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {item.asset_tag}
                      </span>
                    </td>
                    <td className="font-medium">{item.name}</td>
                    <td className="text-muted-foreground">{item.item_categories?.name || 'N/A'}</td>
                    <td>
                      <StatusBadge status={item.status?.toLowerCase() ?? 'unknown'} variant="status" size="sm" />
                    </td>
                    <td className="text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/staff/items/${item.id}`)} // Added onClick handler
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(myItems || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No items assigned to you yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function StaffDashboard() {
  return (
    <Routes>
      <Route index element={<StaffDashboardHome />} />
      <Route path="items" element={<MyItemsPage />} />
      <Route path="request" element={<RequestItemPage />} />
      <Route path="requests" element={<StaffRequestsPage />} />
      <Route path="transfer" element={<StaffTransferPage />} />
      <Route path="incoming-transfers" element={<IncomingTransfersPage />} />
      <Route path="transfer-history" element={<StaffTransferHistoryPage />} />
      <Route path="notifications" element={<StaffNotificationsPage />} />
    </Routes>
  );
}
