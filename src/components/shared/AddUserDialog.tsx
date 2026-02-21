import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserDialog({ isOpen, onClose, onSuccess }: AddUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: '',
    department_id: '',
    college_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartmentsAndColleges();
    }
  }, [isOpen]);

  const fetchDepartmentsAndColleges = async () => {
    try {
      const [deptResult, collegeResult] = await Promise.all([
        DataService.supabase.from('departments').select('*'),
        DataService.supabase.from('colleges').select('*')
      ]);
      
      if (deptResult.data) setDepartments(deptResult.data);
      if (collegeResult.data) setColleges(collegeResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await DataService.supabase.rpc('create_user_with_profile', {
        user_email: formData.email,
        user_password: 'TempPass123!',
        user_full_name: formData.full_name,
        user_role: formData.role,
        user_department_id: formData.department_id || null,
        user_college_id: formData.college_id || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User created successfully",
      });

      setFormData({
        email: '',
        full_name: '',
        role: '',
        department_id: '',
        college_id: '',
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="college_dean">College Dean</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                  <SelectItem value="storekeeper">Storekeeper</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.role === 'college_dean') && (
              <div>
                <Label htmlFor="college_id">College</Label>
                <Select value={formData.college_id} onValueChange={(value) => setFormData({ ...formData, college_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.role === 'department_head' || formData.role === 'staff') && (
              <div>
                <Label htmlFor="department_id">Department</Label>
                <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-user-form" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}