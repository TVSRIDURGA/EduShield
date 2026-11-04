import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  GraduationCap,
  Coins,
  RefreshCw,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { quoteService } from '../../services/quoteService';
import { policyService } from '../../services/policyService';
import { ProductsRepo } from '../../repositories/firestoreRepo';
import { Quote, InsuranceProduct, TermsAcceptanceRecord, CoverageBenefitConfig } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [product, setProduct] = useState<InsuranceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const q = await quoteService.getById(id);
        setQuote(q);

        if (q) {
          const prods = await ProductsRepo.getAll();
          const matched = prods.find(p => p.id === q.productId || p.id === q.planId || p.code === q.productCode);
          if (matched) {
            setProduct(matched);
          }
        }
      } catch (err) {
        console.error('Failed to load quote details:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePurchase = async () => {
    if (!quote || !user || role !== 'guardian') return;
    if (!termsAccepted || !declarationConfirmed) {
      setError('You must read and accept the Policy Terms and confirm the true student declaration before proceeding.');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      const termsRecord: TermsAcceptanceRecord = {
        userId: user.id,
        userEmail: user.email,
        policyId: 'pending',
        policyVersion: quote.policyVersion || product?.currentVersion || '1.0.0',
        acceptedAt: new Date().toISOString(),
        declarationConfirmed: true,
        ipAddress: '127.0.0.1 (Authenticated Client Session)'
      };

      // Bind policy from quote with simulated transaction and contractual terms acceptance
      const policy = await policyService.bindPolicyFromQuote(quote, user, paymentMethod, termsRecord);
      setPaymentModalOpen(false);
      navigate(`/policies/${policy.id}`);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">Loading quote details...</div>;
  }

  if (!quote) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">Quote Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This quote may have expired or is unavailable.</p>
        <Link to="/quotes/new" className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold">
          Create New Quote
        </Link>
      </div>
    );
  }

  const isAccepted = quote.status === 'ACCEPTED';
  // waitingPeriodDays is on the Quote directly; product has it per-benefit
  const waitingDays = quote.waitingPeriodDays
    || product?.coverageBenefits?.[0]?.waitingPeriodDays
    || 30;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">{quote.quoteNumber}</span>
            <Badge status={quote.status} />
            {product && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-bold">
                {product.code} v{quote.policyVersion || product.currentVersion}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Education Insurance Quote &amp; Contract Preview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generated on {formatDate(quote.calculatedAt)} • Guaranteed until {formatDate(quote.expiresAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/policies/compare"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            Compare Plans
          </Link>

          {isAccepted ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Policy Already Bound &amp; Active</span>
            </div>
          ) : role === 'guardian' ? (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Purchase &amp; Activate Policy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
              <span>View-only: Payments reserved for Parent / Guardian</span>
            </div>
          )}
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Main Quote Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Covered student, university, benefits, exclusions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-600" />
              <span>Insured Student &amp; Academic Institution</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase">Covered Student</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{quote.studentName}</div>
                <div className="text-slate-500 mt-0.5">{quote.courseName} ({quote.policyDurationYears} Years)</div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase">Partner University</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{quote.universityName}</div>
                <div className="text-slate-500 mt-0.5">Verified Registrar Fee Escrow</div>
              </div>
            </div>
          </div>

          {/* Benefits Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Included Benefit Schedule ({quote.planName})</span>
              </span>
              <span className="text-xs font-normal text-slate-500">
                Sum Insured: <strong className="text-slate-800">{formatINR(quote.coverageAmount)}</strong>
              </span>
            </h3>

            <div className="space-y-3">
              {quote.benefits.map((b) => (
                <div key={b.benefitCode} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="font-bold text-brand-700">{formatINR(b.coverageLimit)}</span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>

            {/* Selected Add-on Riders if any */}
            {quote.selectedAddons && quote.selectedAddons.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>Selected Optional Riders / Add-ons</span>
                </h4>
                <div className="space-y-2">
                  {quote.selectedAddons.map((addon: CoverageBenefitConfig) => (
                    <div key={addon.id} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs flex justify-between items-center">
                      <span className="font-medium text-amber-950">{addon.name}</span>
                      <div className="text-right">
                        <span className="font-bold text-amber-900">{formatINR(addon.benefitAmount)} Cover</span>
                        <span className="text-[10px] text-amber-700 ml-2">(+{formatINR(addon.addonPremium)}/yr)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Limits, Deductibles & Co-pay */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-600" />
              <span>Financial Limits &amp; Deductibles</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Sum Insured</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{formatINR(quote.coverageAmount)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Per-Event Limit</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatINR(product?.financialLimits?.perEventLimit || quote.coverageAmount)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Deductible</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatINR(product?.financialLimits?.deductibleAmount ?? 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Co-Payment</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {(product?.financialLimits?.coPaymentPercent ?? 0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Policy Exclusions & Waiting Period */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Policy Exclusions &amp; Waiting Period</span>
            </h3>

            <div className="text-xs space-y-3 text-slate-600">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Initial Inception Waiting Period: <strong>{waitingDays} Days</strong>. Claims occurring before this period are non-compensable except for accidental trauma.
                </span>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800">Explicitly Excluded Events &amp; Conditions:</span>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 leading-relaxed">
                  {quote.exclusions && quote.exclusions.length > 0 ? (
                    quote.exclusions.map((exc, idx) => <li key={idx}>{exc}</li>)
                  ) : product?.exclusions && product.exclusions.length > 0 ? (
                    product.exclusions.map((exc) => (
                      <li key={exc.id}>
                        <strong>{exc.title}:</strong> {exc.detailedExplanation}
                      </li>
                    ))
                  ) : (
                    <li>Standard statutory educational exclusions apply.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Cancellation & Free-Look Terms */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <span>Free-Look &amp; Cancellation Terms</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              <strong>15-Day Free-Look Period:</strong> The policyholder may cancel this policy within 15 days of policy inception for a 100% refund of premium paid (net of statutory stamp charges), provided no claim has been lodged.
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Short-Period Scale:</strong> Cancellations after 15 days follow the short-period retention scale: Up to 1 month: 80% refund; Up to 3 months: 60% refund; Up to 6 months: 40% refund; Beyond 6 months: 0% refund. No refund is payable if any claim has been registered.
            </p>
          </div>
        </div>

        {/* Right Column: Pricing Summary Card & Terms Acceptance */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Premium Schedule Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>College Cover Limit:</span>
                <span className="font-bold text-slate-900 text-sm">{formatINR(quote.coverageAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Base Annual Rate:</span>
                <span className="font-medium">{formatINR(quote.basePremium)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Risk &amp; Term Adjustments:</span>
                <span className="font-medium text-emerald-600">
                  {quote.riskFactorAdjustment >= 0 ? `+${formatINR(quote.riskFactorAdjustment)}` : formatINR(quote.riskFactorAdjustment)}
                </span>
              </div>
              {quote.selectedAddons && quote.selectedAddons.length > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Riders / Add-ons ({quote.selectedAddons.length}):</span>
                  <span className="font-medium text-amber-700">
                    +{formatINR(quote.selectedAddons.reduce((s: number, a: CoverageBenefitConfig) => s + a.addonPremium, 0))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Statutory GST (18%):</span>
                <span className="font-medium">{formatINR(quote.taxAmount)}</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-black text-brand-900">
                <span>Total Annual Premium:</span>
                <span className="text-brand-700">{formatINR(quote.totalAnnualPremium)}/yr</span>
              </div>

              {quote.frequency && quote.frequency !== 'ANNUAL' && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-medium text-[11px]">
                  Payment Frequency: <strong>{quote.frequency}</strong> — each installment:{' '}
                  <strong>{formatINR(quote.frequencyPayableAmount || quote.totalAnnualPremium)}</strong>.
                </div>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            {!isAccepted && role === 'guardian' && (
              <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-slate-700 leading-tight">
                    I have reviewed and agree to the <strong>Contractual Policy Terms</strong>, Exclusion Schedule, and Waiting Period for{' '}
                    <strong>{quote.planName} (v{quote.policyVersion || product?.currentVersion || '1.0.0'})</strong>.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationConfirmed}
                    onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-slate-700 leading-tight">
                    I confirm that the student is actively enrolled at <strong>{quote.universityName}</strong> and all declarations are accurate.
                  </span>
                </label>

                <button
                  onClick={() => setPaymentModalOpen(true)}
                  disabled={!termsAccepted || !declarationConfirmed}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Purchase &amp; Bind Policy</span>
                </button>
              </div>
            )}

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Upon purchase, an immutable Policy Contract snapshot is generated and signed with your verified identity.
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-brand-700 font-bold text-base">
                <CreditCard className="w-5 h-5" />
                <span>Policy Premium Checkout</span>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              ⚠️ <strong>Academic Project Simulation:</strong> No real bank charges or debit cards will be billed. This processes a simulated sandbox payment transaction for project evaluation.
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Insured Student:</span>
                <span className="font-semibold text-slate-800">{quote.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Plan:</span>
                <span className="font-semibold text-slate-800">{quote.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Policy Version:</span>
                <span className="font-mono text-slate-800">v{quote.policyVersion || product?.currentVersion || '1.0.0'}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-brand-900 pt-2 border-t border-slate-200">
                <span>Amount to Pay Now:</span>
                <span className="text-brand-700">
                  {formatINR(quote.frequencyPayableAmount || quote.totalAnnualPremium)}
                </span>
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
                        ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 p-2.5 rounded bg-slate-50 border border-slate-200">
              Contract Terms Accepted by: <strong>{user?.email}</strong> at {new Date().toLocaleTimeString()}
            </div>

            <button
              onClick={handlePurchase}
              disabled={processingPayment}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processingPayment ? 'Binding Contract...' : `Simulate Pay ${formatINR(quote.frequencyPayableAmount || quote.totalAnnualPremium)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
