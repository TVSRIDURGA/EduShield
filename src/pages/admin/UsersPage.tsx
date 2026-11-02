import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  UserCheck, 
  Search, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UsersRepo, UniversitiesRepo, AuditsRepo } from '../../repositories/firestoreRepo';
import { UserProfile, UserRole, University, AccountStatus } from '../../models/insurance';
import { Badge } from '../../components/common/Badge';
import { auditService } from '../../services/auditService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('guardian');
  const [newStatus, setNewStatus] = useState<AccountStatus>('APPROVED');
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
    setNewRole(u.role || 'guardian');
    setNewStatus(u.accountStatus || (u.role ? 'APPROVED' : 'PENDING'));
    setNewUnivId(u.universityId || 'univ_iitd');
    setStatusMessage(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !currentUser) return;
    setIsUpdating(true);
    setStatusMessage(null);

    try {
      const canonicalUid = editingUser.uid || editingUser.id;
      if (!canonicalUid) {
        throw new Error('User record has no valid UID or ID.');
      }

      const fullProfile: UserProfile = {
        ...editingUser,
        id: canonicalUid,
        uid: canonicalUid,
        role: newRole,
        accountStatus: newStatus,
        ...(newRole === 'university' && newUnivId ? { universityId: newUnivId } : {}),
        approvedAt: newStatus === 'APPROVED' ? new Date().toISOString() : undefined,
        approvedBy: currentUser.email || currentUser.id,
        updatedAt: new Date().toISOString()
      };

      // Sanitize object for Firestore to eliminate undefined properties
      const sanitizedDoc: any = {};
      for (const [k, v] of Object.entries(fullProfile)) {
        if (v !== undefined) {
          sanitizedDoc[k] = v;
        }
      }
      if (newRole !== 'university') {
        sanitizedDoc.universityId = null;
      }

      // 1. Persist directly to canonical Firestore document /users/{uid} FIRST.
      // Must succeed before reporting success to user.
      const userDocRef = doc(db, 'users', canonicalUid);
      await setDoc(userDocRef, sanitizedDoc, { merge: true });

      // If editingUser.id was a secondary alias different from canonicalUid, sync it as well
      if (editingUser.id && editingUser.id !== canonicalUid) {
        try {
          await setDoc(doc(db, 'users', editingUser.id), sanitizedDoc, { merge: true });
        } catch {
          // Non-blocking secondary alias sync
        }
      }

      // 2. Only after Firestore confirmation: update local repository cache
      await UsersRepo.create(fullProfile);
      if (editingUser.id && editingUser.id !== canonicalUid) {
        await UsersRepo.update(editingUser.id, fullProfile);
      }

      // 3. Update React UI state
      setUsers(prev => prev.map(u => 
        (u.id === canonicalUid || u.uid === canonicalUid || (u.email && editingUser.email && u.email.toLowerCase() === editingUser.email.toLowerCase())) 
          ? fullProfile 
          : u
      ));

      // 4. Record immutable audit log
      const isApproval = editingUser.accountStatus !== 'APPROVED' && newStatus === 'APPROVED';
      await auditService.log(
        isApproval ? 'ADMIN_ACCOUNT_APPROVAL' : 'ADMIN_ROLE_CHANGE',
        'USER',
        canonicalUid,
        { id: currentUser.id, name: currentUser.displayName, role: currentUser.role || 'admin' },
        `Administrator ${currentUser.displayName} ${isApproval ? 'approved account' : 'updated privileges'} for ${editingUser.displayName} (${editingUser.email}): status=[${newStatus}], role=[${newRole}]${newRole === 'university' ? `, institution=[${newUnivId}]` : ''}.`
      );

      setStatusMessage(`Successfully updated ${editingUser.displayName}: Status=[${newStatus}], Role=[${newRole}]. Persisted to Firestore.`);
      setEditingUser(null);
    } catch (err: any) {
      console.error('Failed to update user account in Firestore:', err);
      setStatusMessage(`Error saving approval to database: ${err.message || 'Operation failed. Verify administrator privileges.'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingCount = users.filter(u => u.accountStatus === 'PENDING' || !u.role).length;
  const approvedCount = users.filter(u => (u.accountStatus === 'APPROVED' || (!u.accountStatus && u.role))).length;

  const filtered = users.filter(u => {
    const effectiveStatus: AccountStatus = u.accountStatus || (u.role ? 'APPROVED' : 'PENDING');
    const matchSearch = 
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role ? u.role.toLowerCase().includes(search.toLowerCase()) : false) ||
      (u.uid ? u.uid.toLowerCase().includes(search.toLowerCase()) : false);

    const matchRole = 
      roleFilter === 'ALL' || 
      (roleFilter === 'NO_ROLE' && !u.role) ||
      u.role === roleFilter;

    const matchStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
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

      {/* Status Alert Message */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Action Required Banner for Pending Accounts */}
      {pendingCount > 0 && statusFilter !== 'PENDING' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs uppercase tracking-wide text-amber-800">
                Action Required: Pending Account Approvals
              </div>
              <div className="text-xs text-amber-700">
                {pendingCount} authenticated account(s) are awaiting administrator role verification.
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
          >
            <span>Review Pending Accounts ({pendingCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">In directory</div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-xs ${pendingCount > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Pending Approvals</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Awaiting assignment</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Approved Accounts</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Active access granted</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Building className="w-3 h-3" />
            <span>Partner Universities</span>
          </div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">{universities.length}</div>
          <div className="text-[11px] text-indigo-600 mt-0.5">Dedicated registrars</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, role, or UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="ALL">All Account Statuses</option>
          <option value="PENDING">Pending Approval ({pendingCount})</option>
          <option value="APPROVED">Approved ({approvedCount})</option>
          <option value="REJECTED">Suspended / Rejected</option>
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="ALL">All Roles ({users.length})</option>
          <option value="NO_ROLE">No Role Assigned</option>
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
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Affiliation / Org</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs">
                    No user accounts match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const effectiveStatus: AccountStatus = u.accountStatus || (u.role ? 'APPROVED' : 'PENDING');
                  const isPending = effectiveStatus === 'PENDING' || !u.role;

                  return (
                    <tr key={u.id} className={`transition ${isPending ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{u.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {u.uid || u.id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="px-6 py-4">
                        <Badge status={effectiveStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge role={u.role} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {u.universityId 
                          ? (universities.find(un => un.id === u.universityId)?.name || 'Partner University') 
                          : u.role === 'claims_officer' 
                            ? 'EduShield Claims Desk' 
                            : u.role === 'admin'
                              ? 'EduShield Operations'
                              : u.role === 'guardian'
                                ? 'Policyholder / Consumer'
                                : u.role === 'student'
                                  ? 'Enrolled Student'
                                  : 'Pending Role Assignment'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => handleEditClick(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Review & Approve</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditClick(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Role</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit User Role & Account Approval */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser.accountStatus === 'PENDING' || !editingUser.role 
                    ? 'Review & Approve Account' 
                    : 'Manage Role & Access'}
                </h3>
                <p className="text-xs text-slate-500">Authorized administrative account provisioning</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div><span className="text-slate-500">Applicant:</span> <strong className="text-slate-900">{editingUser.displayName}</strong></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-mono text-slate-700">{editingUser.email}</span></div>
              <div><span className="text-slate-500">UID:</span> <span className="font-mono text-slate-500 text-[10px]">{editingUser.uid || editingUser.id}</span></div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-slate-500">Current Status:</span> 
                <Badge status={editingUser.accountStatus || (editingUser.role ? 'APPROVED' : 'PENDING')} />
                <Badge role={editingUser.role} />
              </div>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3.5 text-xs">
              {/* Account Status Selection */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AccountStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="APPROVED">APPROVED — Grant Authorized Access</option>
                  <option value="PENDING">PENDING — Under Administrator Review</option>
                  <option value="REJECTED">REJECTED — Deny / Suspend Access</option>
                </select>
              </div>

              {/* Role Selection */}
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

              {/* Institution Selection for University Registrar */}
              {newRole === 'university' && (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Partner University
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
                🔒 All account approvals and role assignments are immutably logged with your administrator signature under Guidewire compliance standards.
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
                  {isUpdating ? 'Saving...' : 'Save & Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
