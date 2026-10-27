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
  AlertTriangle
} from 'lucide-react';
import { PoliciesRepo } from '../../repositories/firestoreRepo';
import { EducationPolicy } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';

export const PolicyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
          <Link
            to="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            <span>File a Claim</span>
          </Link>
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
              <strong>Waiting Period Satisfied:</strong> The initial {policy.waitingPeriodDays}-day waiting period ended on {formatDate(policy.waitingPeriodEndsAt)}. All covered emergency claims are fully active.
            </div>
          </>
        ) : (
          <>
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <strong>Active Waiting Period:</strong> Initial policy waiting period ends on {formatDate(policy.waitingPeriodEndsAt)}. Accidental death is covered with zero waiting period.
            </div>
          </>
        )}
      </div>

      {/* Policy Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Policyholder & Student Identification
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase">Policyholder / Guardian</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{policy.guardianName}</div>
                <div className="text-slate-500 mt-0.5">{policy.guardianEmail}</div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase">Insured Student</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{policy.studentName}</div>
                <div className="text-slate-500 mt-0.5">{policy.universityName}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Covered Benefits & Riders
            </h3>

            <div className="space-y-3">
              {policy.benefits.map((b) => (
                <div key={b.benefitCode} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="font-bold text-brand-700">{formatINR(b.coverageLimit)}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Coverage & Premium
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan Tier:</span>
                <span className="font-bold text-slate-900">{policy.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maximum Limit:</span>
                <span className="font-bold text-slate-900 text-sm">{formatINR(policy.coverageAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Annual Premium:</span>
                <span className="font-bold text-brand-700">{formatINR(policy.totalAnnualPremium)}/yr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Renewal Due Date:</span>
                <span className="font-medium text-slate-900">{formatDate(policy.renewalDueDate)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Payment Reference: <br />
              <code className="text-slate-600 font-mono text-[10px]">{policy.paymentReference || 'SIM-DIRECT'}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
