import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Define the shape of your profile data
export type UserProfile = {
  id: string;
  full_name: string | null;
  role: 'admin' | 'college_dean' | 'department_head' | 'storekeeper' | 'staff';
  college_id: string | null;
  department_id: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
                      if (session?.user) {
                        try {
                          const { data: userProfile, error } = await supabase
                            .from('profiles')
                            .select(`
                              *,
                              departments(name, college_id),
                              colleges(name)
                            `)
                            .eq('id', session.user.id)
                            .maybeSingle();
          
                          if (mounted) {
                            if (error) {
                              console.error('Profile fetch error:', error);
                              setProfile(null);
                            } else if (userProfile) {
                              // Normalize the profile data
                              const normalizedProfile: UserProfile = {
                                ...userProfile,
                                // Ensure college_id is top-level
                                college_id: userProfile.college_id || (userProfile.departments as { college_id?: string })?.college_id || null,
                              };
                              setProfile(normalizedProfile);
                            } else {
                              setProfile(null);
                            }
                          }
                        } catch (error) {
                          console.error('Profile fetch error on auth change:', error);
                          if (mounted) {
                            setProfile(null);
                          }
                        }
                      } else {
                        setProfile(null);
                      }
                      setLoading(false);
                    }
                  }
                );
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      logout,
    }),
    [session, user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
