import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../models/insurance';
import { LoadingSkeleton } from './LoadingSkeleton';
import { UnauthorizedPage } from '../../pages/auth/UnauthorizedPage';
import { Clock, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  // Not authenticated -> redirect to login with replace: true so back navigation doesn't expose protected pages
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Valid roles list
  const validRoles: UserRole[] = ['guardian', 'student', 'claims_officer', 'university', 'admin'];

  // Role not yet assigned or unverified
  if (!role || !validRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Account Access Pending</h2>
          <p className="text-xs text-slate-500">
            Your user account ({user.email}) has been authenticated, but an authorized role assignment is currently pending administrator verification.
          </p>
          <div className="p-3 rounded-lg bg-slate-50 text-[11px] text-slate-600 font-mono">
            User ID: {user.uid}
          </div>
          <p className="text-[11px] text-slate-400">
            Please contact your system administrator or university coordinator to provision your account privileges.
          </p>
        </div>
      </div>
    );
  }

  // Role check if route is role-restricted
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <UnauthorizedPage requiredRoles={allowedRoles} />;
  }

  return <>{children}</>;
};
