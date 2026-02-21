import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataStatCard } from "@/components/ui/data-stat-card";
import { Button } from "@/components/ui/button";
import { FileCheck, FolderTree, Package, ArrowLeftRight, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DeanApprovalsPage from "@/pages/dean/DeanApprovalsPage";
import DeanDepartmentsPage from "@/pages/dean/DeanDepartmentsPage";
import DeanInventoryPage from "@/pages/dean/DeanInventoryPage";
import DeanTransfersPage from "@/pages/dean/DeanTransfersPage";
import DeanReportsPage from "@/pages/dean/DeanReportsPage";
import DeanNotificationsPage from "@/pages/dean/DeanNotificationsPage";
import IncomingTransfersPage from "@/pages/staff/IncomingTransfersPage";

function DeanDashboardHome() {
  const { profile, user } = useAuth();

  const { data: pendingApprovalsRaw = 0 } = useQuery({
    queryKey: ['dean-pending-approvals-count', profile?.college_id],
    queryFn: async () => {
      if (!profile?.college_id) return 0;
      
      // First get all departments in this college
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('college_id', profile.college_id);
      
      if (deptError) throw deptError;
      if (!departments || departments.length === 0) return 0;
      
      const departmentIds = departments.map(d => d.id);
      
      // Then count requests from those departments
      const { count } = await supabase
        .from('item_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_dean')
        .in('requester_department_id', departmentIds);
        
      return Number(count) || 0;
    },
    enabled: !!profile?.college_id
  });
  const pendingApprovals = typeof pendingApprovalsRaw === 'number' ? pendingApprovalsRaw : 0;

  const { data: departmentCountRaw = 0 } = useQuery({
    queryKey: ['college-departments', profile?.college_id],
    queryFn: async () => {
      const { count } = await supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', profile?.college_id);
      return Number(count) || 0;
    },
    enabled: !!profile?.college_id
  });
  const departmentCount = typeof departmentCountRaw === 'number' ? departmentCountRaw : 0;

  const { data: itemCountRaw = 0 } = useQuery({
    queryKey: ['college-items', profile?.college_id],
    queryFn: async () => {
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .eq('college_id', profile?.college_id);
      
      if (!departments || departments.length === 0) return 0;
      
      const departmentIds = departments.map(d => d.id);
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .in('owner_department_id', departmentIds);
      
      return Number(count) || 0;
    },
    enabled: !!profile?.college_id
  });
  const itemCount = typeof itemCountRaw === 'number' ? itemCountRaw : 0;

  return (
    <DashboardLayout
      role="college_dean"
      userName={profile?.full_name || user?.email || "College Dean"}
      userEmail={user?.email || ""}
      pageTitle="College Administration"
      pageSubtitle="Manage college departments, approvals, and inventory oversight"
      notificationCount={pendingApprovals}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataStatCard
            title="Pending Approvals"
            value={pendingApprovals}
            subtitle="Awaiting dean approval"
            icon={FileCheck}
            variant="primary"
          />
          <DataStatCard
            title="Departments"
            value={departmentCount}
            subtitle="Under college"
            icon={FolderTree}
            variant="info"
          />
          <DataStatCard
            title="College Items"
            value={itemCount}
            subtitle="Total inventory"
            icon={Package}
            variant="success"
          />
          <DataStatCard
            title="Transfer Requests"
            value={0}
            subtitle="Pending transfers"
            icon={ArrowLeftRight}
            variant="default"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function DeanDashboard() {
  return (
    <Routes>
      <Route index element={<DeanDashboardHome />} />
      <Route path="approvals" element={<DeanApprovalsPage />} />
      <Route path="departments" element={<DeanDepartmentsPage />} />
      <Route path="inventory" element={<DeanInventoryPage />} />
      <Route path="transfers" element={<DeanTransfersPage />} />
      <Route path="incoming-transfers" element={<IncomingTransfersPage />} />
      <Route path="reports" element={<DeanReportsPage />} />
      <Route path="notifications" element={<DeanNotificationsPage />} />
    </Routes>
  );
}