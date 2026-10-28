import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Search, Edit3, CheckCircle2, AlertCircle, Building } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UsersRepo, UniversitiesRepo, AuditsRepo } from '../../repositories/firestoreRepo';
import { UserProfile, UserRole, University } from '../../models/insurance';
import { Badge } from '../../components/common/Badge';
import { auditService } from '../../services/auditService';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('guardian');
  const [newUnivId, setNewUnivId] = useState<string>('univ_iitd');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [allUsers, allUnivs] = await Promise.all([
        UsersRepo.getAll(),
        UniversitiesRepo.getAll()
      ]);
      setUsers(allUsers);
      setUniversities(allUnivs);
    }
    load();
  }, []);

  const handleEditClick = (u: UserProfile) => {
    setEditingUser(u);
    setNewRole(u.role);
    setNewUnivId(u.universityId || 'univ_iitd');
    setStatusMessage(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !currentUser) return;
    setIsUpdating(true);

    try {
      const updates: Partial<UserProfile> = {
        role: newRole,
        universityId: newRole === 'university' ? newUnivId : undefined,
        updatedAt: new Date().toISOString()
      };

      await UsersRepo.update(editingUser.id, updates);

      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));

      // Record audit log
      await auditService.log(
        'ADMIN_ROLE_CHANGE',
        'USER',
        editingUser.id,
        { id: currentUser.id, name: currentUser.displayName, role: currentUser.role },
        `Administrator changed role of user ${editingUser.displayName} (${editingUser.email}) from [${editingUser.role}] to [${newRole}]${newRole === 'university' ? ` (Univ: ${newUnivId})` : ''}.`
      );

      setStatusMessage(`Successfully updated ${editingUser.displayName} to role [${newRole}].`);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Failed to update role:', err);
      setStatusMessage(`Error updating role: ${err.message || 'Operation failed'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = 
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Role-Based Access Control Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Accounts & Role Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer system roles: Guardians, Students, Claims Adjusters, University Registrars, and Administrators.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="ALL">All Roles ({users.length})</option>
          <option value="guardian">Guardians</option>
          <option value="student">Students</option>
          <option value="claims_officer">Claims Officers</option>
          <option value="university">University Registrars</option>
          <option value="admin">Administrators</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User Name</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Affiliation / Org</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{u.displayName}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="px-6 py-4"><Badge role={u.role} /></td>
                  <td className="px-6 py-4 text-slate-600">
                    {u.universityId 
                      ? (universities.find(un => un.id === u.universityId)?.name || 'Partner University') 
                      : u.role === 'claims_officer' 
                        ? 'EduShield Claims Desk' 
                        : u.role === 'admin'
                          ? 'EduShield Operations'
                          : 'Policyholder / Consumer'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit Role</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit User Role */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage Role Assignment</h3>
                <p className="text-xs text-slate-500">Authorized administrative role provisioning</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div><span className="text-slate-500">Target User:</span> <strong className="text-slate-900">{editingUser.displayName}</strong></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-mono text-slate-700">{editingUser.email}</span></div>
              <div><span className="text-slate-500">Current Role:</span> <Badge role={editingUser.role} /></div>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Authorized Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="guardian">Parent / Guardian</option>
                  <option value="student">Student</option>
                  <option value="claims_officer">Claims Officer</option>
                  <option value="university">University Registrar</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newRole === 'university' && (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Institution
                  </label>
                  <select
                    value={newUnivId}
                    onChange={(e) => setNewUnivId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                ⚠️ All role transitions are immutably logged with your administrator signature under Guidewire compliance standards.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
