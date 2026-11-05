import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  Edit3, 
  ChevronDown, 
  Scale, 
  Percent, 
  Building2, 
  FileText,
  AlertTriangle,
  Award,
  Zap,
  Info
} from 'lucide-react';
import { 
  InsuranceProduct, 
  PaymentFrequency, 
  CoverageBenefitConfig, 
  Student 
} from '../../models/insurance';
import { formatINR } from '../../utils/businessRules';
import { policyEngine } from '../../services/policyEngine';

interface PolicyCustomizationStudioProps {
  parentName: string;
  student: Student;
  product: InsuranceProduct;
  initialCoverageAmount: number;
  initialDurationYears: number;
  initialFrequency: PaymentFrequency;
  hasMeritDiscount: boolean;
  hasGenderDiscount: boolean;
  onEditInfo: () => void;
  onLockQuote: (customization: {
    coverageAmount: number;
    durationYears: number;
    frequency: PaymentFrequency;
    selectedAddonIds: string[];
    totalAnnualPremium: number;
    frequencyInstallmentAmount: number;
    discountAmount: number;
    taxAmount: number;
  }) => void;
}

export const PolicyCustomizationStudio: React.FC<PolicyCustomizationStudioProps> = ({
  parentName,
  student,
  product,
  initialCoverageAmount,
  initialDurationYears,
  initialFrequency,
  hasMeritDiscount,
  hasGenderDiscount,
  onEditInfo,
  onLockQuote
}) => {
  const [coverageAmount, setCoverageAmount] = useState<number>(initialCoverageAmount || 2000000);
  const [durationYears, setDurationYears] = useState<number>(initialDurationYears || 4);
  const [frequency, setFrequency] = useState<PaymentFrequency>(initialFrequency || 'ANNUAL');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(['cov_cmp_laptop']);

  // Available Coverage limits to select from
  const availableCoverageOptions = [
    { label: '₹ 10 Lakhs', value: 1000000 },
    { label: '₹ 15 Lakhs', value: 1500000 },
    { label: '₹ 20 Lakhs', value: 2000000, isRecommended: true },
    { label: '₹ 25 Lakhs', value: 2500000 },
    { label: '₹ 35 Lakhs', value: 3500000 },
    { label: '₹ 50 Lakhs (Scholar Elite)', value: 5000000 }
  ];

  // Optional Add-on Riders available in the product
  const addonRiders = (product.coverageBenefits || []).filter(b => b.isOptionalAddon);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  // Student age
  const birthDate = new Date(student.dateOfBirth);
  const now = new Date();
  let studentAge = now.getFullYear() - birthDate.getFullYear();
  if (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) {
    studentAge--;
  }

  // Live actuarial premium calculation through central engine!
  const meritDiscountCode = hasMeritDiscount
    ? (product.premiumConfig?.discounts?.find(d => d.code === 'MERIT_10')?.code || 'MERIT_10')
    : undefined;

  const calcResult = policyEngine.calculateEnterprisePremium({
    annualTuitionFee: Math.round(coverageAmount / durationYears * 0.75),
    otherEligibleExpenses: Math.round(coverageAmount / durationYears * 0.25),
    policyDurationYears: durationYears,
    product,
    studentAge: Math.max(16, studentAge),
    selectedAddonIds,
    frequency,
    discountCode: meritDiscountCode
  });

  // Guarantee 10% merit discount when selected
  const meritDiscountAmount = hasMeritDiscount
    ? (calcResult.discountAmount > 0 ? calcResult.discountAmount : Math.round(calcResult.subtotal * 0.10))
    : 0;

  // Additional 5% discount if female parent profile
  const genderDiscountAmount = hasGenderDiscount ? Math.round(calcResult.subtotal * 0.05) : 0;
  const netSubtotal = Math.max(0, calcResult.subtotal - meritDiscountAmount - genderDiscountAmount);
  const netTax = Math.round(netSubtotal * 0.18);
  const finalTotalAnnual = netSubtotal + netTax;

  const multiplier = product.premiumConfig?.frequencyMultipliers?.[frequency] || 1.0;
  const finalInstallment = Math.round(finalTotalAnnual * multiplier);

  // Helper for Duration Pricing tabs (Image 1 right card)
  const getDurationPricePreview = (years: number) => {
    const preview = policyEngine.calculateEnterprisePremium({
      annualTuitionFee: Math.round(coverageAmount / years * 0.75),
      otherEligibleExpenses: Math.round(coverageAmount / years * 0.25),
      policyDurationYears: years,
      product,
      studentAge: Math.max(16, studentAge),
      selectedAddonIds,
      frequency: 'ANNUAL'
    });
    return preview.totalAnnualPremium;
  };

  const handleProceedToLock = () => {
    onLockQuote({
      coverageAmount,
      durationYears,
      frequency,
      selectedAddonIds,
      totalAnnualPremium: finalTotalAnnual,
      frequencyInstallmentAmount: finalInstallment,
      discountAmount: meritDiscountAmount + genderDiscountAmount,
      taxAmount: netTax
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ============================================================ */}
      {/* IMAGE 1 TOP: Step Header with Edit Info                      */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">
            Step 1/4: Plan Customization
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {parentName}, customize {student.fullName}'s Education Protection Plan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {student.universityName} • {student.courseName}
          </p>
        </div>

        <button
          type="button"
          onClick={onEditInfo}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit Info</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* IMAGE 1 MAIN: 2-Column Customization Layout                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT CARD: Education Cover Dropdown & Payment Frequency */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          {/* 1. Life Cover / Education Cover (i) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                <span>Education Cover</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <span className="text-[11px] text-slate-400">Total Degree Protection</span>
            </div>

            {/* Custom styled select box matching Image 1 */}
            <div className="relative">
              <select
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-slate-300 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition outline-hidden cursor-pointer shadow-2xs pr-10"
              >
                {availableCoverageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.isRecommended ? '— Recommended for 4-Yr Degree' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                {coverageAmount === 2000000 && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Recommended
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          {/* 2. Premium Payment Term */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Premium Payment Term
              </label>
              <span className="text-[11px] font-semibold text-emerald-600">
                Save up to 10% by paying annually
              </span>
            </div>

            <div className="relative">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition outline-hidden cursor-pointer shadow-2xs pr-10"
              >
                <option value="ANNUAL">Pay Annually (Recommended — Zero Surcharge)</option>
                <option value="SEMI_ANNUAL">Pay Semi-Annually (2 installments / year)</option>
                <option value="QUARTERLY">Pay Quarterly (4 installments / year)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3. Optional Add-on Riders */}
          {addonRiders.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span>Optional Student Riders</span>
                </span>
                <span className="text-[11px] text-slate-400">Customizable</span>
              </div>

              <div className="space-y-2">
                {addonRiders.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`cursor-pointer p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                        isChecked
                          ? 'bg-amber-50/70 border-amber-300 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                            isChecked ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-bold block text-slate-900">{addon.name}</span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            {addon.description}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold text-amber-800 block">+{formatINR(addon.addonPremium)}/yr</span>
                        <span className="text-[10px] text-slate-400">Cover: {formatINR(addon.benefitAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CARD: Cover Duration Tabs & Green Free-Look Guarantee (Image 1 Right) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5 relative overflow-hidden">
            {/* Title */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                <span>Cover Duration / Academic Term</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <span className="text-[11px] text-slate-500 font-medium">B.Tech Standard (4 Yrs)</span>
            </div>

            {/* Segmented Duration Tabs with Prices (Matching Image 1 Right Box) */}
            <div className="grid grid-cols-4 rounded-2xl border border-slate-300 overflow-hidden bg-white p-1 gap-1">
              {[4, 3, 2, 1].map((years) => {
                const isSelected = durationYears === years;
                const price = getDurationPricePreview(years);
                return (
                  <button
                    key={years}
                    type="button"
                    onClick={() => setDurationYears(years)}
                    className={`py-3 px-1 rounded-xl transition flex flex-col items-center justify-center text-center ${
                      isSelected
                        ? 'bg-[#eef8fc] text-slate-900 border-b-2 border-b-sky-600 border-t border-l border-r border-sky-300 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span className="text-xs font-black block">{years} {years === 1 ? 'Year' : 'Years'}</span>
                    <span className="text-[11px] font-bold text-sky-700 mt-0.5 block">
                      {formatINR(price)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Green Highlight Card Underneath (Exact Match to Image 1) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 text-xs text-emerald-900 space-y-1">
              <div className="flex items-start gap-2">
                <div className="p-0.5 rounded-full bg-emerald-600 text-white shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <span className="font-extrabold text-emerald-950">Free of Cost: </span>
                  <span className="text-emerald-800 leading-relaxed">
                    Option to exit the plan and get your <strong>100% premium refund</strong>* within the 15-day statutory Free-Look period with zero cancellation charges.
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle Indian/Academic Diya & Trust Seal Touch */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>IRDAI-Compliant Academic Protection Wording</span>
              </span>
              <span className="font-medium text-slate-500">100% Direct Registrar Escrow</span>
            </div>
          </div>

          {/* Premium Breakdown Summary Container */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Transparent Premium Breakdown</span>
              <span className="text-teal-400 font-mono text-[10px]">Deterministic Formula</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Annual Base Education Rate:</span>
                <span className="font-semibold text-white">{formatINR(calcResult.basePremium + calcResult.baseRateComponent)}</span>
              </div>

              {calcResult.durationDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Multi-Year Duration Discount ({durationYears} Yrs):</span>
                  <span>-{formatINR(calcResult.durationDiscountAmount)}</span>
                </div>
              )}

              {meritDiscountAmount > 0 && (
                <div className="flex justify-between text-teal-300">
                  <span>Student Academic Merit Discount (10%):</span>
                  <span>-{formatINR(meritDiscountAmount)}</span>
                </div>
              )}

              {genderDiscountAmount > 0 && (
                <div className="flex justify-between text-pink-300">
                  <span>Single Mother / Female Parent Concession (5%):</span>
                  <span>-{formatINR(genderDiscountAmount)}</span>
                </div>
              )}

              {calcResult.addonPremiumTotal > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Selected Student Riders ({selectedAddonIds.length}):</span>
                  <span>+{formatINR(calcResult.addonPremiumTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Statutory GST (18% in India):</span>
                <span className="font-semibold text-white">{formatINR(netTax)}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Payable {frequency.replace('_', ' ')}:</span>
                  <span className="text-2xl font-black text-white tracking-tight block">
                    {formatINR(finalInstallment)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Annual Value</span>
                  <span className="text-sm font-bold text-teal-300 block">{formatINR(finalTotalAnnual)}/yr</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleProceedToLock}
              className="w-full py-4 rounded-full bg-pink-700 hover:bg-pink-800 text-white font-extrabold text-sm shadow-xl shadow-pink-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>Lock In Guaranteed Quote &amp; Proceed to Bind</span>
              <ArrowRight className="w-4 h-4 text-pink-200" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* IMAGE 1 BOTTOM: Genuine Trust & Stats Banner                */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-purple-50/60 border border-sky-100 p-6 md:p-8 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          {/* Stat 1 */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Total Education Covered
            </span>
            <div className="text-2xl md:text-3xl font-black text-[#0369a1] tracking-tight">
              ₹ 42.8 Cr
            </div>
            <span className="text-[11px] text-slate-500 block">Committed for enrolled students</span>
          </div>

          {/* Stat 2 */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Semester Fees Escrowed
            </span>
            <div className="text-2xl md:text-3xl font-black text-[#0369a1] tracking-tight">
              ₹ 6.42 Cr
            </div>
            <span className="text-[11px] text-slate-500 block">Certified direct registrar escrow</span>
          </div>

          {/* Stat 3 */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Students Safeguarded
            </span>
            <div className="text-2xl md:text-3xl font-black text-[#0369a1] tracking-tight">
              1,240+
            </div>
            <span className="text-[11px] text-slate-500 block">IITD, BITS, NITT, DU, REVA</span>
          </div>

          {/* Stat 4 */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Direct Settlement Ratio
            </span>
            <div className="text-2xl md:text-3xl font-black text-[#0369a1] tracking-tight">
              100%^
            </div>
            <span className="text-[11px] text-slate-500 block">Zero college fee disruption</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-sky-200/60 flex items-center justify-between text-xs text-sky-800">
          <span className="font-medium text-slate-600">
            Official institutional partnership guarantees direct registrar fee accounts with zero diversion risk.
          </span>
          <span className="font-bold text-[#0284c7] hover:underline cursor-pointer">
            Click to Know More &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
