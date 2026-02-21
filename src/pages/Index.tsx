import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const roleToPath: Record<string, string> = {
  admin: '/admin',
  college_dean: '/dean',
  department_head: '/department',
  storekeeper: '/store',
  staff: '/staff',
};

const Index = () => {
  const navigate = useNavigate();
  const { profile, loading, session } = useAuth();
  const hasNavigated = useRef(false);

  useEffect(() => {
    console.log('Index - Auth state:', { loading, session: !!session, profile });
    
    if (!loading && !hasNavigated.current) {
      if (session && profile) {
        const path = roleToPath[profile.role] || '/admin';
        console.log('Navigating to:', path);
        hasNavigated.current = true;
        navigate(path, { replace: true });
      } else if (!session) {
        console.log('No session, redirecting to login');
        hasNavigated.current = true;
        navigate('/login', { replace: true });
      }
    }
  }, [loading, session, profile, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    </div>
  );
};

export default Index;
