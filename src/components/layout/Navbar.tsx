import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bell, 
  UserCheck, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  Calculator, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Users, 
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Badge } from '../common/Badge';
import { UserRole } from '../../models/insurance';

export const Navbar: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleSelect = async (r: UserRole) => {
    await switchRole(r);
    setRoleSwitcherOpen(false);
    navigate('/dashboard');
  };

  const getNavLinks = () => {
    switch (role) {
      case 'guardian':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: Layers },
          { name: 'Get Quote', path: '/quotes/new', icon: Calculator },
          { name: 'My Policies', path: '/policies', icon: ShieldCheck },
          { name: 'Claims', path: '/claims', icon: FileText },
          { name: 'Continuity Gap', path: '/continuity', icon: Sparkles },
          { name: 'AI Policy Assistant', path: '/ai-assistant', icon: Sparkles },
        ];
      case 'student':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: Layers },
          { name: 'My Protection', path: '/policies', icon: ShieldCheck },
          { name: 'Continuity Gap', path: '/continuity', icon: Sparkles },
          { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles },
        ];
      case 'claims_officer':
        return [
          { name: 'Claims Work Queue', path: '/dashboard', icon: Briefcase },
          { name: 'All Claims', path: '/claims', icon: FileText },
          { name: 'Active Policies', path: '/policies', icon: ShieldCheck },
          { name: 'AI Document Triage', path: '/ai-assistant', icon: Sparkles },
        ];
      case 'university':
        return [
          { name: 'Verification Queue', path: '/university/verification', icon: GraduationCap },
          { name: 'Institution Dashboard', path: '/dashboard', icon: Layers },
          { name: 'Reports & Payouts', path: '/reports', icon: FileText },
        ];
      case 'admin':
        return [
          { name: 'Admin Dashboard', path: '/dashboard', icon: Layers },
          { name: 'Users & Roles', path: '/admin/users', icon: Users },
          { name: 'Insurance Plans', path: '/admin/plans', icon: ShieldCheck },
          { name: 'Business Rules', path: '/admin/rules', icon: SlidersHorizontal },
          { name: 'Audit Reports', path: '/reports', icon: FileText },
        ];
      default:
        return [{ name: 'Dashboard', path: '/dashboard', icon: Layers }];
    }
  };

  const links = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-900 via-brand-700 to-teal-700 bg-clip-text text-transparent">
                  EduShield
                </span>
                <span className="block text-[10px] font-semibold text-teal-600 tracking-wider uppercase -mt-1">
                  AI Education Insurance
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Interactive Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
                title="Switch active role for demonstration"
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Role:</span>
                <Badge role={role} />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Demo Perspective Switcher
                  </div>
                  <button
                    onClick={() => handleRoleSelect('guardian')}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between ${
                      role === 'guardian' ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>Parent / Guardian</span>
                    <Badge role="guardian" />
                  </button>
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between ${
                      role === 'student' ? 'bg-teal-50 text-teal-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>Student</span>
                    <Badge role="student" />
                  </button>
                  <button
                    onClick={() => handleRoleSelect('claims_officer')}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between ${
                      role === 'claims_officer' ? 'bg-purple-50 text-purple-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>Claims Officer</span>
                    <Badge role="claims_officer" />
                  </button>
                  <button
                    onClick={() => handleRoleSelect('university')}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between ${
                      role === 'university' ? 'bg-amber-50 text-amber-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>University Registrar</span>
                    <Badge role="university" />
                  </button>
                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between ${
                      role === 'admin' ? 'bg-rose-50 text-rose-700 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>Administrator</span>
                    <Badge role="admin" />
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h4>
                    <span className="text-[11px] text-slate-500">{unreadCount} unread</span>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No notifications right now</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.linkUrl) navigate(n.linkUrl);
                            setNotifDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg cursor-pointer transition text-xs ${
                            n.read ? 'bg-slate-50/70 text-slate-600' : 'bg-blue-50/60 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="font-semibold text-slate-900">{n.title}</div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                  {user?.displayName || 'Demo User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="p-1.5 border rounded-lg text-xs"
            >
              <Badge role={role} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
