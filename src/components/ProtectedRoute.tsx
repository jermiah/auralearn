import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'teacher' | 'parent';
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();

  // Wait for auth to load
  if (!clerkLoaded || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in - redirect to sign in
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Signed in but no role selected - redirect to role selection
  if (!user?.role) {
    return <Navigate to="/select-role" replace />;
  }

  // Role requirement check
  if (requireRole && user.role !== requireRole) {
    // Wrong role - redirect to appropriate dashboard
    if (user.role === 'teacher') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/parent-guide" replace />;
    }
  }

  return <>{children}</>;
}
