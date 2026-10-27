import React from 'react';
import { SlidersHorizontal, CheckCircle2, ArrowRight } from 'lucide-react';
import { ALLOWED_CLAIM_TRANSITIONS } from '../../utils/businessRules';

export const RulesPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Guidewire Business Rules Framework</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Centralized Insurance Business Rules Engine
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic validation constraints, statutory rates, waiting periods, and state transition matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* State Transitions Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Claim Lifecycle State Machine
          </h3>
          <p className="text-xs text-slate-500">
            Enforces strict transition validity to prevent illegal status jumps (e.g. Draft directly to Paid).
          </p>

          <div className="space-y-2 text-xs">
            {Object.entries(ALLOWED_CLAIM_TRANSITIONS).map(([fromState, allowedNext]) => (
              <div key={fromState} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-mono font-bold text-slate-900">{fromState}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  {allowedNext.length > 0 ? (
                    allowedNext.map(next => (
                      <span key={next} className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-brand-200">
                        {next}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[10px] italic">Terminal State</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actuarial & Statutory Rules */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Actuarial Parameters (India Region)
            </h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span>Statutory Tax on Insurance (GST):</span>
                <span className="font-bold text-slate-900">18.0%</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span>Long-Term Degree Discount (&gt;= 4 Yrs):</span>
                <span className="font-bold text-emerald-700">10.0% Discount</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span>Standard Student Age Bracket:</span>
                <span className="font-bold text-slate-900">17 – 25 Years</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span>Max Fee Coverage Cap:</span>
                <span className="font-bold text-brand-700">₹75,00,000 (Scholar Elite)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Direct University Disbursement Protocol
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Approved claims cannot be diverted to third parties or personal bank accounts. Payouts must disburse strictly to the verified Registrar Fee Escrow Account of the accredited institution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
