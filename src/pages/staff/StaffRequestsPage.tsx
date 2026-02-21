import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function StaffRequestsPage() {
  const { profile, user } = useAuth();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['staff-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('item_requests')
        .select('*')
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.id,
    refetchInterval: 30000
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(requests, 25);

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    if (status.includes('pending')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout
      role="staff"
      userName={profile?.full_name || user?.email || "Staff Member"}
      userEmail={user?.email || ""}
      pageTitle="My Requests"
      pageSubtitle="Track all your item requests"
    >
      <Card>
        <CardHeader>
          <CardTitle>Request History ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justification</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                      Loading requests...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                      No requests found. Create your first request to get started.
                    </td>
                  </tr>
                ) : paginatedData.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-sm font-medium">{request.item_name || 'Item Request'}</td>
                    <td className="px-2 py-1 text-sm">{request.quantity}</td>
                    <td className="px-2 py-1">
                      <Badge className={`${getUrgencyColor(request.urgency)} text-xs`}>
                        {request.urgency?.toUpperCase() || 'LOW'}
                      </Badge>
                    </td>
                    <td className="px-2 py-1">
                      <Badge className={`${getStatusColor(request.status)} text-xs`}>
                        {request.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-2 py-1 text-xs">{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className="px-2 py-1 text-xs max-w-48 truncate" title={request.justification}>
                      {request.justification || 'No justification'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.length > 0 && (
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