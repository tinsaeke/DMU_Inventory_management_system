import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ManageColleges from "@/components/admin/ManageColleges";
import { useAuth } from "@/hooks/use-auth";

export default function CollegesPage() {
  const { profile, user } = useAuth();

  return (
    <DashboardLayout
      role="admin"
      userName={profile?.full_name || user?.email || "Admin"}
      userEmail={user?.email || ""}
      pageTitle="College Management"
      pageSubtitle="Manage university colleges"
    >
      <ManageColleges />
    </DashboardLayout>
  );
}