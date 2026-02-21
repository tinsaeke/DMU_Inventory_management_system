import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Users, PlusCircle, MoreHorizontal, Edit as EditIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchUserProfilesWithEmails, type UserProfile } from '@/lib/userProfiles';
import { user_role } from '@/lib/utils';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';

type Profile = UserProfile; // Add type alias for compatibility

const userSchema = z.object({
  id: z.string().optional(), // Added for update operations
  full_name: z.string().min(3, 'Full name is required'),
  // Email and password are not directly editable via profile update, but for creation they are.
  // For edit form, they won't be used, or password can be optional.
  email: z.string().email('Invalid email address').optional(), 
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')), // Optional for edit, empty string if not changing
  confirm_password: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'college_dean', 'department_head', 'storekeeper', 'staff']),
  college_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
})
.refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})
.refine(data => {
    if (!data.id) {
        return !!data.email;
    }
    return true;
}, {
    message: 'Email is required for new users',
    path: ['email'],
});

type College = { id: string; name: string };
type Department = { id: string; name: string; college_id: string };

// Fetching functions
const fetchColleges = async () => (await supabase.from('colleges').select('id, name')).data;
const fetchDepartments = async () => (await supabase.from('departments').select('id, name, college_id')).data;

export default function ManageUsers() {
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const newUserForm = useForm<z.infer<typeof userSchema>>({ 
    resolver: zodResolver(userSchema), 
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '', role: 'staff', college_id: null, department_id: null } 
  });
  const selectedCollegeIdNewUser = newUserForm.watch('college_id');

  const editUserForm = useForm<z.infer<typeof userSchema>>({ 
    resolver: zodResolver(userSchema), 
    defaultValues: { id: '', full_name: '', role: 'staff', college_id: null, department_id: null, password: '', confirm_password: '' } 
  });
  const selectedCollegeIdEditUser = editUserForm.watch('college_id');

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery<UserProfile[]>({ 
    queryKey: ['profiles'], 
    queryFn: fetchUserProfilesWithEmails 
  });
  const { data: colleges } = useQuery<College[] | null>({ queryKey: ['colleges'], queryFn: fetchColleges });
  const { data: departments } = useQuery<Department[] | null>({ queryKey: ['departments'], queryFn: fetchDepartments });
  
  const [filteredDepartmentsNewUser, setFilteredDepartmentsNewUser] = useState<Department[]>([]);
  const [filteredDepartmentsEditUser, setFilteredDepartmentsEditUser] = useState<Department[]>([]);

  useEffect(() => {
    if (selectedCollegeIdNewUser && departments) {
      setFilteredDepartmentsNewUser(departments.filter(d => d.college_id === selectedCollegeIdNewUser));
    } else {
      setFilteredDepartmentsNewUser([]);
    }
  }, [selectedCollegeIdNewUser, departments]);

  useEffect(() => {
    if (selectedCollegeIdEditUser && departments) {
      setFilteredDepartmentsEditUser(departments.filter(d => d.college_id === selectedCollegeIdEditUser));
    } else {
      setFilteredDepartmentsEditUser([]);
    }
  }, [selectedCollegeIdEditUser, departments]);

  useEffect(() => {
    if (selectedUser) {
      // Fetch the user's email from auth.users table
      const fetchUserEmail = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', selectedUser.id)
          .single();
        
        if (!error) {
          // Get email from auth metadata or use RPC function
          const { data: authData } = await supabase.rpc('get_user_email', { user_id: selectedUser.id });
          
          editUserForm.reset({
            id: selectedUser.id,
            full_name: selectedUser.full_name,
            email: authData || '',
            role: selectedUser.role,
            college_id: selectedUser.college_id,
            department_id: selectedUser.department_id,
            password: '',
            confirm_password: '',
          });
        }
      };
      
      fetchUserEmail();
    }
  }, [selectedUser, editUserForm]);

  const createUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof userSchema>) => {
      // Ensure password is not empty if creating a new user
      if (!values.password) {
        throw new Error('Password is required for new user creation.');
      }
      const { data, error } = await supabase.rpc('create_new_user', {
        user_email: values.email as string, // Cast as non-optional for new user creation
        user_password: values.password,
        user_full_name: values.full_name,
        user_role: values.role,
        user_college_id: values.college_id || null,
        user_department_id: values.department_id || null,
      });
      
      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message || 'Failed to create user');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create user');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Success', description: 'User created successfully.' });
      setIsNewUserDialogOpen(false);
      newUserForm.reset();
    },
    onError: (error) => {
      toast({ title: 'Error Creating User', description: error.message, variant: 'destructive' });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof userSchema>) => {
      if (!values.id) throw new Error('User ID is missing for update.');
      
      // Update email if provided
      if (values.email) {
        const { error: emailError } = await supabase.rpc('update_user_email', {
          user_id_input: values.id,
          new_email: values.email,
        });

        if (emailError) {
          throw new Error(`Email update failed: ${emailError.message}`);
        }
      }
      
      // If a new password is provided, update it
      if (values.password) {
        const { error: passwordError } = await supabase.rpc('update_user_password', {
          user_id_input: values.id,
          new_password: values.password,
        });

        if (passwordError) {
          throw new Error(`Password update failed: ${passwordError.message}`);
        }
      }

      const { error } = await supabase.from('profiles').update({ 
        full_name: values.full_name, 
        role: values.role, 
        college_id: values.college_id, 
        department_id: values.department_id 
      }).eq('id', values.id);
      if (error) throw new Error(error.message);
      return values;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Success', description: 'User updated successfully.' });
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({ title: 'Error Updating User', description: error.message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw new Error(error.message);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Success', description: 'User deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error Deleting User', description: error.message, variant: 'destructive' });
    },
  });

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setIsEditUserDialogOpen(true);
  };

  const onNewUserSubmit = (values: z.infer<typeof userSchema>) => createUserMutation.mutate(values);
  const onEditUserSubmit = (values: z.infer<typeof userSchema>) => updateUserMutation.mutate(values);

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Users</CardTitle>
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><PlusCircle className="h-4 w-4 mr-2" /> New User</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
            <DialogHeader><DialogTitle>Create a New User</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <Form {...newUserForm}>
                <form id="new-user-form" onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4">
                  <FormField control={newUserForm.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={newUserForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={newUserForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={newUserForm.control} name="confirm_password" render={({ field }) => (<FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={newUserForm.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {user_role.map(r => (
                            <SelectItem key={r} value={r}>
                              {r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={newUserForm.control} name="college_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        newUserForm.setValue('department_id', null); // Reset department when college changes
                      }} defaultValue={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign a college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges?.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {selectedCollegeIdNewUser && (
                    <FormField control={newUserForm.control} name="department_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredDepartmentsNewUser.map(d => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </form>
              </Form>
            </div>
            <DialogFooter>
              <Button type="submit" form="new-user-form" disabled={createUserMutation.isPending}>{createUserMutation.isPending ? 'Creating...' : 'Create User'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog 
          open={isEditUserDialogOpen} 
          onOpenChange={(open) => {
            setIsEditUserDialogOpen(open);
            if (!open) {
              setSelectedUser(null);
              editUserForm.reset();
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <Form {...editUserForm}>
                <form id="edit-user-form" onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
                  <FormField control={editUserForm.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editUserForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editUserForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editUserForm.control} name="confirm_password" render={({ field }) => (<FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={editUserForm.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {user_role.map(r => (
                            <SelectItem key={r} value={r}>
                              {r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editUserForm.control} name="college_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        editUserForm.setValue('department_id', null); // Reset department when college changes
                      }} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign a college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges?.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {selectedCollegeIdEditUser && (
                    <FormField control={editUserForm.control} name="department_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredDepartmentsEditUser.map(d => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </form>
              </Form>
            </div>
            <DialogFooter>
              <Button type="submit" form="edit-user-form" disabled={updateUserMutation.isPending}>{updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardHeader>
      <CardContent>
        {isLoadingProfiles ? <p>Loading users...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 font-medium text-xs">{p.full_name}</td>
                    <td className="px-2 py-1 text-xs">{p.email || 'N/A'}</td>
                    <td className="px-2 py-1 text-xs">{p.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="px-2 py-1 text-xs">{p.colleges?.name || 'N/A'}</td>
                    <td className="px-2 py-1 text-xs">{p.departments?.name || 'N/A'}</td>
                    <td className="px-2 py-1 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(p)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDeleteUser(p.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        )}
      </CardContent>
    </Card>
  );
}
