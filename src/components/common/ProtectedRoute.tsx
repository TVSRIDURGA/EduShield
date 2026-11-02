import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../models/insurance';
import { LoadingSkeleton } from './LoadingSkeleton';
import { UnauthorizedPage } from '../../pages/auth/UnauthorizedPage';
import { Clock, ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading, refreshUser, logout } = useAuth();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

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

  const validRoles: UserRole[] = ['guardian', 'student', 'claims_officer', 'university', 'admin'];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      const fresh = await refreshUser();
      if (fresh?.accountStatus === 'APPROVED' && fresh?.role && validRoles.includes(fresh.role)) {
        setRefreshMsg('Account approved! Accessing dashboard...');
      } else {
        setRefreshMsg('Verification still pending administrator approval.');
      }
    } catch {
      setRefreshMsg('Failed to refresh status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Account explicitly REJECTED
  if (user.accountStatus === 'REJECTED') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Account Access Suspended</h2>
          <p className="text-xs text-slate-500">
            Your user account ({user.email}) has been reviewed and access is currently suspended or declined by the system administrator.
          </p>
          <div className="p-3 rounded-lg bg-slate-50 text-[11px] text-slate-600 font-mono">
            User ID: {user.uid}
          </div>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Role not yet assigned or unverified or accountStatus is PENDING
  if (!role || !validRoles.includes(role) || user.accountStatus === 'PENDING') {
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
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            Status: <strong>Pending Administrator Review</strong>
          </div>
          <p className="text-[11px] text-slate-400">
            Please contact your system administrator or university coordinator to provision your account privileges.
          </p>
          {refreshMsg && (
            <div className="p-2 text-[11px] rounded bg-slate-100 text-slate-700">
              {refreshMsg}
            </div>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking...' : 'Check Status'}</span>
            </button>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
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
