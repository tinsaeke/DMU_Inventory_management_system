import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ExportReport from "@/components/shared/ExportReport";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function DeanReportsPage() {
  const { profile, user } = useAuth();

  return (
    <DashboardLayout
      role="college_dean"
      userName={profile?.full_name || user?.email || "College Dean"}
      userEmail={user?.email || ""}
      pageTitle="College Reports"
      pageSubtitle="Generate and export college-wide reports"
      notificationCount={0}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              College Inventory Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export complete college inventory across all departments.
            </p>
            <ExportReport 
              reportType="inventory" 
              filters={{ collegeId: profile?.college_id }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Approval Requests Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export all item requests processed at college level.
            </p>
            <ExportReport 
              reportType="requests" 
              filters={{ collegeId: profile?.college_id }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Transfer Activity Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export item transfer history across college departments.
            </p>
            <ExportReport 
              reportType="transfers" 
              filters={{ collegeId: profile?.college_id }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              College Audit Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export audit trail of all college-level activities.
            </p>
            <ExportReport 
              reportType="audit" 
              filters={{ collegeId: profile?.college_id }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}