import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";
import CreateTransferRequest from "@/components/staff/CreateTransferRequest";

export default function DepartmentTransferPage() {
  const { profile, user } = useAuth();

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      departmentName={profile?.departments?.name}
      pageTitle="Transfer Item"
      pageSubtitle="Request to transfer items to other staff members"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Item Transfer Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTransferRequest />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}