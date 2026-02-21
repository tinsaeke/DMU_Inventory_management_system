import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function DeanTransfersPage() {
  const { profile, user } = useAuth();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['dean-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_transfers_with_emails');
      if (error) throw error;
      return data || [];
    }
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(transfers, 25);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout
      role="college_dean"
      userName={profile?.full_name || user?.email || "College Dean"}
      userEmail={user?.email || ""}
      pageTitle="Transfer Requests"
      pageSubtitle="Monitor item transfers across college departments"
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">
                      {transfer.item_name}
                      <div className="text-xs text-muted-foreground">
                        {transfer.asset_tag}
                      </div>
                    </TableCell>
                    <TableCell>{transfer.initiator_email}</TableCell>
                    <TableCell>{transfer.receiver_email}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(transfer.status)}>
                        {transfer.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}