import { supabase } from '@/integrations/supabase/client';

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'college_dean' | 'department_head' | 'storekeeper' | 'staff';
  college_id: string | null;
  department_id: string | null;
  colleges?: { name: string } | null;
  departments?: { name: string } | null;
};

/**
 * Fetches all user profiles with their emails from the auth system
 * This ensures consistent email display across the entire system
 */
export const fetchUserProfilesWithEmails = async (): Promise<UserProfile[]> => {
  // First get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, colleges(name), departments(name)');
  
  if (error) throw new Error(error.message);
  
  // Then fetch emails for each profile
  const profilesWithEmails = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data: emailData } = await supabase.rpc('get_user_email', { 
        user_id: profile.id 
      });
      
      return {
        ...profile,
        email: emailData || 'No email found'
      };
    })
  );
  
  return profilesWithEmails;
};

/**
 * Fetches a single user profile with email
 */
export const fetchUserProfileWithEmail = async (userId: string): Promise<UserProfile | null> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, colleges(name), departments(name)')
    .eq('id', userId)
    .single();
  
  if (error) throw new Error(error.message);
  
  const { data: emailData } = await supabase.rpc('get_user_email', { 
    user_id: userId 
  });
  
  return {
    ...profile,
    email: emailData || 'No email found'
  };
};

/**
 * Fetches profiles for a specific role with emails
 */
export const fetchProfilesByRoleWithEmails = async (role: string): Promise<UserProfile[]> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, colleges(name), departments(name)')
    .eq('role', role);
  
  if (error) throw new Error(error.message);
  
  const profilesWithEmails = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { data: emailData } = await supabase.rpc('get_user_email', { 
        user_id: profile.id 
      });
      
      return {
        ...profile,
        email: emailData || 'No email found'
      };
    })
  );
  
  return profilesWithEmails;
};