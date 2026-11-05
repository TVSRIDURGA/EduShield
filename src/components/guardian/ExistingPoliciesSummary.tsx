import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Download, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { EducationPolicy, EducationClaim, Student } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';

interface ExistingPoliciesSummaryProps {
  policies: EducationPolicy[];
  claims: EducationClaim[];
  students: Student[];
  onOpenNewQuote: () => void;
}

export const ExistingPoliciesSummary: React.FC<ExistingPoliciesSummaryProps> = ({
  policies,
  claims,
  students,
  onOpenNewQuote
}) => {
  return (
    <div className="space-y-6">
      {/* Active Policies List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-600" />
              <span>Active Family Policies &amp; Insured Children</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified university fee protection contracts safeguarding higher education degrees
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewQuote}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-700 hover:bg-pink-800 text-white font-bold text-xs shadow-md transition self-start sm:self-auto"
          >
            <span>Protect Another Child / Degree</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {policies.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-800">No Active Policies Bound Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You haven't bound an education policy contract yet. Use our protection calculator to customize your child's degree coverage.
              </p>
            </div>
            <button
              onClick={onOpenNewQuote}
              className="px-6 py-3 rounded-full bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold shadow-md transition"
            >
              Calculate &amp; Bind First Policy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {policies.map((policy) => {
              const matchedStudent = students.find(s => s.id === policy.studentId);
              const relatedClaims = claims.filter(c => c.policyId === policy.id);

              return (
                <div 
                  key={policy.id}
                  className="rounded-2xl border border-slate-200/90 hover:border-sky-300 bg-white p-5 shadow-xs transition space-y-4 hover:shadow-md"
                >
                  {/* Card Header: Student Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">{policy.studentName}</span>
                        <Badge status={policy.status} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{policy.universityName}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">{policy.policyNumber}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Sum Insured</span>
                      <span className="text-lg font-black text-brand-700 block">
                        {formatINR(policy.coverageAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Coverage Details Grid */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Premium Status</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">
                        {formatINR(policy.totalAnnualPremium)}/yr <span className="text-emerald-600 font-semibold">(Paid)</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Valid Until</span>
                      <span className="font-bold text-slate-800 mt-0.5 block flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(policy.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {/* Claims in Progress on this Policy if any */}
                  {relatedClaims.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Active Claim In Adjudication</span>
                        </span>
                        <Badge status={relatedClaims[0].status} />
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        Claim #{relatedClaims[0].claimNumber} • Requested {formatINR(relatedClaims[0].requestedAmount)} • Direct university escrow verification underway.
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      Version: <strong className="text-slate-600 font-mono">v{policy.policyVersion || '1.0.0'} (Immutable)</strong>
                    </span>
                    <Link
                      to={`/policies/${policy.id}`}
                      className="font-bold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 hover:underline"
                    >
                      <span>Digital Policy &amp; Terms</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
