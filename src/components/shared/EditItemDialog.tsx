import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataService } from '@/services/DataService';

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
}

export function EditItemDialog({ isOpen, onClose, onSuccess, item }: EditItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    asset_tag: '',
    purchase_cost: '',
    status: 'Available',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        serial_number: item.serial_number || '',
        asset_tag: item.asset_tag || '',
        purchase_cost: item.purchase_cost?.toString() || '',
        status: item.status || 'Available',
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await DataService.supabase
        .from('items')
        .update({
          ...formData,
          purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        })
        .eq('id', item.id);

      if (error) throw error;

      console.log('Item updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating item:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form id="edit-item-form" onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" form="edit-item-form" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}