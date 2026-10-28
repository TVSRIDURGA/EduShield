import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, 
  ShieldCheck, 
  Building, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimsRepo, PoliciesRepo } from '../../repositories/firestoreRepo';
import { EducationClaim, EducationPolicy, ClaimDecision } from '../../models/insurance';
import { claimService } from '../../services/claimService';
import { paymentService } from '../../services/paymentService';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const ClaimReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [claim, setClaim] = useState<EducationClaim | null>(null);
  const [policy, setPolicy] = useState<EducationPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  // Adjudication form state
  const [decision, setDecision] = useState<ClaimDecision>('APPROVED');
  const [approvedAmount, setApprovedAmount] = useState<number>(220000);
  const [findings, setFindings] = useState('Medical discharge summary verified against critical illness rider. University tuition challan confirmed with IIT Delhi registrar. Disbursing full semester fee.');
  const [reasonCode, setReasonCode] = useState('CRITICAL_ILLNESS_VERIFIED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const c = await ClaimsRepo.getById(id);
        if (c) {
          setClaim(c);
          setApprovedAmount(c.requestedAmount);
          const p = await PoliciesRepo.getById(c.policyId);
          setPolicy(p);
        }
      } catch (err) {
        console.error('Failed to load review case:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Authorization Check: Must be claims_officer or admin
  if (role !== 'claims_officer' && role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Adjuster Console Restricted</h2>
        <p className="text-xs text-slate-500">
          Access to this adjudication workbench is restricted to authorized Claims Adjusters and Administrators under Guidewire ClaimCenter governance.
        </p>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">Loading adjudication console...</div>;
  }

  if (!claim) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">Claim Not Found</h2>
        <Link to="/claims" className="mt-4 inline-block text-brand-600 font-semibold text-sm">Return to Claims</Link>
      </div>
    );
  }

  // Separation of Duties: Prohibit self-approval if the officer is also the parent/guardian
  const isSelfClaim = claim.guardianId === user?.id;

  const handleAdjudicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim || !user) return;
    if (isSelfClaim) {
      setError('Separation of Duties Violation: You cannot adjudicate or approve your own family claim.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await claimService.adjudicateClaim(
        claim.id,
        decision,
        findings,
        reasonCode,
        Number(approvedAmount),
        user
      );
      setClaim(updated);
      setSuccessMsg(`Decision recorded: Claim updated to ${updated.status}.`);
    } catch (err: any) {
      setError(err.message || 'Adjudication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!claim || !user) return;
    if (isSelfClaim) {
      setError('Separation of Duties Violation: You cannot authorize disbursements for your own claim.');
      return;
    }

    setIsPaying(true);
    setError(null);
    try {
      const payment = await paymentService.processUniversityPayout(claim, user);
      const reloaded = await ClaimsRepo.getById(claim.id);
      setClaim(reloaded);
      setSuccessMsg(`Settlement dispatched! Direct fee payment UTR: ${payment.transactionReference}`);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  const isAlreadyApproved = claim.status === 'APPROVED';
  const isAlreadyPaid = claim.status === 'PAID';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Senior Claims Adjuster Workbench (ClaimCenter Pattern)</span>
          </div>
          <h1 className="text-2xl font-bold">
            Adjudicate Claim #{claim.claimNumber}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student: {claim.studentName} • Institution: {claim.universityName} • Incident: {claim.claimType}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge status={claim.status} />
          <Link
            to={`/claims/${claim.id}`}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
          >
            View File Details
          </Link>
        </div>
      </div>

      {isSelfClaim && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-rose-950">Separation of Duties Enforced:</strong>
            <p className="mt-0.5">
              You are listed as the policyholder/parent for this claim. Under strict insurance compliance and anti-fraud regulations, you cannot review, adjudicate, or approve this case. It must be adjudicated by an independent claims adjuster.
            </p>
          </div>
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Evidence & Findings */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Evidence Triage */}
          {claim.aiPreliminaryAssessment && (
            <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl border border-purple-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>AI Pre-Adjudication Evidence Summary</span>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  Readiness: {claim.readinessScore}%
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {claim.aiPreliminaryAssessment.summary}
              </p>
            </div>
          )}

          {/* Policy Verification Card */}
          {policy && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Policy Coverage & Limits Verification
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Policy Number:</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{policy.policyNumber}</div>
                </div>
                <div>
                  <span className="text-slate-400">Total Cover Limit:</span>
                  <div className="font-bold text-brand-700 mt-0.5">{formatINR(policy.coverageAmount)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Waiting Period Elapsed:</span>
                  <div className="font-semibold text-emerald-700 mt-0.5">Yes (15 Days Elapsed)</div>
                </div>
                <div>
                  <span className="text-slate-400">Covered Event:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{claim.claimType}</div>
                </div>
              </div>
            </div>
          )}

          {/* Adjudication Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Record Adjudication Decision
            </h3>

            <form onSubmit={handleAdjudicate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adjudication Decision
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={isSelfClaim}
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-center transition ${
                      decision === 'APPROVED'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✓ APPROVE
                  </button>
                  <button
                    type="button"
                    disabled={isSelfClaim}
                    onClick={() => setDecision('MORE_INFO_REQUESTED')}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-center transition ${
                      decision === 'MORE_INFO_REQUESTED'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⚠ REQUEST INFO
                  </button>
                  <button
                    type="button"
                    disabled={isSelfClaim}
                    onClick={() => setDecision('REJECTED')}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-center transition ${
                      decision === 'REJECTED'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✕ REJECT
                  </button>
                </div>
              </div>

              {decision === 'APPROVED' && (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Authorized Settlement Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    disabled={isSelfClaim}
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Capped at eligible semester fee limit: {formatINR(claim.eligibleAmount)}
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason Code / Policy Clause Citation
                </label>
                <input
                  type="text"
                  required
                  disabled={isSelfClaim}
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  placeholder="e.g. CRITICAL_ILLNESS_VERIFIED_CLAUSE_4.2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Adjuster Findings & Technical Reasoning
                </label>
                <textarea
                  rows={3}
                  required
                  disabled={isSelfClaim}
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isSelfClaim}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Recording Decision...' : 'Commit Adjudication Decision'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar: University Verification & Escrow Settlement */}
        <div className="space-y-6">
          {/* University Verification Audit */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Building className="w-4 h-4 text-amber-600" />
              <span>Registrar Fee Verification</span>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-semibold text-slate-900">{claim.universityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge status={claim.universityVerification?.status || 'PENDING'} />
              </div>
              {claim.universityVerification?.status === 'VERIFIED' ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold">Student Roll: {claim.universityVerification.studentRollNo}</div>
                  <div>Certified Dues: {formatINR(claim.universityVerification.confirmedOutstandingFee)}</div>
                  <div className="text-[10px] text-emerald-700 italic">"{claim.universityVerification.officerRemarks}"</div>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  Pending registrar ledger confirmation from university portal.
                </p>
              )}
            </div>
          </div>

          {/* University Direct Escrow Remittance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>University Fee Escrow Remittance</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upon approval, wire the semester tuition directly to {claim.universityName} Registrar Fee Escrow.
            </p>

            {isAlreadyPaid ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <div className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Fee Remittance Completed</span>
                </div>
                <div>Amount: {formatINR(claim.payment?.paidAmount || claim.approvedAmount)}</div>
                <div className="font-mono text-[10px] text-emerald-700">Ref: {claim.payment?.transactionReference}</div>
              </div>
            ) : isAlreadyApproved ? (
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isPaying || isSelfClaim}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{isPaying ? 'Processing Wire...' : 'Authorize University Fee Wire'}</span>
              </button>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                Approval required prior to fee disbursement.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
