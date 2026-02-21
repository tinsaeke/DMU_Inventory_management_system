import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const requestSchema = z.object({
  item_name: z.string().min(3, 'Item name is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  justification: z.string().min(10, 'Please provide a justification'),
});

export default function RequestItemPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      item_name: '',
      quantity: 1,
      urgency: 'low',
      justification: '',
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (values: z.infer<typeof requestSchema>) => {
      if (!profile?.id || !profile?.department_id) {
        throw new Error("User profile not loaded. Please try again.");
      }

      const { data, error } = await supabase
        .from('item_requests')
        .insert([{
          item_name: values.item_name,
          quantity: values.quantity,
          urgency: values.urgency,
          justification: values.justification,
          requester_id: profile.id,
          requester_department_id: profile.department_id,
          status: 'pending_dept_head',
        }])
        .select();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast({
        title: 'Request Submitted',
        description: 'Your item request has been submitted for approval.',
      });
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

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    createRequestMutation.mutate(values);
  };

  return (
    <DashboardLayout
      role="staff"
      userName={profile?.full_name || user?.email || "Staff Member"}
      userEmail={user?.email || ""}
      pageTitle="Request Item"
      pageSubtitle="Submit a new item request"
    >
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Submit New Item Request</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use this form to request new items for your work. All requests go through the approval process:
                Department Head → College Dean → Storekeeper.
              </p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="item_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Laptop, Office Chair" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select urgency" />
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
                  </div>

                  <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Justification</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain why you need this item..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={createRequestMutation.isPending || !profile?.department_id}>
                    {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}