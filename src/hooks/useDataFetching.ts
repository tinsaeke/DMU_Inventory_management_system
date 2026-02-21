import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS, REFETCH_INTERVALS } from './constants';

// Hook for fetching user's items
export function useMyItems(userId: string | undefined, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: [QUERY_KEYS.MY_ITEMS, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('current_custodian_id', userId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    ...options,
  });
}

// Hook for fetching pending allocations
export function usePendingAllocations(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: [QUERY_KEYS.PENDING_ALLOCATIONS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_requests')
        .select(`
          id,
          item_name,
          quantity,
          urgency,
          created_at,
          justification,
          requester_id,
          requester_department_id,
          profiles!requester_id(full_name),
          departments(name, colleges(name))
        `)
        .eq('status', 'pending_storekeeper')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: REFETCH_INTERVALS.NORMAL,
    ...options,
  });
}

// Hook for fetching available items
export function useAvailableItems(enabled: boolean = true, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: [QUERY_KEYS.AVAILABLE_ITEMS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'Available');
      
      if (error) throw error;
      return data || [];
    },
    enabled,
    ...options,
  });
}

// Hook for fetching notification count
export function useNotificationCount(userId: string | undefined, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATION_COUNT, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!userId,
    refetchInterval: REFETCH_INTERVALS.NORMAL,
    ...options,
  });
}

// Hook for fetching colleges
export function useColleges(options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: [QUERY_KEYS.COLLEGES],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colleges')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for fetching departments by college
export function useDepartmentsByCollege(collegeId: string | undefined, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: [QUERY_KEYS.DEPARTMENTS, collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, college_id')
        .eq('college_id', collegeId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Hook for fetching staff by department
export function useStaffByDepartment(departmentId: string | undefined, options?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: [QUERY_KEYS.STAFF_MEMBERS, departmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, department_id')
        .eq('department_id', departmentId)
        .in('role', ['staff', 'department_head'])
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!departmentId,
    ...options,
  });
}
