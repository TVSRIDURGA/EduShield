import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  AlertCircle,
  Building,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { quoteService } from '../../services/quoteService';
import { policyService } from '../../services/policyService';
import { Quote } from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const q = await quoteService.getById(id);
        setQuote(q);
      } catch (err) {
        console.error('Failed to load quote:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePurchase = async () => {
    if (!quote || !user || role !== 'guardian') return;
    setProcessingPayment(true);
    setError(null);

    try {
      // Bind policy from quote with simulated transaction
      const policy = await policyService.bindPolicyFromQuote(quote, user, paymentMethod);
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">{quote.quoteNumber}</span>
            <Badge status={quote.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Education Insurance Quote
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generated on {formatDate(quote.calculatedAt)} • Guaranteed until {formatDate(quote.expiresAt)}
          </p>
        </div>

        <div>
          {isAccepted ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Policy Already Bound & Active</span>
            </div>
          ) : role === 'guardian' ? (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Purchase & Activate Policy</span>
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
        {/* Left Column: Covered student, university, benefits */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Insured Student & Academic Institution
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
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Included Benefit Schedule ({quote.planName})
            </h3>

            <div className="space-y-3">
              {quote.benefits.map((b) => (
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

          {/* Policy Exclusions & Waiting Period */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Terms, Exclusions & Waiting Period
            </h3>

            <div className="text-xs space-y-3 text-slate-600">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                ⏳ Initial Policy Waiting Period: <strong>{quote.waitingPeriodDays} Days</strong> from inception date.
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-800">Standard Exclusions:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {quote.exclusions.map((exc, idx) => (
                    <li key={idx}>{exc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Premium Schedule
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total College Cover:</span>
                <span className="font-bold text-slate-900 text-sm">{formatINR(quote.coverageAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Base Annual Premium:</span>
                <span className="font-medium">{formatINR(quote.basePremium)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Risk & Term Adjustment:</span>
                <span className="font-medium text-emerald-600">
                  {quote.riskFactorAdjustment >= 0 ? `+${formatINR(quote.riskFactorAdjustment)}` : formatINR(quote.riskFactorAdjustment)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Statutory GST (18%):</span>
                <span className="font-medium">{formatINR(quote.taxAmount)}</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-black text-brand-900">
                <span>Payable Annual Premium:</span>
                <span className="text-brand-700">{formatINR(quote.totalAnnualPremium)}/yr</span>
              </div>
            </div>

            {!isAccepted && (
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Purchase Policy</span>
              </button>
            )}

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Upon purchase, policy certificate EDU-{new Date().getFullYear()}-XXXXX is generated instantly.
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Payment Modal */}
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
              <div className="flex justify-between text-sm font-bold text-brand-900 pt-2 border-t border-slate-200">
                <span>Amount to Pay:</span>
                <span className="text-brand-700">{formatINR(quote.totalAnnualPremium)}</span>
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

            <button
              onClick={handlePurchase}
              disabled={processingPayment}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processingPayment ? 'Binding Policy...' : `Simulate Pay ${formatINR(quote.totalAnnualPremium)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
