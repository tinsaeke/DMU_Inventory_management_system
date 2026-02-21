import { useAuth, UserProfile } from '@/hooks/use-auth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

type ProtectedRouteProps = {
  allowedRoles?: UserProfile['role'][];
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { profile, loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground">Loading authentication...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If routes are for authenticated users in general (e.g. a settings page)
  if (!allowedRoles) {
    return <Outlet />;
  }
  
  // If user profile is still loading or not present, yet session exists.
  if (!profile) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground">Loading user profile...</div>
      </div>
    );
  }

  if (allowedRoles.includes(profile.role)) {
    return <Outlet />;
  } else {
    // This can be a dedicated "Unauthorized" page.
    // For now, redirecting to a "safe" page.
    // The logic inside the dashboard will handle redirection.
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
