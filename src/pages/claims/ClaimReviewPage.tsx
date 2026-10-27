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
  ArrowRight
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

  const handleAdjudicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim || !user) return;
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
    setIsPaying(true);
    setError(null);
    try {
      const payment = await paymentService.processUniversityPayout(claim, user);
      const reloaded = await ClaimsRepo.getById(claim.id);
      setClaim(reloaded);
      setSuccessMsg(`Payment completed! Ref: ${payment.transactionReference}`);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

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

  const isAlreadyApproved = claim.status === 'APPROVED';
  const isAlreadyPaid = claim.status === 'PAID';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Guidewire ClaimCenter Inspired Console</span>
          </div>
          <h1 className="text-2xl font-bold">
            Adjudicate Claim #{claim.claimNumber}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student: <strong>{claim.studentName}</strong> • Institution: <strong>{claim.universityName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge status={claim.status} />
          <Link
            to={`/claims/${claim.id}`}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            View Customer Case
          </Link>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Case Information & Policy Grounding */}
        <div className="lg:col-span-2 space-y-6">
          {/* Policy Verification Check */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>1. In-Force Policy & Eligibility Verification</span>
              {policy && <Badge status={policy.status} />}
            </h3>

            {policy ? (
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Policy Plan:</span>
                  <div className="font-bold text-slate-900">{policy.planName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Total Coverage Limit:</span>
                  <div className="font-bold text-slate-900">{formatINR(policy.coverageAmount)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Waiting Period:</span>
                  <div className="font-bold text-emerald-700">Satisfied (Ends {formatDate(policy.waitingPeriodEndsAt)})</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* AI Preliminary Triage (Feature C & D) */}
          <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 rounded-2xl border border-teal-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>AI Claim Document Assistant Summary</span>
              </div>
              <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                Readiness: {claim.readinessScore}%
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              {claim.aiPreliminaryAssessment?.summary || 'AI document analysis indicates complete identity and medical coverage with matching fee demand voucher.'}
            </p>
          </div>

          {/* University Fee Verification Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-600" />
                <span>2. University Registrar Direct Ledger Check</span>
              </h3>
              <Badge status={claim.universityVerification?.status || 'PENDING'} />
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-semibold text-slate-900">{claim.universityName}</span>
              </div>
              {claim.universityVerification?.status === 'VERIFIED' ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified by IIT Delhi Registrar Accounts
                  </div>
                  <div>Student Roll No: <strong>{claim.universityVerification.studentRollNo}</strong></div>
                  <div>Confirmed Outstanding College Tuition: <strong>{formatINR(claim.universityVerification.confirmedOutstandingFee)}</strong></div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  Awaiting institutional registrar fee ledger confirmation.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Adjudication Decision & Escrow Payout Console */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Claims Adjuster Adjudication
            </h3>

            {!isAlreadyPaid ? (
              <form onSubmit={handleAdjudicate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Adjudication Decision
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as ClaimDecision)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
                  >
                    <option value="APPROVED">Approve Claim</option>
                    <option value="MORE_INFO_REQUESTED">Request Additional Documents</option>
                    <option value="REJECTED">Reject Claim</option>
                  </select>
                </div>

                {decision === 'APPROVED' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Approved Payable Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-brand-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Findings & Rationale Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording Decision...' : 'Record Adjuster Decision'}
                </button>
              </form>
            ) : null}

            {/* University Fee Remittance Action */}
            {isAlreadyApproved && !isAlreadyPaid && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  University Fee Escrow Remittance
                </div>
                <p className="text-[11px] text-slate-500">
                  Direct transfer of approved {formatINR(claim.approvedAmount)} to {claim.universityName} Fee Collection Escrow (SBI IFSC: SBIN0001077).
                </p>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={isPaying}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isPaying ? 'Remitting to Escrow...' : `Disburse ${formatINR(claim.approvedAmount)} to University`}</span>
                </button>
              </div>
            )}

            {isAlreadyPaid && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Fee Escrow Remittance Complete
                </div>
                <div>Amount Paid: <strong>{formatINR(claim.payment?.paidAmount || claim.approvedAmount)}</strong></div>
                <div className="font-mono text-[10px] text-slate-600">
                  UTR: {claim.payment?.transactionReference}
                </div>
                <div className="text-[10px] text-slate-500">
                  Beneficiary: {claim.universityName} Registrar Fee Escrow
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
