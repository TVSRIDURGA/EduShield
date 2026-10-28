import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bell, 
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
  Layers,
  Building,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getNavLinks = () => {
    if (!role) {
      return [{ name: 'Dashboard', path: '/dashboard', icon: Layers }];
    }

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
          { name: 'Reports & Ledgers', path: '/reports', icon: FileText },
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
                      ? 'bg-brand-50 text-brand-700 font-semibold'
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
            {/* Authenticated Role Badge (Verified, Read-Only) */}
            {role && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                <span className="text-slate-500 text-[11px] font-medium">Role:</span>
                <Badge role={role} />
                {user?.universityId && role === 'university' && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    IIT Delhi
                  </span>
                )}
              </div>
            )}

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

            {/* Authenticated User Identity Area */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs shadow-inner">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Sign out securely"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {role && <Badge role={role} />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-2">
          {user && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">{user.displayName}</div>
                <div className="text-[11px] text-slate-500">{user.email}</div>
              </div>
              {role && <Badge role={role} />}
            </div>
          )}

          <div className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-semibold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Securely</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
