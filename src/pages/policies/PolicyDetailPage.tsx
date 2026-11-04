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
  ArrowLeft,
  RefreshCw,
  XCircle,
  FileCheck,
  CreditCard,
  Scale,
  History,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PoliciesRepo, ClaimsRepo } from '../../repositories/firestoreRepo';
import { policyService } from '../../services/policyService';
import { policyEngine } from '../../services/policyEngine';
import { EducationPolicy } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const PolicyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [policy, setPolicy] = useState<EducationPolicy | null>(null);
  const [hasClaims, setHasClaims] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals & tabs
  const [activeTab, setActiveTab] = useState<'benefits' | 'limits' | 'terms' | 'history'>('benefits');
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Graduated or transferred institution');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const pol = await PoliciesRepo.getById(id);
        setPolicy(pol);

        if (pol) {
          const claims = await ClaimsRepo.findBy('policyId', pol.id);
          setHasClaims(claims.length > 0);
        }
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
  const renewalEligibility = policyEngine.evaluateRenewalEligibility(policy);
  const renewalCalc = policyEngine.calculateRenewalPremium(policy);
  const refundEstimate = policyEngine.calculateCancellationRefund(policy, hasClaims);

  const handleRenew = async () => {
    if (!user) return;
    setActionProcessing(true);
    setFeedback(null);
    try {
      const updated = await policyService.renewPolicy(policy.id, user, paymentMethod);
      setPolicy(updated);
      setRenewModalOpen(false);
      setFeedback({ type: 'success', message: `Policy successfully renewed through ${formatDate(updated.expiryDate)}!` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Renewal processing failed.' });
    } finally {
      setActionProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setActionProcessing(true);
    setFeedback(null);
    try {
      const updated = await policyService.cancelPolicy(policy.id, cancelReason, user, hasClaims);
      setPolicy(updated);
      setCancelModalOpen(false);
      setFeedback({ 
        type: 'success', 
        message: `Policy successfully cancelled. Refund processed: ${formatINR(refundEstimate.eligibleRefund)} via ${refundEstimate.methodApplied}.` 
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Cancellation request failed.' });
    } finally {
      setActionProcessing(false);
    }
  };

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
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {policy.productCode || 'POLICY'} v{policy.policyVersion || '1.0.0'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Certificate of Education Insurance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Effective from {formatDate(policy.effectiveDate)} • Active till {formatDate(policy.expiryDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {role === 'guardian' && policy.status === 'ACTIVE' && (
            <Link
              to="/claims/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <FileText className="w-4 h-4" />
              <span>File Claim</span>
            </Link>
          )}

          {(role === 'guardian' || role === 'admin') && (policy.status === 'ACTIVE' || policy.status === 'RENEWAL_DUE') && (
            <button
              onClick={() => setRenewModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew Policy</span>
            </button>
          )}

          {(role === 'guardian' || role === 'admin') && policy.status === 'ACTIVE' && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Policy</span>
            </button>
          )}

          <Link
            to="/ai-assistant"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 font-semibold text-xs transition"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Ask Policy AI</span>
          </Link>
        </div>
      </div>

      {feedback && <Alert type={feedback.type}>{feedback.message}</Alert>}

      {/* Snapshot Verification Badge for Claims Officers & Adjusters */}
      {(role === 'claims_officer' || role === 'admin') && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-indigo-700 shrink-0" />
            <div>
              <span className="font-bold">Claims Officer Adjudication View: Contract Snapshot v{policy.policyVersion || '1.0.0'}</span>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                Claims must be evaluated against this immutable policy contract snapshot. Subsequent changes to product templates do not affect this bound policy.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-white px-2 py-1 rounded border border-indigo-200">
            {policy.termsAcceptance ? 'Terms Signed' : 'Legacy Issuance'}
          </span>
        </div>
      )}

      {/* Waiting Period Notice */}
      <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
        isWaitingPeriodOver 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        {isWaitingPeriodOver ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Initial Waiting Period Completed</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                The {policy.waitingPeriodDays}-day statutory waiting period elapsed on {formatDate(policy.waitingPeriodEndsAt)}. Full coverage is active.
              </p>
            </div>
          </>
        ) : (
          <>
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
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
            {policy.paymentFrequency && (
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Frequency:</span>
                <span className="font-semibold text-slate-800">{policy.paymentFrequency}</span>
              </div>
            )}
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
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Version:</span>
              <span className="font-mono font-semibold text-slate-700">v{policy.policyVersion || '1.0.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Deep Policy Administration Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-4 py-3 border-b-2 transition ${
              activeTab === 'benefits'
                ? 'border-brand-600 text-brand-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Covered Benefits ({policy.benefits.length})
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`px-4 py-3 border-b-2 transition ${
              activeTab === 'limits'
                ? 'border-brand-600 text-brand-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Financial Limits & Deductibles
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-3 border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-brand-600 text-brand-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Contract Terms & Exclusions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-brand-600 text-brand-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Policy History ({policy.stateHistory?.length || 1})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: BENEFITS */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Included Coverage Benefits</h4>
                <span className="text-xs text-slate-500">Sum Insured: {formatINR(policy.coverageAmount)}</span>
              </div>
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

              {policy.selectedAddonBenefits && policy.selectedAddonBenefits.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Optional Add-On Riders Selected</h4>
                  <div className="space-y-2">
                    {policy.selectedAddonBenefits.map((addon) => (
                      <div key={addon.id} className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-medium text-amber-950">{addon.name}</span>
                          <p className="text-[10px] text-amber-800">{addon.description}</p>
                        </div>
                        <span className="font-bold text-amber-900">{formatINR(addon.benefitAmount || addon.maxBenefitAmount)} Cover</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINANCIAL LIMITS */}
          {activeTab === 'limits' && (
            <div className="space-y-4 text-xs">
              <h4 className="text-sm font-bold text-slate-900">Configured Financial Limits Snapshot</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Sum Insured</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{formatINR(policy.coverageAmount)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Per-Event Limit</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {formatINR(policy.financialLimitsSnapshot?.perEventLimit || policy.coverageAmount)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Deductible</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {formatINR(policy.financialLimitsSnapshot?.deductibleAmount || 0)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Co-Payment</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {policy.financialLimitsSnapshot?.coPaymentPercent || 0}%
                  </span>
                </div>
              </div>

              {policy.financialLimitsSnapshot?.sublimits && policy.financialLimitsSnapshot.sublimits.length > 0 && (
                <div className="mt-4">
                  <span className="font-bold text-slate-700 block mb-2">Category Sublimits:</span>
                  <div className="space-y-1.5">
                    {policy.financialLimitsSnapshot.sublimits.map((sub, i) => (
                      <div key={i} className="flex justify-between p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="capitalize">{sub.benefitCategory.replace(/_/g, ' ')}</span>
                        <span className="font-bold">{formatINR(sub.limitAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTRACT TERMS & EXCLUSIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <h4 className="text-sm font-bold text-slate-900">Statutory Exclusions & Contractual Terms</h4>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">Explicitly Excluded Risks:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {policy.exclusions.map((ex, idx) => (
                    <li key={idx}>{ex}</li>
                  ))}
                </ul>
              </div>

              {policy.termsAcceptance && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <span className="font-bold block mb-1">Contract Execution Record</span>
                  <p className="text-[11px]">
                    Terms version <strong>v{policy.termsAcceptance.policyVersion}</strong> accepted by{' '}
                    <strong>{policy.termsAcceptance.userEmail}</strong> on{' '}
                    <strong>{formatDate(policy.termsAcceptance.acceptedAt)}</strong>. Statutory enrollment declaration confirmed.
                  </p>
                </div>
              )}

              {policy.termsWordingSnapshot && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block">Contractual Terms & Responsibilities:</span>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Disclosure Obligation:</strong> {policy.termsWordingSnapshot.disclosureObligations}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Waiting Period Clauses:</strong> {policy.termsWordingSnapshot.waitingPeriodClauses}
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Dispute Resolution:</strong> {policy.termsWordingSnapshot.disputeResolutionProcess}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4 text-xs">
              <h4 className="text-sm font-bold text-slate-900">Policy Lifecycle & Transaction Audit Trail</h4>
              
              <div className="space-y-3">
                {policy.stateHistory && policy.stateHistory.length > 0 ? (
                  policy.stateHistory.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                      <History className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-800">{item.fromStatus} → {item.toStatus}</span>
                          <span className="text-slate-400">{formatDate(item.timestamp)}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{item.reason}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Actor: {item.actorName} ({item.actorRole})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">Initial policy binding record logged.</div>
                )}
              </div>

              {policy.renewalHistory && policy.renewalHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h5 className="font-bold text-slate-800 mb-2">Renewal Cycles:</h5>
                  <div className="space-y-2">
                    {policy.renewalHistory.map((ren) => (
                      <div key={ren.id} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 flex justify-between">
                        <div>
                          <span className="font-bold">{ren.renewalNumber}</span>
                          <p className="text-[11px]">Extended to {formatDate(ren.newExpiryDate)}</p>
                        </div>
                        <span className="font-bold">{formatINR(ren.renewalPremium)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RENEWAL MODAL */}
      {renewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <RefreshCw className="w-5 h-5" />
                <span>Renew Policy Contract</span>
              </div>
              <button
                onClick={() => setRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Expiry:</span>
                <span className="font-semibold text-slate-800">{formatDate(policy.expiryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Renewal Status:</span>
                <span className="font-bold text-emerald-700">{renewalEligibility.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Renewal Discount (5%):</span>
                <span className="text-emerald-600 font-semibold">-{formatINR(renewalCalc.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-brand-900 pt-2 border-t border-slate-200">
                <span>Payable Renewal Premium:</span>
                <span className="text-brand-700">{formatINR(renewalCalc.finalRenewalPayable)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Simulated Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['UPI', 'NetBanking', 'Debit Card'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-3 rounded-lg border font-medium transition ${
                      paymentMethod === method
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRenew}
              disabled={actionProcessing || !renewalEligibility.isEligible}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionProcessing ? 'Processing Renewal...' : `Confirm & Pay ${formatINR(renewalCalc.finalRenewalPayable)}`}
            </button>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                <XCircle className="w-5 h-5" />
                <span>Request Policy Cancellation</span>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1.5">
              <span className="font-bold block">Refund Estimation:</span>
              <p className="text-[11px] leading-relaxed">{refundEstimate.explanation}</p>
              <div className="pt-2 border-t border-rose-200 flex justify-between font-bold text-sm">
                <span>Calculated Refund:</span>
                <span className="text-emerald-700">{formatINR(refundEstimate.eligibleRefund)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="Graduated or transferred institution">Graduated or transferred institution</option>
                <option value="Obtained alternative employer education cover">Obtained alternative employer education cover</option>
                <option value="Unsatisfied with policy terms during free-look">Unsatisfied with policy terms during free-look</option>
                <option value="Financial hardship">Financial hardship</option>
                <option value="Other administrative grounds">Other administrative grounds</option>
              </select>
            </div>

            <button
              onClick={handleCancel}
              disabled={actionProcessing}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionProcessing ? 'Cancelling...' : `Confirm Cancellation (${formatINR(refundEstimate.eligibleRefund)} Refund)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};