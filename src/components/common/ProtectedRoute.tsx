import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useAuthContext } from '@/components/common/AuthProvider';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { hasAccess, isLoading, accessMap } = usePageAccess();
  const { profile, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isLoading && profile) {
      const currentRoute = location.pathname;
      
      // Only check access if accessMap has been loaded (not empty)
      // This prevents redirect during initial page load/refresh
      const accessMapLoaded = Object.keys(accessMap).length > 0;
      
      if (accessMapLoaded && !hasAccess(currentRoute)) {
        // Redirect to /dashboard if user doesn't have access
        navigate('/dashboard', { replace: true });
      }
    }
  }, [hasAccess, authLoading, isLoading, location.pathname, navigate, profile, accessMap]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return <>{children}</>;
}
