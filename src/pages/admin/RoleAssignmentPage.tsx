import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { fetchUserProfilesWithEmails, type UserProfile } from '@/lib/userProfiles';
import { user_role } from '@/lib/utils';
import * as z from 'zod';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

type Profile = {
  id: string;
  full_name: string;
  email?: string;
  role: 'admin' | 'college_dean' | 'department_head' | 'storekeeper' | 'staff';
};

const userRoleSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(user_role),
});



export default function RoleAssignmentPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['user_profiles'],
    queryFn: fetchUserProfilesWithEmails,
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: z.infer<typeof userRoleSchema>) => {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      toast({ title: 'Success', description: 'User role updated successfully.' });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(profiles || [], 25);

  return (
    <DashboardLayout
      role={profile?.role || "admin"} // Use actual profile role if available
      userName={profile?.full_name || user?.email || "Admin"}
      userEmail={user?.email || ""}
      pageTitle="Role Assignment"
      pageSubtitle="Manage user roles and permissions"
      notificationCount={0}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading user profiles...</p>}
          {error && <p className="text-destructive">Error loading user profiles: {error.message}</p>}
          {profiles && profiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 font-medium text-xs">{p.full_name}</td>
                      <td className="px-2 py-1 text-xs">{p.email}</td>
                      <td className="px-2 py-1">
                        <Select
                          value={p.role}
                          onValueChange={(newRole) => updateUserRoleMutation.mutate({ id: p.id, role: newRole as z.infer<typeof userRoleSchema>['role'] })}
                          disabled={updateUserRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-32 h-6 text-xs">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {user_role.map((roleOption) => (
                              <SelectItem key={roleOption} value={roleOption}>
                                {roleOption.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1 text-xs">
                        {/* Actions placeholder */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {profiles && profiles.length > 0 && (
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
          ) : (
            !isLoading && <p>No user profiles found.</p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}