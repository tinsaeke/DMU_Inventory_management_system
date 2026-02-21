import { useState, useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { FolderTree, PlusCircle, MoreHorizontal, Edit as EditIcon } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const departmentSchema = z.object({
  id: z.string().optional(), // Added for update operations
  name: z.string().min(3, 'Department name must be at least 3 characters long'),
  college_id: z.string().uuid('Please select a college'),
});

type College = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
  created_at: string;
  colleges: { name: string } | null;
};

const fetchDepartments = async () => {
  const { data, error } = await supabase.from('departments').select('*, colleges(name)').order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchColleges = async () => {
  const { data, error } = await supabase.from('colleges').select('id, name').order('name');
  if (error) throw new Error(error.message);
  return data;
};

export default function ManageDepartments() {
  const [isNewDepartmentDialogOpen, setIsNewDepartmentDialogOpen] = useState(false);
  const [isEditDepartmentDialogOpen, setIsEditDepartmentDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const queryClient = useQueryClient();

  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const { data: colleges, isLoading: isLoadingColleges } = useQuery<College[]>({
    queryKey: ['colleges'],
    queryFn: fetchColleges,
  });

  const newDepartmentForm = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', college_id: '' },
  });

  const editDepartmentForm = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { id: '', name: '', college_id: '' },
  });

  useEffect(() => {
    if (selectedDepartment) {
      editDepartmentForm.reset({
        id: selectedDepartment.id,
        name: selectedDepartment.name,
        college_id: selectedDepartment.colleges ? selectedDepartment.college_id || '' : '', // Ensure college_id is set
      });
    }
  }, [selectedDepartment, editDepartmentForm]);
  
  const createDepartmentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof departmentSchema>) => {
      const { data, error } = await supabase.from('departments').insert([values]).select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Success', description: 'Department created successfully.' });
      setIsNewDepartmentDialogOpen(false);
      newDepartmentForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof departmentSchema>) => {
      if (!values.id) throw new Error('Department ID is missing for update.');
      const { data, error } = await supabase.from('departments').update({ name: values.name, college_id: values.college_id }).eq('id', values.id).select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Success', description: 'Department updated successfully.' });
      setIsEditDepartmentDialogOpen(false);
      setSelectedDepartment(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', departmentId);
      if (error) throw new Error(error.message);
      return departmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({ title: 'Success', description: 'Department deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleDeleteDepartment = (departmentId: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditDepartmentDialogOpen(true);
  };

  const onNewDepartmentSubmit = (values: z.infer<typeof departmentSchema>) => {
    createDepartmentMutation.mutate(values);
  };

  const onEditDepartmentSubmit = (values: z.infer<typeof departmentSchema>) => {
    updateDepartmentMutation.mutate(values);
  };

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(departments || [], 25);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Departments</CardTitle>
        <Dialog open={isNewDepartmentDialogOpen} onOpenChange={setIsNewDepartmentDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={isLoadingColleges}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Department</DialogTitle>
            </DialogHeader>
            <Form {...newDepartmentForm}>
              <form onSubmit={newDepartmentForm.handleSubmit(onNewDepartmentSubmit)} className="space-y-4">
                <FormField
                  control={newDepartmentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newDepartmentForm.control}
                  name="college_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges?.map(college => (
                            <SelectItem key={college.id} value={college.id}>{college.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createDepartmentMutation.isPending}>
                    {createDepartmentMutation.isPending ? 'Creating...' : 'Create Department'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Department Dialog */}
        <Dialog 
          open={isEditDepartmentDialogOpen} 
          onOpenChange={(open) => {
            setIsEditDepartmentDialogOpen(open);
            if (!open) {
              setSelectedDepartment(null);
              editDepartmentForm.reset();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <Form {...editDepartmentForm}>
              <form onSubmit={editDepartmentForm.handleSubmit(onEditDepartmentSubmit)} className="space-y-4">
                <FormField
                  control={editDepartmentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editDepartmentForm.control}
                  name="college_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a college" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colleges?.map(college => (
                            <SelectItem key={college.id} value={college.id}>{college.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateDepartmentMutation.isPending}>
                    {updateDepartmentMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Name</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingDepartments ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                    Loading departments...
                  </td>
                </tr>
              ) : paginatedData.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 font-medium text-sm">{dept.name}</td>
                  <td className="px-2 py-1 text-sm">{dept.colleges?.name || 'N/A'}</td>
                  <td className="px-2 py-1 text-xs">{new Date(dept.created_at).toLocaleDateString()}</td>
                  <td className="px-2 py-1 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditDepartment(dept)}>
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteDepartment(dept.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!isLoadingDepartments && (!departments || departments.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {departments && departments.length > 0 && (
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
      </CardContent>
    </Card>
  );
}
