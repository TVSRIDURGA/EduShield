import React, { useState } from 'react';
import { 
  ArrowLeft, 
  X, 
  ShieldCheck, 
  Building, 
  HeartHandshake, 
  Check, 
  AlertCircle 
} from 'lucide-react';

export interface ContinuityDetailsFormData {
  hasCriticalIllness: boolean;
  maritalStatus: 'Single' | 'Married';
  escrowPreference: 'DIRECT_UNIVERSITY' | 'REIMBURSEMENT';
}

interface ContinuityDetailsModalProps {
  isOpen: boolean;
  onBack: () => void;
  onClose: () => void;
  onCheckCoverage: (data: ContinuityDetailsFormData) => void;
}

export const ContinuityDetailsModal: React.FC<ContinuityDetailsModalProps> = ({
  isOpen,
  onBack,
  onClose,
  onCheckCoverage
}) => {
  const [hasCriticalIllness, setHasCriticalIllness] = useState<boolean>(false);
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married'>('Single');
  const [escrowPreference, setEscrowPreference] = useState<'DIRECT_UNIVERSITY' | 'REIMBURSEMENT'>('DIRECT_UNIVERSITY');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckCoverage({
      hasCriticalIllness,
      maritalStatus,
      escrowPreference
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Top Handle Bar Indicator (Matching Image 2 "- · -") */}
        <div className="pt-3 pb-1 flex justify-center items-center">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header with Back Arrow (Matching Image 2) */}
        <div className="px-6 pb-3 pt-1 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Required below details for your coverage
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question 1: Health & Critical Condition History */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Any Chronic or Critical Pre-existing Illness in Breadwinner?
            </label>
            <div className="grid grid-cols-2 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 gap-1">
              <button
                type="button"
                onClick={() => setHasCriticalIllness(false)}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  !hasCriticalIllness
                    ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>No</span>
                {!hasCriticalIllness && <Check className="w-3.5 h-3.5 text-[#0284c7]" />}
              </button>
              <button
                type="button"
                onClick={() => setHasCriticalIllness(true)}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  hasCriticalIllness
                    ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Yes</span>
                {hasCriticalIllness && <Check className="w-3.5 h-3.5 text-[#0284c7]" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Standard 30-day waiting period applies. Acute accidental trauma is protected from Day 1.
            </span>
          </div>

          {/* Question 2: Marital Status (Exact Match to Image 2) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Marital Status
            </label>
            <div className="grid grid-cols-2 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 gap-1">
              <button
                type="button"
                onClick={() => setMaritalStatus('Single')}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  maritalStatus === 'Single'
                    ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Single</span>
                {maritalStatus === 'Single' && <Check className="w-3.5 h-3.5 text-[#0284c7]" />}
              </button>
              <button
                type="button"
                onClick={() => setMaritalStatus('Married')}
                className={`py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  maritalStatus === 'Married'
                    ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Married</span>
                {maritalStatus === 'Married' && <Check className="w-3.5 h-3.5 text-[#0284c7]" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              In case of 'Widow(er) or Divorced', select “Single” as the option.
            </span>
          </div>

          {/* Question 3: Fee Escrow Authorization (EduShield Pillar) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              University Semester Fee Escrow Routing
            </label>
            <div className="grid grid-cols-2 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 gap-1">
              <button
                type="button"
                onClick={() => setEscrowPreference('DIRECT_UNIVERSITY')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center ${
                  escrowPreference === 'DIRECT_UNIVERSITY'
                    ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Direct to University</span>
                <span className="text-[9px] text-emerald-700 font-medium">Recommended Escrow</span>
              </button>
              <button
                type="button"
                onClick={() => setEscrowPreference('REIMBURSEMENT')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center text-center ${
                  escrowPreference === 'REIMBURSEMENT'
                    ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Reimbursement</span>
                <span className="text-[9px] text-slate-400 font-medium">Manual Verification</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              Direct escrow pays verified tuition demands directly to the registrar so the student never faces exam debarment.
            </span>
          </div>

          {/* Prominent Magenta/Berry Pill Button (Matching Image 2 "Check Coverage") */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-full bg-pink-700 hover:bg-pink-800 text-white font-extrabold text-sm shadow-xl shadow-pink-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>Check Coverage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
