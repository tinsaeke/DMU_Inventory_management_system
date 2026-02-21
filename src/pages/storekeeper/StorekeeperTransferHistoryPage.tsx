import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function StorekeeperTransferHistoryPage() {
  const { profile, user } = useAuth();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['storekeeper-transfer-history'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_transfers_with_emails');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_storekeeper': return 'secondary';
      case 'pending_receiver_acceptance': return 'default';
      case 'completed': return 'outline';
      case 'rejected': return 'destructive';
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
  } = usePagination(transfers, 25);

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Transfer History"
      pageSubtitle="View all item transfer records"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Transfer History ({totalItems})
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
                  {paginatedData.map((transfer: any) => (
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
                        No transfer history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {transfers.length > 0 && (
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
