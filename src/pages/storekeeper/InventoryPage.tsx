import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { fetchItemsWithDetails, updateItemStatus, allocateItem, type ItemWithDetails } from '@/lib/itemManagement';
import { AddItemDialog } from '@/components/shared/AddItemDialog';
import { EditItemDialog } from '@/components/shared/EditItemDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/shared/Pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InventoryPage() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [allocatingItem, setAllocatingItem] = useState<any>(null);
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedCustodian, setSelectedCustodian] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: fetchItemsWithDetails,
  });

  const { data: colleges = [] } = useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('colleges').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAllocateDialogOpen,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAllocateDialogOpen,
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members', selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('department_id', selectedDepartment)
        .in('role', ['staff', 'department_head']);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDepartment && isAllocateDialogOpen,
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: async ({ itemId, newStatus }: { itemId: string, newStatus: string }) => {
      await updateItemStatus(itemId, newStatus as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: "Success", description: "Item status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  });

  const updateItemStatus = (itemId: string, newStatus: string) => {
    updateItemStatusMutation.mutate({ itemId, newStatus });
  };

  const allocateMutation = useMutation({
    mutationFn: async () => {
      if (!allocatingItem || !selectedDepartment || !selectedCustodian) return;
      
      const { error } = await supabase
        .from('items')
        .update({
          status: 'Allocated',
          current_custodian_id: selectedCustodian,
          owner_department_id: selectedDepartment,
          updated_at: new Date().toISOString()
        })
        .eq('id', allocatingItem.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: "Success", description: "Item allocated successfully" });
      setIsAllocateDialogOpen(false);
      setAllocatingItem(null);
      setSelectedCollege('');
      setSelectedDepartment('');
      setSelectedCustodian('');
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
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

  const handleAllocateItem = (item: any) => {
    setAllocatingItem(item);
    setIsAllocateDialogOpen(true);
  };

  const filteredItems = items.filter((item: any) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.asset_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(filteredItems, 25);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Allocated': return 'bg-blue-100 text-blue-800';
      case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDepartments = departments.filter((d: any) => d.college_id === selectedCollege);

  return (
    <DashboardLayout
      role="storekeeper"
      userName={profile?.full_name || user?.email || "Storekeeper"}
      userEmail={user?.email || ""}
      pageTitle="Inventory Management"
      pageSubtitle="Manage all university items and inventory"
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
                    Owner Department
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Custodian
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item: any) => (
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
                      <span className="text-sm text-gray-900">
                        {item.owner_department?.name === 'Store Department' ? 'Store' : (item.owner_department?.name || 'Store')}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-sm text-gray-900">
                        {item.current_custodian?.full_name || 'None'}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <Select 
                        value={item.status} 
                        onValueChange={(newStatus) => {
                          if (newStatus === 'Allocated') {
                            handleAllocateItem(item);
                          } else {
                            updateItemStatus(item.id, newStatus);
                          }
                        }}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Allocated">Allocated</SelectItem>
                          <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                          <SelectItem value="Damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-sm text-gray-900">
                        ${item.purchase_cost || 0}
                      </span>
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleEditItem(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleAllocateItem(item)} title="Allocate">
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => handleDeleteItem(item)} disabled={deleteItemMutation.isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No items found matching your search.' : 'No items registered yet.'}
            </div>
          )}
          {filteredItems.length > 0 && (
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
      </div>
      
      {isAddDialogOpen && (
        <AddItemDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
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
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
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

      <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Item</DialogTitle>
            <DialogDescription>Assign {allocatingItem?.name} to a college department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">College</label>
              <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                <SelectTrigger><SelectValue placeholder="Select College" /></SelectTrigger>
                <SelectContent>
                  {colleges.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={!selectedCollege}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Staff Member</label>
              <Select value={selectedCustodian} onValueChange={setSelectedCustodian} disabled={!selectedDepartment}>
                <SelectTrigger><SelectValue placeholder="Select Staff Member" /></SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff: any) => <SelectItem key={staff.id} value={staff.id}>{staff.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllocateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => allocateMutation.mutate()} disabled={!selectedCustodian || allocateMutation.isPending}>
              {allocateMutation.isPending ? 'Allocating...' : 'Allocate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}