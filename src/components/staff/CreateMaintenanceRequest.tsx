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
import { Wrench } from 'lucide-react';

const maintenanceSchema = z.object({
  item_id: z.string().uuid('Please select an item'),
  issue_description: z.string().min(10, 'Please provide detailed description of the issue'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  maintenance_type: z.enum(['repair', 'service', 'replacement', 'upgrade']),
});

type MyItem = { id: string; name: string; asset_tag: string; };

const fetchMyItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, asset_tag')
    .eq('current_custodian_id', userId)
    .neq('status', 'Under Maintenance');
  if (error) throw new Error(error.message);
  return data;
};

export default function CreateMaintenanceRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      item_id: '',
      issue_description: '',
      urgency: 'medium' as const,
      maintenance_type: 'repair' as const,
    },
  });

  const { data: myItems } = useQuery<MyItem[]>({
    queryKey: ['my-items-maintenance', profile?.id],
    queryFn: () => fetchMyItems(profile?.id || ''),
    enabled: !!profile?.id,
  });

  const createMaintenanceRequestMutation = useMutation({
    mutationFn: async (values: z.infer<typeof maintenanceSchema>) => {
      // First, update the item status to 'Under Maintenance'
      const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'Under Maintenance' })
        .eq('id', values.item_id);

      if (itemError) throw new Error(itemError.message);

      // Create maintenance request record
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([{
          item_id: values.item_id,
          requester_id: profile?.id,
          issue_description: values.issue_description,
          urgency: values.urgency,
          maintenance_type: values.maintenance_type,
          status: 'pending',
        }])
        .select();

      if (error) throw new Error(error.message);

      // Create notification for storekeeper
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: (await supabase.from('profiles').select('id').eq('role', 'storekeeper').single()).data?.id,
          title: 'Maintenance Request Submitted',
          message: `${profile?.full_name} has reported an issue with an item requiring ${values.maintenance_type}`,
          type: 'approval_required',
          related_entity_type: 'maintenance_request',
          related_entity_id: data[0].id,
        }]);

      if (notifError) console.error('Notification error:', notifError);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-items-maintenance'] });
      toast({
        title: 'Maintenance Request Submitted',
        description: 'Your maintenance request has been submitted. The item status has been updated.',
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

  const onSubmit = (values: z.infer<typeof maintenanceSchema>) => {
    createMaintenanceRequestMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wrench className="h-4 w-4" />
          Report Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Report Maintenance Issue</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Item</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an item that needs maintenance" />
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
                name="maintenance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="replacement">Replacement</SelectItem>
                        <SelectItem value="upgrade">Upgrade</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issue_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the problem in detail, including any error messages, symptoms, or damage observed..."
                        className="resize-none"
                        rows={4}
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
                <Button type="submit" disabled={createMaintenanceRequestMutation.isPending}>
                  {createMaintenanceRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}