import React from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  PlusCircle, 
  Building2, 
  Lock,
  HeartHandshake
} from 'lucide-react';
import { formatINR } from '../../utils/businessRules';

interface ParentHeroBannerProps {
  parentName: string;
  coveredChildrenCount: number;
  totalActiveCover: number;
  primaryChildName?: string;
  primaryUniversityName?: string;
  onStartCalculator: () => void;
  onRegisterChild: () => void;
  onViewPolicies: () => void;
}

export const ParentHeroBanner: React.FC<ParentHeroBannerProps> = ({
  parentName,
  coveredChildrenCount,
  totalActiveCover,
  primaryChildName,
  primaryUniversityName,
  onStartCalculator,
  onRegisterChild,
  onViewPolicies
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-slate-800">
      {/* Decorative background ambient glows */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Column: Personalized Greeting & Narrative */}
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>EduShield Guardian Security Portal</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300 font-normal">Direct University Escrow</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Protect {primaryChildName ? `${primaryChildName}'s` : "Your Child's"} Higher Education Against Any Life Uncertainty.
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Welcome back, <strong className="text-white font-semibold">{parentName}</strong>. EduShield ensures that unforeseen family financial hardship or loss of earning breadwinner never forces a student to leave college. Verified semester fees are paid <strong className="text-teal-300 font-semibold">directly to the university registrar</strong>.
          </p>

          {/* Partner Universities trust pill */}
          <div className="pt-1 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-400" /> Partner Campuses:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">IIT Delhi</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">BITS Pilani</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">NIT Trichy</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">DU</span>
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200">REVA Univ</span>
          </div>

          {/* Action CTAs */}
          <div className="pt-3 flex flex-wrap items-center gap-3.5">
            <button
              onClick={onStartCalculator}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-pink-700 hover:bg-pink-800 text-white font-bold text-sm shadow-lg shadow-pink-900/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4 text-pink-200" />
              <span>Protect Your Child's Education</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onRegisterChild}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition backdrop-blur"
            >
              <PlusCircle className="w-4 h-4 text-teal-300" />
              <span>Register Child</span>
            </button>

            {coveredChildrenCount > 0 && (
              <button
                onClick={onViewPolicies}
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition"
              >
                <span>View Existing Policies ({coveredChildrenCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Family Protection Snapshot Card */}
        <div className="lg:w-80 w-full shrink-0">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Family Protection Status
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Active Account
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Total Active Education Cover:</span>
                <span className="text-xl font-black text-white tracking-tight mt-0.5 block">
                  {totalActiveCover > 0 ? formatINR(totalActiveCover) : '₹0 (Not Yet Bound)'}
                </span>
              </div>

              {primaryChildName && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-300">{primaryChildName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Enrolled</span>
                  </div>
                  <div className="text-[11px] text-slate-300">{primaryUniversityName || 'Partner University'}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-0.5">
                    <Lock className="w-3 h-3" /> Verified Registrar Escrow Protection
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-lg bg-black/20">
                  <span className="text-slate-400 block text-[10px]">Registered Children</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{coveredChildrenCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/20">
                  <span className="text-slate-400 block text-[10px]">Settlement Guarantee</span>
                  <span className="font-bold text-teal-400 text-sm mt-0.5 block">100% Direct</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
