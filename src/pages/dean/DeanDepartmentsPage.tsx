import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FolderTree } from "lucide-react";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function DeanDepartmentsPage() {
  const { profile, user } = useAuth();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['dean-departments', profile?.college_id],
    queryFn: async () => {
      if (!profile?.college_id) return [];
      
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select(`*`)
        .eq('college_id', profile.college_id)
        .neq('name', 'Store Department')
        .order('name');

      if (deptsError) throw deptsError;
      if (!depts) return [];

      const deptIds = depts.map(d => d.id);
      
      // Get department heads
      const { data: heads, error: headsError } = await supabase
        .from('profiles')
        .select('full_name, department_id')
        .in('department_id', deptIds)
        .eq('role', 'department_head');

      if(headsError) throw headsError;

      // Get staff counts for each department
      const { data: staffCounts, error: staffError } = await supabase
        .from('profiles')
        .select('department_id')
        .in('department_id', deptIds);

      if(staffError) throw staffError;

      // Get item counts for each department
      const { data: itemCounts, error: itemError } = await supabase
        .from('items')
        .select('owner_department_id')
        .in('owner_department_id', deptIds);

      if(itemError) throw itemError;

      return depts.map(dept => {
        const head = heads?.find(h => h.department_id === dept.id);
        const staffCount = staffCounts?.filter(s => s.department_id === dept.id).length || 0;
        const itemCount = itemCounts?.filter(i => i.owner_department_id === dept.id).length || 0;
        
        return {
          ...dept,
          head: head ? { full_name: head.full_name } : null,
          staffCount,
          itemCount
        }
      });
    },
    enabled: !!profile?.college_id
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(departments, 25);

  return (
    <DashboardLayout
      role="college_dean"
      userName={profile?.full_name || user?.email || "College Dean"}
      userEmail={user?.email || ""}
      pageTitle="College Departments"
      pageSubtitle="Manage departments under your college"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Departments ({departments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Name</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Head</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Count</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                      Loading departments...
                    </td>
                  </tr>
                ) : paginatedData?.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 font-medium text-sm">{dept.name}</td>
                    <td className="px-2 py-1 text-sm">{dept.head?.full_name || 'Not Assigned'}</td>
                    <td className="px-2 py-1 text-sm">{dept.staffCount}</td>
                    <td className="px-2 py-1 text-sm">{dept.itemCount}</td>
                    <td className="px-2 py-1 text-xs">{new Date(dept.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!isLoading && (!departments || departments.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                      No departments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {departments.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}