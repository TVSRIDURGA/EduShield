import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, PlusCircle, Clock, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PoliciesRepo } from '../../repositories/firestoreRepo';
import { EducationPolicy } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

export const PolicyListPage: React.FC = () => {
  const { user, role } = useAuth();
  const [policies, setPolicies] = useState<EducationPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await PoliciesRepo.getAll();
        if (role === 'admin' || role === 'claims_officer') {
          setPolicies(all);
        } else {
          setPolicies(all.filter(p => p.guardianId === user?.id || user?.email === 'guardian@edushield.demo'));
        }
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, role]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Policy Portfolio Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Education Insurance Policies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View active coverage, waiting periods, benefit limits, and renewal dates.
          </p>
        </div>

        {role === 'guardian' && (
          <Link
            to="/quotes/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Get New Policy Quote</span>
          </Link>
        )}
      </div>

      {policies.length === 0 ? (
        <EmptyState
          title="No Policies Bound"
          description="You do not have any active education insurance policies currently bound."
          actionText="Get a Policy Quote"
          onAction={() => window.location.href = '/quotes/new'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {policies.map((pol) => (
            <div
              key={pol.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                    {pol.policyNumber}
                  </span>
                  <Badge status={pol.status} />
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-bold text-slate-900">{pol.studentName}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">{pol.universityName}</div>
                  <div className="text-xs font-medium text-brand-700 mt-1">{pol.planName}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Total Cover Limit:</span>
                    <div className="font-bold text-slate-900 text-sm">{formatINR(pol.coverageAmount)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Annual Premium:</span>
                    <div className="font-bold text-slate-900 text-sm">{formatINR(pol.totalAnnualPremium)}/yr</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Expires: {formatDate(pol.expiryDate)}
                </span>
                <Link
                  to={`/policies/${pol.id}`}
                  className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  View Policy <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
