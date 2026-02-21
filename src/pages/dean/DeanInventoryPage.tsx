import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

export default function DeanInventoryPage() {
  const { profile, user } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['dean-inventory', profile?.college_id],
    queryFn: async () => {
      if (!profile?.college_id) return [];
      
      // First get all departments in this college (excluding Store Department)
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('college_id', profile.college_id)
        .neq('name', 'Store Department');
      
      if (deptError) throw deptError;
      if (!departments || departments.length === 0) return [];
      
      const departmentIds = departments.map(d => d.id);
      
      // Then get items owned by those departments
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles(full_name), departments(name), item_categories(name)')
        .in('owner_department_id', departmentIds)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
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
  } = usePagination(items, 25);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'default';
      case 'Allocated': return 'secondary';
      case 'Under Maintenance': return 'destructive';
      case 'Damaged': return 'outline';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout
      role="college_dean"
      userName={profile?.full_name || user?.email || "College Dean"}
      userEmail={user?.email || ""}
      pageTitle="College Inventory"
      pageSubtitle="Overview of all items across college departments"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            College Inventory ({items?.length || 0} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading inventory...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Purchase Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.item_categories?.name || 'N/A'}</TableCell>
                      <TableCell>{item.departments?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.profiles?.full_name || 'Unassigned'}</TableCell>
                      <TableCell className="font-mono text-sm">{item.serial_number}</TableCell>
                      <TableCell>{item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {items.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}