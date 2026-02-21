import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

// A mapping from role to the primary dashboard path.
const roleToPath: Record<string, string> = {
  admin: '/admin',
  college_dean: '/dean',
  department_head: '/department',
  storekeeper: '/store',
  staff: '/staff',
};

const PublicRoute = () => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    // You can return a loading spinner or a blank page while checking auth.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (session && profile) {
    // User is logged in, redirect them away from the login page.
    const redirectTo = roleToPath[profile.role] || '/';
    return <Navigate to={redirectTo} replace />;
  }

  // User is not logged in, so render the child route (e.g., the Login page).
  return <Outlet />;
};

export default PublicRoute;
