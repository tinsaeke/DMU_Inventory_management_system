import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Building2, PlusCircle, MoreHorizontal, Edit as EditIcon } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const collegeSchema = z.object({
  id: z.string().optional(), // Added for update operations
  name: z.string().min(3, 'College name must be at least 3 characters long'),
});

type College = {
  id: string;
  name: string;
  created_at: string;
};

const fetchColleges = async () => {
  const { data, error } = await supabase.from('colleges').select('*').order('name');
  if (error) throw new Error(error.message);
  return data;
};

export default function ManageColleges() {
  const [isNewCollegeDialogOpen, setIsNewCollegeDialogOpen] = useState(false);
  const [isEditCollegeDialogOpen, setIsEditCollegeDialogOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const queryClient = useQueryClient();

  const { data: colleges, isLoading } = useQuery<College[]>({
    queryKey: ['colleges'],
    queryFn: fetchColleges,
  });

  const newCollegeForm = useForm<z.infer<typeof collegeSchema>>({
    resolver: zodResolver(collegeSchema),
    defaultValues: { name: '' },
  });

  const editCollegeForm = useForm<z.infer<typeof collegeSchema>>({
    resolver: zodResolver(collegeSchema),
    defaultValues: { id: '', name: '' },
  });

  useEffect(() => {
    if (selectedCollege) {
      editCollegeForm.reset({
        id: selectedCollege.id,
        name: selectedCollege.name,
      });
    }
  }, [selectedCollege, editCollegeForm]);

  const createCollegeMutation = useMutation({
    mutationFn: async (values: z.infer<typeof collegeSchema>) => {
      const { data, error } = await supabase.from('colleges').insert([{ name: values.name }]).select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
      toast({ title: 'Success', description: 'College created successfully.' });
      setIsNewCollegeDialogOpen(false);
      newCollegeForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCollegeMutation = useMutation({
    mutationFn: async (values: z.infer<typeof collegeSchema>) => {
      if (!values.id) throw new Error('College ID is missing for update.');
      const { data, error } = await supabase.from('colleges').update({ name: values.name }).eq('id', values.id).select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
      toast({ title: 'Success', description: 'College updated successfully.' });
      setIsEditCollegeDialogOpen(false);
      setSelectedCollege(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCollegeMutation = useMutation({
    mutationFn: async (collegeId: string) => {
      const { error } = await supabase.from('colleges').delete().eq('id', collegeId);
      if (error) throw new Error(error.message);
      return collegeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
      toast({ title: 'Success', description: 'College deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleDeleteCollege = (collegeId: string) => {
    if (confirm('Are you sure you want to delete this college?')) {
      deleteCollegeMutation.mutate(collegeId);
    }
  };

  const handleEditCollege = (college: College) => {
    setSelectedCollege(college);
    setIsEditCollegeDialogOpen(true);
  };

  const onNewCollegeSubmit = (values: z.infer<typeof collegeSchema>) => {
    createCollegeMutation.mutate(values);
  };

  const onEditCollegeSubmit = (values: z.infer<typeof collegeSchema>) => {
    updateCollegeMutation.mutate(values);
  };

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(colleges || [], 25);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Colleges</CardTitle>
        <Dialog open={isNewCollegeDialogOpen} onOpenChange={setIsNewCollegeDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New College
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New College</DialogTitle>
            </DialogHeader>
            <Form {...newCollegeForm}>
              <form onSubmit={newCollegeForm.handleSubmit(onNewCollegeSubmit)} className="space-y-4">
                <FormField
                  control={newCollegeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., College of Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createCollegeMutation.isPending}>
                    {createCollegeMutation.isPending ? 'Creating...' : 'Create College'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit College Dialog */}
        <Dialog 
          open={isEditCollegeDialogOpen} 
          onOpenChange={(open) => {
            setIsEditCollegeDialogOpen(open);
            if (!open) {
              setSelectedCollege(null);
              editCollegeForm.reset();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit College</DialogTitle>
            </DialogHeader>
            <Form {...editCollegeForm}>
              <form onSubmit={editCollegeForm.handleSubmit(onEditCollegeSubmit)} className="space-y-4">
                <FormField
                  control={editCollegeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateCollegeMutation.isPending}>
                    {updateCollegeMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College Name</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-center text-gray-500">
                    Loading colleges...
                  </td>
                </tr>
              ) : paginatedData.map((college) => (
                <tr key={college.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1 font-medium text-sm">{college.name}</td>
                  <td className="px-2 py-1 text-xs">{new Date(college.created_at).toLocaleDateString()}</td>
                  <td className="px-2 py-1 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCollege(college)}>
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteCollege(college.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!isLoading && (!colleges || colleges.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-2 py-4 text-center text-gray-500">
                    No colleges found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {colleges && colleges.length > 0 && (
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
