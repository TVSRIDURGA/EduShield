import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle, ChevronRight, Filter, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimsRepo } from '../../repositories/firestoreRepo';
import { EducationClaim } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const ClaimListPage: React.FC = () => {
  const { user, role } = useAuth();
  const [claims, setClaims] = useState<EducationClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        const all = await ClaimsRepo.getAll();
        const isDemoGuardian = user?.email === 'guardian@edushield.demo';
        const isDemoStudent = user?.email === 'student@edushield.demo';
        const isDemoUniv = user?.email === 'university@edushield.demo';

        if (role === 'admin' || role === 'claims_officer') {
          setClaims(all);
        } else if (role === 'student') {
          setClaims(all.filter(c => 
            c.studentId === user?.id || 
            (isDemoStudent && c.id === 'clm_active_1') ||
            c.studentName.toLowerCase() === user?.displayName.toLowerCase()
          ));
        } else if (role === 'university') {
          const univId = user?.universityId || (isDemoUniv ? 'univ_iitd' : '');
          setClaims(all.filter(c => c.universityId === univId));
        } else {
          // Guardian
          setClaims(all.filter(c => 
            c.guardianId === user?.id || 
            (isDemoGuardian && c.guardianId === 'usr_guardian_1')
          ));
        }
      } catch (err) {
        console.error('Failed to load claims:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, role]);

  const filtered = claims.filter(c => {
    const matchSearch = 
      c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.universityName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Claims Lifecycle & Adjudication</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Education Insurance Claims
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track document readiness, university ledger certifications, and direct institutional remittances.
          </p>
        </div>

        {role === 'guardian' && (
          <Link
            to="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Claim</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search claims by number, student name, or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="ALL">All Statuses ({claims.length})</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="DOCUMENTS_REQUIRED">Documents Required</option>
          <option value="UNIVERSITY_VERIFICATION_PENDING">Univ Pending</option>
          <option value="ASSESSMENT">Assessment</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid / Remitted</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Claims Found"
          description={
            role === 'guardian'
              ? "No claims match your criteria. If an unexpected emergency occurs, you can submit a claim online."
              : "No claims found matching your filter criteria."
          }
          actionText={role === 'guardian' ? "Submit a Claim" : undefined}
          onAction={role === 'guardian' ? () => window.location.href = '/claims/new' : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                    {claim.claimNumber}
                  </span>
                  <Badge status={claim.status} />
                  <span className="text-xs text-slate-400">Filed {formatDate(claim.createdAt)}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {claim.claimType.replace('_', ' ')} — {claim.studentName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {claim.universityName} • Policy #{claim.policyNumber}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs pt-1">
                  <div>
                    <span className="text-slate-400">Claimed Tuition: </span>
                    <strong className="text-slate-900">{formatINR(claim.requestedAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">AI Readiness Score: </span>
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                      {claim.readinessScore}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(role === 'claims_officer' || role === 'admin') && (
                  <Link
                    to={`/claims/${claim.id}/review`}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs border border-purple-200 transition"
                  >
                    Adjuster Console
                  </Link>
                )}
                <Link
                  to={`/claims/${claim.id}`}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
