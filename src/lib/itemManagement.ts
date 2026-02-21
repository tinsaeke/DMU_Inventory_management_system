import { supabase } from '@/integrations/supabase/client';

export type ItemStatus = 'Available' | 'Allocated' | 'In Use' | 'Under Maintenance' | 'Damaged' | 'Disposed';

export type ItemWithDetails = {
  id: string;
  name: string;
  asset_tag: string;
  serial_number?: string;
  status: ItemStatus;
  purchase_cost?: number;
  purchase_date?: string;
  current_custodian_id?: string;
  owner_department_id?: string;
  created_at: string;
  updated_at: string;
  item_categories?: { name: string } | null;
  current_custodian?: { full_name: string; email: string } | null;
  owner_department?: { name: string; colleges?: { name: string } } | null;
};

/**
 * Fetches all items with complete details including custodian and department info
 */
export const fetchItemsWithDetails = async (): Promise<ItemWithDetails[]> => {
  const { data: items, error } = await supabase
    .from('items')
    .select(`
      *,
      item_categories(name),
      owner_department:departments!owner_department_id(
        name,
        colleges(name)
      )
    `);

  if (error) throw new Error(error.message);

  // Fetch custodian details for each item
  const itemsWithCustodians = await Promise.all(
    (items || []).map(async (item) => {
      let custodian = null;
      if (item.current_custodian_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', item.current_custodian_id)
          .single();
        
        custodian = profile ? { 
          full_name: profile.full_name, 
          email: 'Email not available' 
        } : null;
      }

      return {
        ...item,
        current_custodian: custodian
      };
    })
  );

  return itemsWithCustodians;
};

/**
 * Allocates an item to a custodian with proper status and department management
 */
export const allocateItem = async (itemId: string, custodianId: string): Promise<void> => {
  // Get the custodian's department
  const { data: profile } = await supabase
    .from('profiles')
    .select('department_id')
    .eq('id', custodianId)
    .single();

  if (!profile) throw new Error('Custodian profile not found');

  const { error } = await supabase
    .from('items')
    .update({
      current_custodian_id: custodianId,
      owner_department_id: profile.department_id, // Set department ownership
      status: 'Allocated',
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) throw new Error(`Failed to allocate item: ${error.message}`);
};

/**
 * Updates item status with proper validation
 */
export const updateItemStatus = async (itemId: string, newStatus: ItemStatus): Promise<void> => {
  // Validate status transitions
  const { data: currentItem } = await supabase
    .from('items')
    .select('status, current_custodian_id')
    .eq('id', itemId)
    .single();

  if (!currentItem) throw new Error('Item not found');

  // Status transition rules
  const updates: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  // If changing to Available, remove custodian
  if (newStatus === 'Available') {
    updates.current_custodian_id = null;
  }

  const { error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId);

  if (error) throw new Error(`Failed to update item status: ${error.message}`);
};

/**
 * Returns an item to available status (removes custodian and department ownership)
 */
export const returnItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('items')
    .update({
      current_custodian_id: null,
      owner_department_id: null, // Return to store (no department ownership)
      status: 'Available',
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) throw new Error(`Failed to return item: ${error.message}`);
};

/**
 * Transfers item from one custodian to another with proper department ownership
 */
export const transferItem = async (itemId: string, newCustodianId: string): Promise<void> => {
  // Get the new custodian's department
  const { data: profile } = await supabase
    .from('profiles')
    .select('department_id')
    .eq('id', newCustodianId)
    .single();

  if (!profile) throw new Error('Custodian profile not found');

  const { error } = await supabase
    .from('items')
    .update({
      current_custodian_id: newCustodianId,
      owner_department_id: profile.department_id, // Update department ownership
      status: 'Allocated',
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) throw new Error(`Failed to transfer item: ${error.message}`);
};

/**
 * Gets items by custodian
 */
export const getItemsByCustodian = async (custodianId: string): Promise<ItemWithDetails[]> => {
  const { data: items, error } = await supabase
    .from('items')
    .select(`
      *,
      item_categories(name),
      owner_department:departments!owner_department_id(
        name,
        colleges(name)
      )
    `)
    .eq('current_custodian_id', custodianId);

  if (error) throw new Error(error.message);

  return items || [];
};

/**
 * Gets items by department
 */
export const getItemsByDepartment = async (
  departmentId: string,
  page: number,
  pageSize: number,
): Promise<{ data: ItemWithDetails[]; count: number }> => {
  console.log('getItemsByDepartment called with:', { departmentId, page, pageSize });
  
  // Get all items for the department without pagination first to get accurate count
  const { data: allItems, error: countError } = await supabase
    .from('items')
    .select('id')
    .eq('owner_department_id', departmentId);

  console.log('Count query result:', { count: allItems?.length, error: countError });

  if (countError) {
    console.error('Count query error:', countError);
    throw new Error(countError.message);
  }
  
  const totalCount = allItems?.length || 0;

  // Then get the paginated data with all details
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;
  
  console.log('Fetching paginated data, range:', startIndex, '-', endIndex);
  
  const { data, error } = await supabase
    .from('items')
    .select(
      `
      *,
      item_categories(name),
      owner_department:departments!owner_department_id(
        name,
        colleges(name)
      ),
      current_custodian:profiles!current_custodian_id(
        full_name
      ),
      return_requests(id, status)
    `
    )
    .eq('owner_department_id', departmentId)
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex);

  console.log('Data query result:', { itemsCount: data?.length, error });

  if (error) {
    console.error('Data query error:', error);
    throw new Error(error.message);
  }

  return { data: data || [], count: totalCount };
};

/**
 * Gets available items for allocation
 */
export const getAvailableItems = async (): Promise<ItemWithDetails[]> => {
  const { data: items, error } = await supabase
    .from('items')
    .select(`
      *,
      item_categories(name),
      owner_department:departments!owner_department_id(
        name,
        colleges(name)
      )
    `)
    .eq('status', 'Available');

  if (error) throw new Error(error.message);

  return items || [];
};