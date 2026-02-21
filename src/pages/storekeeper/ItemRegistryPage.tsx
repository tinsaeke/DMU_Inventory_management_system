import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { DataService } from '@/services/DataService';
import { AddItemDialog } from '@/components/shared/AddItemDialog';
import { EditItemDialog } from '@/components/shared/EditItemDialog';
import { useToast } from '@/hooks/use-toast';

export default function ItemRegistryPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items-registry'],
    queryFn: async () => {
      const { data, error } = await DataService.supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await DataService.supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items-registry'] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting item:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete item. It may be in use.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteItem = (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const filteredItems = items.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Allocated': return 'bg-blue-100 text-blue-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Item Registry"
      pageSubtitle="Complete inventory management"
      headerActions={
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search items by name, asset tag, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Tag
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Cost
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                      Loading items...
                    </td>
                  </tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.serial_number && (
                        <div className="text-xs text-gray-500">SN: {item.serial_number}</div>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-xs font-mono text-gray-900">{item.asset_tag}</span>
                    </td>
                    <td className="px-2 py-1">
                      <Badge className={`${getStatusColor(item.status)} text-xs`}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-sm text-gray-900">
                        ${item.purchase_cost || 0}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteItem(item)}
                          disabled={deleteItemMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                      {searchTerm ? 'No items found matching your search.' : 'No items registered yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No items found matching your search.' : 'No items registered yet.'}
            </div>
          )}
        </div>
      </div>
      
      {isAddDialogOpen && (
        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['items-registry'] });
            setIsAddDialogOpen(false);
            toast({
              title: "Success",
              description: "Item added successfully",
            });
          }}
        />
      )}
      
      {isEditDialogOpen && (
        <EditItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['items-registry'] });
            setIsEditDialogOpen(false);
            setEditingItem(null);
            toast({
              title: "Success",
              description: "Item updated successfully",
            });
          }}
          item={editingItem}
        />
      )}
    </DashboardLayout>
  );
}