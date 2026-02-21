import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeftRight } from 'lucide-react';

const transferSchema = z.object({
  item_id: z.string().uuid('Please select an item'),
  college_id: z.string().min(1, 'Please select a college'),
  department_id: z.string().min(1, 'Please select a department'),
  receiver_id: z.string().uuid('Please select a receiver'),
  reason: z.string().optional(),
});

type MyItem = { id: string; name: string; asset_tag: string; };
type College = { id: string; name: string; };
type Department = { id: string; name: string; college_id: string; };
type StaffMember = { id: string; full_name: string; department_id: string; };

const fetchMyItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, asset_tag')
    .eq('current_custodian_id', userId);
  if (error) throw new Error(error.message);
  return data;
};

const fetchColleges = async () => {
  const { data, error } = await supabase
    .from('colleges')
    .select('id, name')
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchDepartmentsByCollege = async (collegeId: string) => {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, college_id')
    .eq('college_id', collegeId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchStaffByDepartment = async (departmentId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, department_id')
    .eq('department_id', departmentId)
    .in('role', ['staff', 'department_head'])
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
};

export default function CreateTransferRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      item_id: '',
      college_id: '',
      department_id: '',
      receiver_id: '',
      reason: '',
    },
  });

  const { data: myItems } = useQuery<MyItem[]>({
    queryKey: ['my-items', profile?.id],
    queryFn: () => fetchMyItems(profile?.id || ''),
    enabled: !!profile?.id,
  });

  const selectedCollegeId = form.watch('college_id');
  const selectedDepartmentId = form.watch('department_id');

  const { data: colleges } = useQuery<College[]>({
    queryKey: ['colleges'],
    queryFn: fetchColleges,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments', selectedCollegeId],
    queryFn: () => fetchDepartmentsByCollege(selectedCollegeId),
    enabled: !!selectedCollegeId,
  });

  const { data: staffMembers } = useQuery<StaffMember[]>({
    queryKey: ['staff-members', selectedDepartmentId],
    queryFn: () => fetchStaffByDepartment(selectedDepartmentId),
    enabled: !!selectedDepartmentId,
  });

  const createTransferMutation = useMutation({
    mutationFn: async (values: z.infer<typeof transferSchema>) => {
      console.log('Submitting transfer with values:', values);
      const { college_id, department_id, ...transferData } = values;
      
      // First check if item_transfers table exists, if not create a simple transfer record
      const { data, error } = await supabase
        .from('item_transfers')
        .insert([{
          item_id: transferData.item_id,
          initiator_id: profile?.id,
          receiver_id: transferData.receiver_id,
          status: 'pending_storekeeper',
        }])
        .select();

      if (error) {
        console.error('Transfer submission error:', error);
        // If table doesn't exist, create a notification instead
        if (error.code === '42P01') {
          throw new Error('Transfer system is not yet configured. Please contact administrator.');
        }
        throw new Error(error.message);
      }
      console.log('Transfer created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-transfers'] });
      toast({
        title: 'Transfer Request Submitted',
        description: 'The storekeeper will review your transfer request.',
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof transferSchema>) => {
    createTransferMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Transfer Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Transfer Item</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Item to Transfer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an item from your custody" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {myItems?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.asset_tag})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="college_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select College</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('department_id', '');
                        form.setValue('receiver_id', '');
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a college" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colleges?.map((college) => (
                          <SelectItem key={college.id} value={college.id}>
                            {college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Department</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('receiver_id', '');
                      }} 
                      defaultValue={field.value}
                      disabled={!selectedCollegeId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCollegeId ? "Choose a department" : "Select college first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Staff Member</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!selectedDepartmentId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDepartmentId ? "Select staff member" : "Select department first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {staffMembers
                          ?.filter(staff => staff.id !== profile?.id)
                          ?.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Transfer (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain why this item needs to be transferred..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTransferMutation.isPending}>
                  {createTransferMutation.isPending ? 'Submitting...' : 'Submit Transfer'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}