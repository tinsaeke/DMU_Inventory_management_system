import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "lucide-react";
import {
  getItemsByDepartment,
  allocateItem,
  type ItemWithDetails,
} from "@/lib/itemManagement";
import { supabase } from "@/integrations/supabase/client";
import { Pagination } from "@/components/shared/Pagination";
import { useState } from "react";

export default function DepartmentItemsPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: departmentItems, isLoading, error } = useQuery({
    queryKey: ["department-items", profile?.department_id, currentPage, pageSize],
    queryFn: async () => {
      console.log('=== Department Items Query ===');
      console.log('Department ID:', profile?.department_id);
      console.log('Page:', currentPage, 'Size:', pageSize);
      
      if (!profile?.department_id) {
        console.log('No department ID found');
        return { items: [], count: 0 };
      }
      
      try {
        const result = await getItemsByDepartment(
          profile.department_id,
          currentPage,
          pageSize
        );
        console.log('Query result:', result);
        console.log('Items:', result.data?.length, 'Total count:', result.count);
        return { items: result.data, count: result.count };
      } catch (err) {
        console.error('Query error:', err);
        throw err;
      }
    },
    enabled: !!profile?.department_id,
  });

  console.log('Component state:', { 
    isLoading, 
    error, 
    itemsCount: departmentItems?.items?.length,
    totalCount: departmentItems?.count 
  });

  const { data: departmentStaff = [] } = useQuery({
    queryKey: ["department-staff", profile?.department_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("department_id", profile?.department_id)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.department_id,
  });

  const assignItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      custodianId,
    }: {
      itemId: string;
      custodianId: string | null;
    }) => {
      if (custodianId) {
        await allocateItem(itemId, custodianId);
      } else {
        const { error } = await supabase
          .from("items")
          .update({ current_custodian_id: null, status: "Available" })
          .eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-items"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "default";
      case "Allocated":
        return "secondary";
      case "Under Maintenance":
        return "destructive";
      case "Damaged":
        return "outline";
      default:
        return "default";
    }
  };

  const totalItems = departmentItems?.count ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardLayout
      role="department_head"
      userName={profile?.full_name || user?.email || "Department Head"}
      userEmail={user?.email || ""}
      pageTitle="Department Items"
      pageSubtitle="View and manage department inventory"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Department Inventory ({totalItems} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading items...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentItems?.items?.map((item: ItemWithDetails) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 font-medium text-sm">
                        {item.name}
                      </td>
                      <td className="px-2 py-1 text-sm">
                        {item.item_categories?.name || "N/A"}
                      </td>
                      <td className="px-2 py-1">
                        <Badge
                          variant={getStatusColor(item.status)}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-1">
                        <Select
                          value={item.current_custodian_id || "unassigned"}
                          onValueChange={(value) => {
                            const custodianId =
                              value === "unassigned" ? null : value;
                            assignItemMutation.mutate({
                              itemId: item.id,
                              custodianId,
                            });
                          }}
                        >
                          <SelectTrigger className="w-32 h-7 text-xs">
                            <SelectValue
                              placeholder={
                                item.current_custodian?.full_name ||
                                "Unassigned"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              Unassigned
                            </SelectItem>
                            {departmentStaff.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1 font-mono text-xs">
                        {item.serial_number}
                      </td>
                    </tr>
                  ))}
                  {totalItems === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-4 text-center text-muted-foreground"
                      >
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}