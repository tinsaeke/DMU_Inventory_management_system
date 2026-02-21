import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function DepartmentTransfersPage() {
  const { profile, user } = useAuth();

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['department-transfers', profile?.department_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_transfers_with_emails');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.department_id,
    refetchInterval: 30000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_receiver_acceptance': return 'secondary';
      case 'pending_dept_head_approval': return 'default';
      case 'pending_dean_approval': return 'default';
      case 'pending_storekeeper_approval': return 'default';
      case 'approved': return 'outline';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'destructive';
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
  } = usePagination(transfers || [], 25);

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      pageTitle="Item Transfers"
      pageSubtitle="Manage item transfers within department"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Transfer History ({transfers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading transfers...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 font-medium text-sm">
                        {transfer.item_name} ({transfer.asset_tag})
                      </td>
                      <td className="px-2 py-1 text-sm">{transfer.initiator_email || 'Unknown'}</td>
                      <td className="px-2 py-1 text-sm">{transfer.receiver_email || 'Unknown'}</td>
                      <td className="px-2 py-1">
                        <Badge variant={getStatusColor(transfer.status)} className="text-xs">
                          {transfer.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-2 py-1 text-xs">{new Date(transfer.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                        No transfers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {transfers && transfers.length > 0 && (
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