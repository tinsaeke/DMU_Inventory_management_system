import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function DepartmentRequestsPage() {
  const { profile, user } = useAuth();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['department-request-count', profile?.department_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_requests')
        .select(`
          *,
          requester:profiles!requester_id(full_name)
        `)
        .eq('requester_department_id', profile?.department_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.department_id,
    refetchInterval: 30000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_dept_head': return 'destructive';
      case 'pending_dean': return 'secondary';
      case 'pending_storekeeper': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'outline';
      default: return 'secondary';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'outline';
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
  } = usePagination(requests, 25);

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      pageTitle="Item Requests"
      pageSubtitle="View all department item requests"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Department Requests ({Array.isArray(requests) ? requests.length : 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading requests...</p>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(paginatedData) && paginatedData.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-sm font-medium">{request.requester?.full_name || 'Unknown'}</td>
                    <td className="px-2 py-1 text-sm">{request.item_name}</td>
                    <td className="px-2 py-1 text-sm">{request.quantity}</td>
                    <td className="px-2 py-1">
                      <Badge variant={getUrgencyColor(request.urgency)} className="text-xs">
                        {request.urgency?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-2 py-1">
                      <Badge variant={getStatusColor(request.status)} className="text-xs">
                        {request.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-2 py-1 text-xs">{new Date(request.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(!Array.isArray(requests) || requests.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                      No requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {Array.isArray(requests) && requests.length > 0 && (
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
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}