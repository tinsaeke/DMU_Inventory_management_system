import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Package, PlusCircle, MoreHorizontal, Edit as EditIcon, Trash2 } from 'lucide-react';
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

const itemSchema = z.object({
  name: z.string().min(3, 'Item name is required'),
  description: z.string().optional(),
  serial_number: z.string().optional(),
  asset_tag: z.string().min(1, 'Asset tag is required'),
  status: z.enum(['Available', 'Allocated', 'Under Maintenance', 'Damaged']),
  owner_department_id: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.number().optional(),
});

type Department = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  asset_tag: string;
  status: string;
  departments: { name: string } | null;
};

// Fetching functions
const fetchItems = async () => {
  const { data, error } = await supabase.from('items').select('*, departments(name)');
  if (error) throw new Error(error.message);
  return data;
};
const fetchDepartments = async () => (await supabase.from('departments').select('id, name')).data;

export default function ManageItems() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const form = useForm({ resolver: zodResolver(itemSchema), defaultValues: { name: '', asset_tag: '', status: 'Available', owner_department_id: '' } });

  const { data: items, isLoading: isLoadingItems } = useQuery<Item[]>({ queryKey: ['items'], queryFn: fetchItems });
  const { data: departments } = useQuery<Department[] | null>({ queryKey: ['departments'], queryFn: fetchDepartments });

  const createItemMutation = useMutation({
    mutationFn: async (values: z.infer<typeof itemSchema>) => {
      // Get default department if none selected
      const finalValues = { ...values };
      if (!finalValues.owner_department_id) {
        const { data: departments } = await supabase.from('departments').select('id').limit(1);
        if (departments?.[0]?.id) {
          finalValues.owner_department_id = departments[0].id;
        }
      }
      
      const { data, error } = await supabase.from('items').insert([finalValues]).select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item created successfully.' });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: 'Error Creating Item', description: error.message, variant: 'destructive' });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) throw new Error(error.message);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Item', description: error.message, variant: 'destructive' });
    },
  });

  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleEditItem = (item: Item) => {
    // Simple edit functionality - just change status for now
    const newStatus = prompt(`Change status for "${item.name}" (Available, Allocated, Under Maintenance, Damaged):`, item.status);
    if (newStatus && ['Available', 'Allocated', 'Under Maintenance', 'Damaged'].includes(newStatus)) {
      supabase.from('items').update({ status: newStatus }).eq('id', item.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['items'] });
        toast({ title: 'Success', description: 'Item status updated successfully.' });
      }).catch((error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      });
    }
  };

  const onSubmit = (values: z.infer<typeof itemSchema>) => createItemMutation.mutate(values);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Inventory</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><PlusCircle className="h-4 w-4 mr-2" /> New Item</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Create a New Item</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Item Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="asset_tag" render={({ field }) => (<FormItem><FormLabel>Asset Tag</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="owner_department_id" render={({ field }) => (<FormItem><FormLabel>Owning Department (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a department (optional)" /></SelectTrigger></FormControl><SelectContent>{departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{['Available', 'Allocated', 'Under Maintenance', 'Damaged'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={createItemMutation.isPending}>{createItemMutation.isPending ? 'Creating...' : 'Create Item'}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoadingItems ? <p>Loading items...</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Asset Tag</TableHead><TableHead>Status</TableHead><TableHead>Owner Department</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.asset_tag}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.departments?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEditItem(item)}><EditIcon className="h-4 w-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id, item.name)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
