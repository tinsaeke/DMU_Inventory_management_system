import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ExportReport from "@/components/shared/ExportReport";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function DepartmentReportsPage() {
  const { profile, user } = useAuth();

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      pageTitle="Department Reports"
      pageSubtitle="Generate and export department reports"
      notificationCount={0}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Inventory Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export complete department inventory with current assignments and status.
            </p>
            <ExportReport 
              reportType="inventory" 
              filters={{ departmentId: profile?.department_id }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Requests Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all item requests from department staff with approval status.
            </p>
            <ExportReport 
              reportType="requests" 
              filters={{ departmentId: profile?.department_id }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Transfers Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export item transfer history within the department.
            </p>
            <ExportReport 
              reportType="transfers" 
              filters={{ departmentId: profile?.department_id }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Audit Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export audit trail of all department activities and changes.
            </p>
            <ExportReport 
              reportType="audit" 
              filters={{ departmentId: profile?.department_id }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}