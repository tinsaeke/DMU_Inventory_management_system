import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataService } from '@/services/DataService';
import { useToast } from '@/hooks/use-toast';

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemDialog({ isOpen, onClose, onSuccess }: AddItemDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    asset_tag: '',
    purchase_cost: '',
    owner_department_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Set owner_department_id to null for store items
      const { error } = await DataService.supabase
        .from('items')
        .insert([{
          ...formData,
          purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
          status: 'Available',
          owner_department_id: null // Store items have no department ownership
        }]);

      if (error) throw error;

      console.log('Item added successfully');

      // Reset form but keep dialog open for adding more items
      setFormData({
        name: '',
        description: '',
        serial_number: '',
        asset_tag: '',
        purchase_cost: '',
        owner_department_id: '',
      });
      
      onSuccess();
      // Don't close dialog automatically - let user close it manually
    } catch (error: any) {
      console.error('Error adding item:', error);
      
      let errorMessage = "An error occurred while adding the item.";
      
      if (error.message) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = "Asset tag or serial number already exists. Please use a unique value.";
        } else {
          errorMessage = error.message;
        }
      } else if (error.code === '23505') {
        errorMessage = "Asset tag or serial number already exists. Please use a unique value.";
      }
      
      toast({
        title: "Failed to Add Item",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form id="add-item-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="asset_tag">Inventory Tag</Label>
              <Input
                id="asset_tag"
                value={formData.asset_tag}
                onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="purchase_cost">Purchase Cost</Label>
              <Input
                id="purchase_cost"
                type="number"
                step="0.01"
                value={formData.purchase_cost}
                onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
              />
            </div>
          </form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-item-form" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}