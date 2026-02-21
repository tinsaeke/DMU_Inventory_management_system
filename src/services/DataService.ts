import { supabase } from '@/integrations/supabase/client';

export class DataService {
  static supabase = supabase;
  
  static async getProfileWithRelationships(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        departments(name, college_id, colleges(name)),
        colleges(name)
      `)
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }

  static async getItems() {
    const { data, error } = await supabase
      .from('v_items_with_relationships')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getItemCategories() {
    const { data, error } = await supabase
      .from('item_categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  }

  static async getInventoryStats() {
    const { data: items, error } = await supabase
      .from('items')
      .select('status, category_id, purchase_cost');
    
    if (error) throw error;
    
    const stats = {
      total: items?.length || 0,
      available: items?.filter(i => i.status === 'Available').length || 0,
      allocated: items?.filter(i => i.status === 'Allocated').length || 0,
      maintenance: items?.filter(i => i.status === 'Under Maintenance').length || 0,
      damaged: items?.filter(i => i.status === 'Damaged').length || 0,
      totalValue: items?.reduce((sum, item) => sum + (item.purchase_cost || 0), 0) || 0,
    };
    
    return stats;
  }

  static async getItemsWithRelationships(filters?: {
    collegeId?: string;
    departmentId?: string;
    custodianId?: string;
  }) {
    let query = supabase
      .from('items')
      .select(`
        *,
        profiles(full_name),
        departments(name),
        colleges(name),
        item_categories(name)
      `);
    
    if (filters?.collegeId) query = query.eq('college_id', filters.collegeId);
    if (filters?.departmentId) query = query.eq('department_id', filters.departmentId);
    if (filters?.custodianId) query = query.eq('current_custodian_id', filters.custodianId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getRequestsWithRelationships(filters?: {
    collegeId?: string;
    departmentId?: string;
    requesterId?: string;
    status?: string;
  }) {
    let query = supabase
      .from('item_requests')
      .select(`
        *,
        profiles(full_name),
        departments(name),
        colleges(name),
        item_categories(name)
      `);
    
    if (filters?.collegeId) query = query.eq('college_id', filters.collegeId);
    if (filters?.departmentId) query = query.eq('department_id', filters.departmentId);
    if (filters?.requesterId) query = query.eq('requester_id', filters.requesterId);
    if (filters?.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getDashboardStats(role: string, userId: string, collegeId?: string, departmentId?: string) {
    switch (role) {
      case 'admin': {
        const [users, colleges, departments, items] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('colleges').select('*', { count: 'exact', head: true }),
          supabase.from('departments').select('*', { count: 'exact', head: true }),
          supabase.from('items').select('*', { count: 'exact', head: true })
        ]);
        return {
          users: users.count || 0,
          colleges: colleges.count || 0,
          departments: departments.count || 0,
          items: items.count || 0
        };
      }

      case 'college_dean': {
        const [deanDepts, deanItems, deanRequests] = await Promise.all([
          supabase.from('departments').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
          supabase.from('items').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
          supabase.from('item_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_dean')
        ]);
        return {
          departments: deanDepts.count || 0,
          items: deanItems.count || 0,
          pendingApprovals: deanRequests.count || 0
        };
      }

      case 'department_head': {
        const [deptStaff, deptItems, deptRequests] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('department_id', departmentId),
          supabase.from('items').select('*', { count: 'exact', head: true }).eq('department_id', departmentId),
          supabase.from('item_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_dept_head')
        ]);
        return {
          staff: deptStaff.count || 0,
          items: deptItems.count || 0,
          pendingApprovals: deptRequests.count || 0
        };
      }

      case 'staff': {
        const [myItems, myRequests] = await Promise.all([
          supabase.from('items').select('*', { count: 'exact', head: true }).eq('current_custodian_id', userId),
          supabase.from('item_requests').select('*', { count: 'exact', head: true }).eq('requester_id', userId).in('status', ['pending_dept_head', 'pending_dean', 'pending_storekeeper'])
        ]);
        return {
          myItems: myItems.count || 0,
          activeRequests: myRequests.count || 0
        };
      }

      default:
        return {};
    }
  }
}

export default DataService;