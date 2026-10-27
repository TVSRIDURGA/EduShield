import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Search } from 'lucide-react';
import { UsersRepo } from '../../repositories/firestoreRepo';
import { UserProfile, UserRole } from '../../models/insurance';
import { Badge } from '../../components/common/Badge';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const all = await UsersRepo.getAll();
      setUsers(all);
    }
    load();
  }, []);

  const filtered = users.filter(u => 
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">User Name</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Assigned Role</th>
                <th className="px-6 py-3">Affiliation / Org</th>
                <th className="px-6 py-3">UID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-4 font-bold text-slate-900">{u.displayName}</td>
                  <td className="px-6 py-4 text-slate-600">{u.email}</td>
                  <td className="px-6 py-4"><Badge role={u.role} /></td>
                  <td className="px-6 py-4 text-slate-600">
                    {u.universityId ? 'IIT Delhi Registrar' : u.role === 'claims_officer' ? 'EduShield Claims Desk' : 'Direct Consumer'}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{u.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
