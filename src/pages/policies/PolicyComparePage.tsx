import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  Sparkles,
  Calculator
} from 'lucide-react';
import { ProductsRepo, UniversitiesRepo } from '../../repositories/firestoreRepo';
import { InsuranceProduct, University } from '../../models/insurance';
import { formatINR } from '../../utils/businessRules';

export const PolicyComparePage: React.FC = () => {
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [, setUniversities] = useState<University[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allProds, allUnivs] = await Promise.all([
          ProductsRepo.getAll(),
          UniversitiesRepo.getAll()
        ]);
        const published = allProds.filter(p => p.status === 'PUBLISHED');
        setProducts(published);
        setUniversities(allUnivs);
        setSelectedIds(published.slice(0, 3).map(p => p.id));
      } catch (err) {
        console.error('Error loading products for comparison:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        setSelectedIds([selectedIds[0], selectedIds[1], id]);
      }
    }
  };

  const comparedProducts = products.filter(p => selectedIds.includes(p.id));

  if (loading) {
    return <div className="max-w-6xl mx-auto py-12 px-4 text-center text-slate-500">Loading policy comparison data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to="/quotes/new" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Quote Calculator</span>
          </Link>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Transparent Product Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Compare Education Insurance Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Objective, side-by-side evaluation of coverage limits, deductibles, waiting periods, and contractual terms.
          </p>
        </div>

        <Link
          to="/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Calculator className="w-4 h-4" />
          <span>Get Quote for My Student</span>
        </Link>
      </div>

      {/* Product Selection Chips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Select Up to 3 Products to Compare:
          </span>
          <span className="text-xs text-slate-500">
            {selectedIds.length} of {products.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {products.map(p => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5 text-brand-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                <span>{p.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({p.tier})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid Table */}
      {comparedProducts.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No products selected for comparison. Please choose at least one product above.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 sm:p-5 w-1/4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Policy Parameter
                  </th>
                  {comparedProducts.map(p => (
                    <th key={p.id} className="p-4 sm:p-5 w-1/4 align-top">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase">
                        {p.tier} TIER
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">{p.name}</h3>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">Code: {p.code} (v{p.currentVersion})</div>
                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase">Base Premium Rate</span>
                        <div className="text-base sm:text-lg font-black text-brand-700">
                          {p.premiumConfig.baseRatePercent}% <span className="text-xs font-normal text-slate-500">/ yr</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* 1. Maximum Sum Insured & Financial Cap */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Maximum Coverage Cap (Sum Insured)
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 font-bold text-slate-900">
                      {formatINR(p.financialLimits.maxCoverageLimit)}
                    </td>
                  ))}
                </tr>

                {/* 2. Statutory Waiting Period */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Initial Waiting Period
                  </td>
                  {comparedProducts.map(p => {
                    const days = p.coverageBenefits[0]?.waitingPeriodDays ?? 0;
                    return (
                      <td key={p.id} className="p-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${days === 0 ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {days === 0 ? 'Zero Waiting Period' : `${days} Days`}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. Deductibles & Co-Payment */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Deductible & Co-Payment
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 text-slate-700">
                      <div>Deductible: <strong className="text-slate-900">{formatINR(p.financialLimits.deductibleAmount)}</strong></div>
                      <div className="text-[11px] text-slate-500">Co-Pay: <strong>{p.financialLimits.coPaymentPercent}%</strong></div>
                    </td>
                  ))}
                </tr>

                {/* 4. Eligible Student Age Range */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Eligible Age Range
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 text-slate-800 font-medium">
                      {p.eligibilityCriteria.minAge} to {p.eligibilityCriteria.maxAge} Years
                    </td>
                  ))}
                </tr>

                {/* 5. Eligible Degree Types */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Eligible Degree Levels
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {p.eligibilityCriteria.allowedDegreeTypes.map(d => (
                          <span key={d} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 6. Partner Institutions Supported */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Approved Universities
                  </td>
                  {comparedProducts.map(p => {
                    const isAll = p.applicableInstitutions.includes('ALL');
                    return (
                      <td key={p.id} className="p-4 text-slate-700">
                        {isAll ? (
                          <span className="text-emerald-700 font-bold">All 5 Partner Universities</span>
                        ) : (
                          <span>{p.applicableInstitutions.length} Specified Institutions</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 7. Covered Risks & Benefits */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Covered Risks & Included Benefits
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 space-y-2">
                      {p.coverageBenefits.filter(b => !b.isOptionalAddon).map(b => (
                        <div key={b.id} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-900">{b.name}</span>
                            <div className="text-[10px] text-slate-500">{formatINR(b.benefitAmount)} cap</div>
                          </div>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* 8. Optional Add-ons Available */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Optional Add-on Riders
                  </td>
                  {comparedProducts.map(p => {
                    const addons = p.coverageBenefits.filter(b => b.isOptionalAddon);
                    return (
                      <td key={p.id} className="p-4 text-[11px] text-slate-700">
                        {addons.length > 0 ? (
                          <div className="space-y-1">
                            {addons.map(a => (
                              <div key={a.id} className="flex items-center gap-1">
                                <span className="font-semibold text-brand-700">{a.name}</span>
                                <span className="text-slate-400">(+{formatINR(a.addonPremium)}/yr)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No add-on riders</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 9. Key Exclusions */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Key Policy Exclusions
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 space-y-1.5">
                      {p.exclusions.map(ex => (
                        <div key={ex.id} className="text-[11px] text-slate-600 flex items-start gap-1">
                          <X className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-800">{ex.title}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* 10. Free-Look & Cancellation Policy */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Free-Look & Cancellation
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 text-[11px] text-slate-700 space-y-1">
                      <div>Free-Look: <strong>{p.cancellationConditions.freeLookPeriodDays} Days</strong></div>
                      <div>Method: <strong className="uppercase">{p.cancellationConditions.refundMethod.replace(/_/g, ' ')}</strong></div>
                      <div className="text-[10px] text-slate-400">Claims made: 0% refund</div>
                    </td>
                  ))}
                </tr>

                {/* 11. Renewal Conditions */}
                <tr className="hover:bg-slate-50/50">
                  <td className="p-4 font-semibold text-slate-900 bg-slate-50/70">
                    Renewal Window & Concession
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 text-[11px] text-slate-700 space-y-1">
                      <div>Window: <strong>{p.renewalConditions.renewalWindowDays} days prior</strong></div>
                      <div>Grace Period: <strong>{p.renewalConditions.gracePeriodDays} days</strong></div>
                      <div className="text-emerald-700 font-semibold">{p.renewalConditions.renewalDiscountPercent}% Renewal Discount</div>
                    </td>
                  ))}
                </tr>

                {/* 12. Direct Action Row */}
                <tr className="bg-slate-50/80">
                  <td className="p-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Select Policy
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4">
                      <Link
                        to={`/quotes/new?plan=${p.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Select {p.name.split(' ')[1]}</span>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
