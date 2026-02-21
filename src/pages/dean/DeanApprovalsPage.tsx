import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ProcessApproval from "@/components/shared/ProcessApproval";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck } from "lucide-react";
import { useState } from "react";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function DeanApprovalsPage() {
  const { profile, user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['dean-pending-approvals-list', profile?.college_id],
    queryFn: async () => {
      if (!profile?.college_id) return [];
      
      console.log('Dean - Checking pending approvals for college:', profile?.college_id);
      
      // First get all departments in this college
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('college_id', profile.college_id);
      
      if (deptError) throw deptError;
      if (!departments || departments.length === 0) {
        console.log('No departments found for college:', profile.college_id);
        return [];
      }
      
      console.log('Found departments:', departments.map(d => d.id));
      const departmentIds = departments.map(d => d.id);
      
      // Then get requests from those departments
      const { data, error } = await supabase
        .from('item_requests')
        .select('id, created_at, requester_id, quantity, urgency, justification, item_name, departments(name)')
        .eq('status', 'pending_dean')
        .in('requester_department_id', departmentIds)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      console.log('Dean requests found:', data?.length || 0);
      return data || [];
    },
    enabled: !!profile?.college_id,
    refetchInterval: 10000
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(pendingRequests, 25);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout
      role="college_dean"
      userName={profile?.full_name || user?.email || "College Dean"}
      userEmail={user?.email || ""}
      pageTitle="Pending Approvals"
      pageSubtitle="Review requests forwarded by department heads"
      notificationCount={Array.isArray(pendingRequests) ? pendingRequests.length : 0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Dean Approvals ({Array.isArray(pendingRequests) ? pendingRequests.length : 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justification</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                      Loading pending requests...
                    </td>
                  </tr>
                ) : Array.isArray(paginatedData) && paginatedData.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 font-medium text-sm">{request.departments?.name}</td>
                    <td className="px-2 py-1 text-sm">{request.item_name}</td>
                    <td className="px-2 py-1 text-sm">{request.quantity}</td>
                    <td className="px-2 py-1">
                      <Badge variant={getUrgencyColor(request.urgency)} className="text-xs">
                        {request.urgency?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-2 py-1 text-xs max-w-32 truncate" title={request.justification}>{request.justification}</td>
                    <td className="px-2 py-1 text-xs">{new Date(request.created_at).toLocaleDateString()}</td>
                    <td className="px-2 py-1">
                      <Button 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={() => setSelectedRequest(request.id)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
                {(!Array.isArray(pendingRequests) || pendingRequests.length === 0) && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">
                      No pending requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pendingRequests.length > 0 && (
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

      {selectedRequest && (
        <ProcessApproval
          requestId={selectedRequest}
          requestType="item_request"
          currentStage="pending_dean"
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </DashboardLayout>
  );
}