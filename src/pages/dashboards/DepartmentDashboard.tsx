import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataStatCard } from "@/components/ui/data-stat-card";
import { Button } from "@/components/ui/button";
import { Users, Package, ClipboardList, ArrowLeftRight, UserPlus, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import CreateItemRequest from "@/components/staff/CreateItemRequest";
import DepartmentApprovalsPage from "@/pages/department/DepartmentApprovalsPage";
import DepartmentStaffPage from "@/pages/department/DepartmentStaffPage";
import DepartmentItemsPage from "@/pages/department/DepartmentItemsPage";
import DepartmentRequestsPage from "@/pages/department/DepartmentRequestsPage";
import DepartmentTransfersPage from "@/pages/department/DepartmentTransfersPage";
import DepartmentReportsPage from "@/pages/department/DepartmentReportsPage";
import DepartmentNotificationsPage from "@/pages/department/DepartmentNotificationsPage";
import DepartmentMyItemsPage from "@/pages/department/DepartmentMyItemsPage";
import DepartmentTransferApprovalsPage from "@/pages/department/DepartmentTransferApprovalsPage";
import DepartmentTransferPage from "@/pages/department/DepartmentTransferPage";
import IncomingTransfersPage from "@/pages/staff/IncomingTransfersPage";

function DepartmentDashboardHome() {
  const { profile, user } = useAuth();

  const { data: pendingApprovalsData = [] } = useQuery({
    queryKey: ['department-pending-approvals', profile?.department_id],
    queryFn: async () => {
      console.log('Dashboard - Checking pending approvals for department:', profile?.department_id);
      
      // Get requests that need department head approval
      const { data: requests, error } = await supabase
        .from('item_requests')
        .select(`
          *,
          requester:profiles!requester_id(full_name, department_id)
        `)
        .eq('status', 'pending_dept_head')
        .eq('requester_department_id', profile?.department_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
      
      console.log('Department requests needing approval:', requests?.length || 0);
      
      return requests || [];
    },
    enabled: !!profile?.department_id,
    refetchInterval: 10000
  });

  const pendingApprovals = (() => {
    if (Array.isArray(pendingApprovalsData)) {
      return pendingApprovalsData.length;
    }
    return 0;
  })();

  const { data: staffCountRaw = 0 } = useQuery({
    queryKey: ['department-staff-count', profile?.department_id],
    queryFn: async () => {
      const { count } = await supabase.from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', profile?.department_id);
      return Number(count) || 0;
    },
    enabled: !!profile?.department_id
  });
  const staffCount = typeof staffCountRaw === 'number' ? staffCountRaw : 0;

  const { data: itemCountRaw = 0 } = useQuery({
    queryKey: ['department-item-count', profile?.department_id],
    queryFn: async () => {
      const { count } = await supabase.from('items')
        .select('*', { count: 'exact', head: true })
        .eq('owner_department_id', profile?.department_id);
      return Number(count) || 0;
    },
    enabled: !!profile?.department_id
  });
  const itemCount = typeof itemCountRaw === 'number' ? itemCountRaw : 0;

  const { data: requestCountRaw = 0 } = useQuery({
    queryKey: ['department-request-count', profile?.department_id],
    queryFn: async () => {
      const { data: requests1 } = await supabase
        .from('item_requests')
        .select('id')
        .eq('requester_department_id', profile?.department_id);
      
      return Number(requests1?.length) || 0;
    },
    enabled: !!profile?.department_id
  });
  const requestCount = typeof requestCountRaw === 'number' ? requestCountRaw : 0;

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      departmentName={profile?.departments?.name}
      pageTitle="Department Management"
      pageSubtitle="Manage department staff, items, and approval workflows"
      notificationCount={pendingApprovals}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataStatCard
            title="Pending Approvals"
            value={pendingApprovals}
            subtitle="Awaiting your review"
            icon={ClipboardList}
            variant="primary"
          />
          <DataStatCard
            title="Department Staff"
            value={staffCount}
            subtitle="Active members"
            icon={Users}
            variant="info"
          />
          <DataStatCard
            title="Department Items"
            value={itemCount}
            subtitle="Total inventory"
            icon={Package}
            variant="success"
          />
          <DataStatCard
            title="Total Requests"
            value={requestCount}
            subtitle="All time"
            icon={ArrowLeftRight}
            variant="default"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DepartmentDashboard() {
  return (
    <Routes>
      <Route index element={<DepartmentDashboardHome />} />
      <Route path="my-items" element={<DepartmentMyItemsPage />} />
      <Route path="approvals" element={<DepartmentApprovalsPage />} />
      <Route path="transfer-approvals" element={<DepartmentTransferApprovalsPage />} />
      <Route path="staff" element={<DepartmentStaffPage />} />
      <Route path="items" element={<DepartmentItemsPage />} />
      <Route path="requests" element={<DepartmentRequestsPage />} />
      <Route path="transfer" element={<DepartmentTransferPage />} />
      <Route path="incoming-transfers" element={<IncomingTransfersPage />} />
      <Route path="transfers" element={<DepartmentTransfersPage />} />
      <Route path="reports" element={<DepartmentReportsPage />} />
      <Route path="notifications" element={<DepartmentNotificationsPage />} />
    </Routes>
  );
}