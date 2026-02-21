import { useQuery } from "@tanstack/react-query";
import DataService from "@/services/DataService";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataStatCard } from "@/components/ui/data-stat-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Building2,
  FolderTree,
  Package,
  UserPlus,
} from "lucide-react";
import ManageColleges from "@/components/admin/ManageColleges";
import ManageDepartments from "@/components/admin/ManageDepartments";
import ManageUsers from "@/components/admin/ManageUsers";
import { useAuth } from "@/hooks/use-auth";
import UsersPage from "@/pages/admin/UsersPage";
import CollegesPage from "@/pages/admin/CollegesPage";
import DepartmentsPage from "@/pages/admin/DepartmentsPage";
import RoleAssignmentPage from "@/pages/admin/RoleAssignmentPage";
import SystemSettingsPage from "@/pages/admin/SystemSettingsPage";
import DatabaseBackupPage from "@/pages/admin/DatabaseBackupPage";

function AdminDashboardHome() {
  const { profile, user } = useAuth();

  const { data: stats = {} } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => DataService.getDashboardStats('admin', profile?.id || '')
  });

  return (
    <DashboardLayout
      role="admin"
      userName={profile?.full_name || user?.email || "Admin"}
      userEmail={user?.email || ""}
      pageTitle="System Administration"
      pageSubtitle="Manage users, colleges, and system configuration"
      notificationCount={0}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataStatCard
            title="Total Users"
            value={stats.users || 0}
            subtitle="0 pending activation"
            icon={Users}
            variant="primary"
          />
          <DataStatCard
            title="Colleges"
            value={stats.colleges || 0}
            subtitle="All active"
            icon={Building2}
            variant="info"
          />
          <DataStatCard
            title="Departments"
            value={stats.departments || 0}
            subtitle="Across all colleges"
            icon={FolderTree}
            variant="success"
          />
          <DataStatCard
            title="Total Items"
            value={stats.items || 0}
            subtitle="In system registry"
            icon={Package}
            variant="default"
          />
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="colleges">
          <TabsList>
            <TabsTrigger value="colleges">
              <Building2 className="h-4 w-4 mr-2" />
              Colleges
            </TabsTrigger>
            <TabsTrigger value="departments">
              <FolderTree className="h-4 w-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>
          <TabsContent value="colleges" className="mt-4">
            <ManageColleges />
          </TabsContent>
          <TabsContent value="departments" className="mt-4">
            <ManageDepartments />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <ManageUsers />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <Routes>
      <Route index element={<AdminDashboardHome />} />
      <Route path="users" element={<UsersPage />} />
      <Route path="colleges" element={<CollegesPage />} />
      <Route path="departments" element={<DepartmentsPage />} />
      <Route path="roles" element={<RoleAssignmentPage />} />
      <Route path="settings" element={<SystemSettingsPage />} />
      <Route path="backup" element={<DatabaseBackupPage />} />
    </Routes>
  );
}

