import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/common/Badge';
import { UserRole } from '../../models/insurance';

interface UnauthorizedPageProps {
  requiredRoles?: UserRole[];
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ requiredRoles }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Access Restricted</span>
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Role Authorization Required
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            This module is protected by EduShield Role-Based Access Control (RBAC). Your authenticated account does not possess the requisite operational privileges.
          </p>
        </div>

        {/* Current Identity Details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Authenticated User:</span>
            <span className="font-bold text-slate-900 truncate max-w-[200px]">{user?.displayName || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Account Email:</span>
            <span className="text-slate-700 font-mono text-[11px] truncate max-w-[200px]">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-slate-500">Assigned Role:</span>
            {role ? <Badge role={role} /> : <span className="text-amber-600 font-semibold">Pending Assignment</span>}
          </div>
          {requiredRoles && requiredRoles.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Required Roles:</span>
              <span className="font-semibold text-slate-700 text-[11px]">
                {requiredRoles.map(r => r.replace('_', ' ')).join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Authorized Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
