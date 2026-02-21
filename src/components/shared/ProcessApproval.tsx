import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

const approvalSchema = z.object({
  comment: z.string().optional(),
  action: z.enum(['approve', 'reject']),
});

interface ProcessApprovalProps {
  requestId: string;
  requestType: 'item_request' | 'transfer_request';
  currentStage: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProcessApproval({ 
  requestId, 
  requestType, 
  currentStage, 
  isOpen, 
  onClose 
}: ProcessApprovalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      comment: '',
      action: 'approve' as const,
    },
  });

  const processApprovalMutation = useMutation({
    mutationFn: async (values: z.infer<typeof approvalSchema>) => {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      // Determine which approval field to update based on role and stage
      if (profile?.role === 'department_head') {
        updates.dept_head_approver_id = profile.id;
        updates.status = values.action === 'approve' ? 'pending_dean' : 'rejected';
        if (values.action === 'reject') {
          updates.rejection_reason = values.comment;
        }
      } else if (profile?.role === 'college_dean') {
        updates.dean_approver_id = profile.id;
        updates.status = values.action === 'approve' ? 'pending_storekeeper' : 'rejected';
        if (values.action === 'reject') {
          updates.rejection_reason = values.comment;
        }
      } else if (profile?.role === 'storekeeper') {
        updates.storekeeper_allocator_id = profile.id;
        updates.status = values.action === 'approve' ? 'approved' : 'rejected';
        if (values.action === 'reject') {
          updates.rejection_reason = values.comment;
        }
      }

      const table = requestType === 'item_request' ? 'item_requests' : 'item_transfers';
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', requestId)
        .select('*, requester:profiles!requester_id(role, department_id)')
        .single();

      if (error) throw new Error(error.message);

      // If storekeeper approves a department head's request, create the item
      if (profile?.role === 'storekeeper' && values.action === 'approve' && requestType === 'item_request') {
        const request = data;
        if (request.requester?.role === 'department_head') {
          const { error: itemError } = await supabase
            .from('items')
            .insert({
              name: request.item_name,
              description: request.item_description,
              owner_department_id: request.requester_department_id,
              current_custodian_id: request.requester_id,
              status: 'Allocated',
              serial_number: `DEPT-${Date.now()}`,
              asset_tag: `AST-${Date.now()}`
            });
          if (itemError) throw new Error(itemError.message);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dean-pending-approvals-list'] });
      queryClient.invalidateQueries({ queryKey: ['dean-pending-approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['department-item-count'] });
      toast({
        title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        description: `The request has been ${action}d successfully.`,
      });
      onClose();
      form.reset();
      setAction(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof approvalSchema>) => {
    processApprovalMutation.mutate({ ...values, action: action! });
  };

  const handleAction = (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction);
    form.setValue('action', selectedAction);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Approve Request' : action === 'reject' ? 'Reject Request' : 'Process Request'}
          </DialogTitle>
        </DialogHeader>
        
        {!action ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose an action for this request:
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleAction('approve')}
                className="flex-1 gap-2"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button 
                onClick={() => handleAction('reject')}
                variant="destructive"
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {action === 'approve' ? 'Approval Comment (Optional)' : 'Rejection Reason (Optional)'}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={
                          action === 'approve' 
                            ? 'Add any comments or conditions for this approval...'
                            : 'Explain why this request is being rejected...'
                        }
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setAction(null)}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={processApprovalMutation.isPending}
                  variant={action === 'reject' ? 'destructive' : 'default'}
                >
                  {processApprovalMutation.isPending ? 'Processing...' : 
                   action === 'approve' ? 'Approve Request' : 'Reject Request'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}