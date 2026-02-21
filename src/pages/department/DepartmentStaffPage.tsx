import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function DepartmentStaffPage() {
  const { profile, user } = useAuth();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['department-staff', profile?.department_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('department_id', profile?.department_id)
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.department_id,
    refetchInterval: 30000
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'department_head': return 'default';
      case 'staff': return 'secondary';
      case 'storekeeper': return 'outline';
      default: return 'secondary';
    }
  };

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(staff || [], 25);

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      pageTitle="Department Staff"
      pageSubtitle="Manage department staff members"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Members ({staff?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-2 py-4 text-center text-gray-500">
                      Loading staff...
                    </td>
                  </tr>
                ) : paginatedData.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 font-medium text-sm">{member.full_name}</td>
                    <td className="px-2 py-1">
                      <Badge variant={getRoleColor(member.role)} className="text-xs">
                        {member.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-2 py-1 text-xs">{new Date(member.created_at || member.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!isLoading && (!staff || staff.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-2 py-4 text-center text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {staff && staff.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}