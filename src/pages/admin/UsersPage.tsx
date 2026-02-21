import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ManageUsers from "@/components/admin/ManageUsers";
import { useAuth } from "@/hooks/use-auth";

export default function UsersPage() {
  const { profile, user } = useAuth();

  return (
    <DashboardLayout
      role="admin"
      userName={profile?.full_name || user?.email || "Admin"}
      userEmail={user?.email || ""}
      pageTitle="User Management"
      pageSubtitle="Manage system users and their roles"
    >
      <ManageUsers />
    </DashboardLayout>
  );
}