import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ManageDepartments from "@/components/admin/ManageDepartments";
import { useAuth } from "@/hooks/use-auth";

export default function DepartmentsPage() {
  const { profile, user } = useAuth();

  return (
    <DashboardLayout
      role="admin"
      userName={profile?.full_name || user?.email || "Admin"}
      userEmail={user?.email || ""}
      pageTitle="Department Management"
      pageSubtitle="Manage university departments"
    >
      <ManageDepartments />
    </DashboardLayout>
  );
}