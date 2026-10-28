import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Download,
  AlertTriangle,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PoliciesRepo } from '../../repositories/firestoreRepo';
import { EducationPolicy } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';

export const PolicyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [policy, setPolicy] = useState<EducationPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const pol = await PoliciesRepo.getById(id);
        setPolicy(pol);
      } catch (err) {
        console.error('Failed to load policy:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">Loading policy certificate...</div>;
  }

  if (!policy) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">Policy Not Found</h2>
        <Link to="/policies" className="mt-4 inline-block text-brand-600 font-semibold text-sm">
          Return to Policies
        </Link>
      </div>
    );
  }

  // Authorization Check
  const isDemoGuardian = user?.email === 'guardian@edushield.demo';
  const isDemoStudent = user?.email === 'student@edushield.demo';
  const isDemoUniv = user?.email === 'university@edushield.demo';

  const isAuthorized = 
    role === 'admin' ||
    role === 'claims_officer' ||
    (role === 'guardian' && (policy.guardianId === user?.id || (isDemoGuardian && policy.guardianId === 'usr_guardian_1'))) ||
    (role === 'student' && (policy.studentId === user?.id || policy.studentName.toLowerCase() === user?.displayName.toLowerCase() || (isDemoStudent && policy.id === 'pol_active_aarav'))) ||
    (role === 'university' && (policy.universityId === user?.universityId || (isDemoUniv && policy.universityId === 'univ_iitd')));

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500">
          You do not possess authorized credentials to inspect this education policy certificate. Policies are restricted strictly to the authorized parent, student beneficiary, or assigned claims adjuster.
        </p>
        <Link
          to="/policies"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Policies</span>
        </Link>
      </div>
    );
  }

  const isWaitingPeriodOver = new Date() >= new Date(policy.waitingPeriodEndsAt);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              {policy.policyNumber}
            </span>
            <Badge status={policy.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Certificate of Education Insurance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Effective from {formatDate(policy.effectiveDate)} • Active till {formatDate(policy.expiryDate)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role === 'guardian' && (
            <Link
              to="/claims/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <FileText className="w-4 h-4" />
              <span>File a Claim</span>
            </Link>
          )}
          <Link
            to="/ai-assistant"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-semibold text-xs transition"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Ask Policy AI</span>
          </Link>
        </div>
      </div>

      {/* Waiting Period Notice */}
      <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
        isWaitingPeriodOver 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        {isWaitingPeriodOver ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Initial Waiting Period Completed</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                The {policy.waitingPeriodDays}-day statutory waiting period elapsed on {formatDate(policy.waitingPeriodEndsAt)}. Full coverage is active.
              </p>
            </div>
          </>
        ) : (
          <>
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Waiting Period In Progress</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Initial {policy.waitingPeriodDays}-day waiting period ends on {formatDate(policy.waitingPeriodEndsAt)}. Non-accidental claims subject to waiting clause.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Grid: Policy Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Insured Student & University */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Insured Student & University
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Covered Student Beneficiary:</span>
              <span className="font-bold text-slate-900">{policy.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Institution:</span>
              <span className="font-semibold text-slate-900 text-right">{policy.universityName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Policyholder / Guardian:</span>
              <span className="font-semibold text-slate-900">{policy.guardianName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Transaction Ref:</span>
              <span className="font-mono text-slate-700">{policy.paymentReference || 'SIM-PAY-PROCESSED'}</span>
            </div>
          </div>
        </div>

        {/* Coverage & Premium */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Coverage & Actuarial Limits
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Cover Limit:</span>
              <span className="text-base font-bold text-brand-700">{formatINR(policy.coverageAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Annual Premium:</span>
              <span className="font-bold text-slate-900">{formatINR(policy.totalAnnualPremium)}/year</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Plan Tier:</span>
              <span className="font-semibold text-slate-900">{policy.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Renewal Due Date:</span>
              <span className="font-semibold text-slate-900">{formatDate(policy.renewalDueDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Included Benefits Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Schedule of Covered Benefits & Limits
        </h3>
        <div className="space-y-3">
          {policy.benefits.map((b, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">{b.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{b.description}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-brand-700">{formatINR(b.coverageLimit)}</div>
                <div className="text-[10px] text-slate-400">Deductible: {formatINR(b.deductible)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exclusions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2">Policy Exclusions</h3>
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
          {policy.exclusions.map((ex, idx) => (
            <li key={idx}>{ex}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
