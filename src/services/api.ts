import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { 
  Item, 
  ItemRequest, 
  ItemTransfer, 
  Profile, 
  College, 
  Department,
  Notification 
} from '@/types';

/**
 * API Service Layer
 * Centralizes all database operations with consistent error handling
 */

// Items API
export const itemsApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Item[];
    } catch (error) {
      logger.error('Failed to fetch items', error, 'itemsApi.getAll');
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Item;
    } catch (error) {
      logger.error('Failed to fetch item', error, 'itemsApi.getById');
      throw error;
    }
  },

  async getByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('status', status);
      
      if (error) throw error;
      return data as Item[];
    } catch (error) {
      logger.error('Failed to fetch items by status', error, 'itemsApi.getByStatus');
      throw error;
    }
  },

  async getByCustodian(custodianId: string) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('current_custodian_id', custodianId);
      
      if (error) throw error;
      return data as Item[];
    } catch (error) {
      logger.error('Failed to fetch items by custodian', error, 'itemsApi.getByCustodian');
      throw error;
    }
  },

  async create(item: Partial<Item>) {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      logger.info('Item created successfully', { itemId: data.id }, 'itemsApi.create');
      return data as Item;
    } catch (error) {
      logger.error('Failed to create item', error, 'itemsApi.create');
      throw error;
    }
  },

  async update(id: string, updates: Partial<Item>) {
    try {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      logger.info('Item updated successfully', { itemId: id }, 'itemsApi.update');
      return data as Item;
    } catch (error) {
      logger.error('Failed to update item', error, 'itemsApi.update');
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      logger.info('Item deleted successfully', { itemId: id }, 'itemsApi.delete');
    } catch (error) {
      logger.error('Failed to delete item', error, 'itemsApi.delete');
      throw error;
    }
  },
};

// Requests API
export const requestsApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('item_requests')
        .select('*, profiles!requester_id(full_name), departments(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ItemRequest[];
    } catch (error) {
      logger.error('Failed to fetch requests', error, 'requestsApi.getAll');
      throw error;
    }
  },

  async getByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('item_requests')
        .select('*, profiles!requester_id(full_name), departments(name)')
        .eq('status', status)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ItemRequest[];
    } catch (error) {
      logger.error('Failed to fetch requests by status', error, 'requestsApi.getByStatus');
      throw error;
    }
  },

  async create(request: Partial<ItemRequest>) {
    try {
      const { data, error } = await supabase
        .from('item_requests')
        .insert([request])
        .select()
        .single();
      
      if (error) throw error;
      logger.info('Request created successfully', { requestId: data.id }, 'requestsApi.create');
      return data as ItemRequest;
    } catch (error) {
      logger.error('Failed to create request', error, 'requestsApi.create');
      throw error;
    }
  },

  async updateStatus(id: string, status: string, approverId?: string) {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      
      if (approverId) {
        if (status.includes('dept_head')) updates.dept_head_approver_id = approverId;
        if (status.includes('dean')) updates.dean_approver_id = approverId;
        if (status.includes('storekeeper')) updates.storekeeper_allocator_id = approverId;
      }

      const { data, error } = await supabase
        .from('item_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      logger.info('Request status updated', { requestId: id, status }, 'requestsApi.updateStatus');
      return data as ItemRequest;
    } catch (error) {
      logger.error('Failed to update request status', error, 'requestsApi.updateStatus');
      throw error;
    }
  },
};

// Transfers API
export const transfersApi = {
  async getAll() {
    try {
      const { data, error } = await supabase.rpc('get_transfers_with_emails');
      if (error) throw error;
      return data as ItemTransfer[];
    } catch (error) {
      logger.error('Failed to fetch transfers', error, 'transfersApi.getAll');
      throw error;
    }
  },

  async getByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('item_transfers')
        .select('*, items(name, asset_tag), initiator:profiles!initiator_id(full_name), receiver:profiles!receiver_id(full_name)')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ItemTransfer[];
    } catch (error) {
      logger.error('Failed to fetch transfers by status', error, 'transfersApi.getByStatus');
      throw error;
    }
  },

  async create(transfer: Partial<ItemTransfer>) {
    try {
      const { data, error } = await supabase
        .from('item_transfers')
        .insert([transfer])
        .select()
        .single();
      
      if (error) throw error;
      logger.info('Transfer created successfully', { transferId: data.id }, 'transfersApi.create');
      return data as ItemTransfer;
    } catch (error) {
      logger.error('Failed to create transfer', error, 'transfersApi.create');
      throw error;
    }
  },

  async updateStatus(id: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('item_transfers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      logger.info('Transfer status updated', { transferId: id, status }, 'transfersApi.updateStatus');
      return data as ItemTransfer;
    } catch (error) {
      logger.error('Failed to update transfer status', error, 'transfersApi.updateStatus');
      throw error;
    }
  },
};

// Profiles API
export const profilesApi = {
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, departments(name, colleges(name))')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    } catch (error) {
      logger.error('Failed to fetch profile', error, 'profilesApi.getById');
      throw error;
    }
  },

  async getByDepartment(departmentId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('department_id', departmentId);
      
      if (error) throw error;
      return data as Profile[];
    } catch (error) {
      logger.error('Failed to fetch profiles by department', error, 'profilesApi.getByDepartment');
      throw error;
    }
  },
};

// Notifications API
export const notificationsApi = {
  async getByUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    } catch (error) {
      logger.error('Failed to fetch notifications', error, 'notificationsApi.getByUser');
      throw error;
    }
  },

  async markAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      logger.info('Notification marked as read', { notificationId: id }, 'notificationsApi.markAsRead');
    } catch (error) {
      logger.error('Failed to mark notification as read', error, 'notificationsApi.markAsRead');
      throw error;
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      logger.info('All notifications marked as read', { userId }, 'notificationsApi.markAllAsRead');
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error, 'notificationsApi.markAllAsRead');
      throw error;
    }
  },
};

// Colleges API
export const collegesApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as College[];
    } catch (error) {
      logger.error('Failed to fetch colleges', error, 'collegesApi.getAll');
      throw error;
    }
  },
};

// Departments API
export const departmentsApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*, colleges(name)')
        .order('name');
      
      if (error) throw error;
      return data as Department[];
    } catch (error) {
      logger.error('Failed to fetch departments', error, 'departmentsApi.getAll');
      throw error;
    }
  },

  async getByCollege(collegeId: string) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('college_id', collegeId)
        .order('name');
      
      if (error) throw error;
      return data as Department[];
    } catch (error) {
      logger.error('Failed to fetch departments by college', error, 'departmentsApi.getByCollege');
      throw error;
    }
  },
};
