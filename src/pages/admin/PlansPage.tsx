import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, Info } from 'lucide-react';
import { PlansRepo } from '../../repositories/firestoreRepo';
import { InsurancePlan } from '../../models/insurance';
import { formatINR } from '../../utils/businessRules';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);

  useEffect(() => {
    async function load() {
      const all = await PlansRepo.getAll();
      setPlans(all);
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Product Engineering Console</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Insurance Product Plans & Benefit Limits
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure baseline premium rates, waiting periods, benefit schedules, and non-covered exclusions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase">
                {p.tier} TIER
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{p.name}</h3>
              <p className="text-xs text-slate-600 mt-1">{p.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Premium Rate:</span>
                  <span className="font-bold text-slate-900">{p.baseRatePercent}% / yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maximum Coverage Cap:</span>
                  <span className="font-bold text-brand-700">{formatINR(p.maxCoverageLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waiting Period:</span>
                  <span className="font-medium text-slate-800">{p.waitingPeriodDays} days</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                <span className="font-bold text-slate-800">Included Benefits:</span>
                <ul className="space-y-1">
                  {p.includedBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Code: <code className="font-mono text-slate-600">{p.code}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
