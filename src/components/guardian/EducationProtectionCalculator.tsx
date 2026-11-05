import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  User, 
  Phone, 
  Calendar,
  Building,
  HelpCircle,
  Clock,
  Info
} from 'lucide-react';
import { Student } from '../../models/insurance';
import { formatINR } from '../../utils/businessRules';

export interface CalculatorFormData {
  parentFullName: string;
  parentDob: string;
  isNri: boolean;
  mobile: string;
  incomeBracket: string; // '<5' | '5-7' | '7-10' | '10-20' | '>20'
  selectedStudentId: string;
}

interface EducationProtectionCalculatorProps {
  initialParentName: string;
  initialMobile?: string;
  students: Student[];
  onCalculate: (data: CalculatorFormData) => void;
  activeQuoteSummary?: {
    studentName: string;
    coverageAmount: number;
    installmentAmount: number;
    stepIndex: number; // 1 to 5
    onContinue: () => void;
  };
}

export const EducationProtectionCalculator: React.FC<EducationProtectionCalculatorProps> = ({
  initialParentName,
  initialMobile = '+91 9876543210',
  students,
  onCalculate,
  activeQuoteSummary
}) => {
  const [fullName, setFullName] = useState(initialParentName || 'Rajesh Sharma');
  const [dob, setDob] = useState('1981-10-18');
  const [isNri, setIsNri] = useState(false);
  const [mobile, setMobile] = useState(initialMobile);
  const [incomeBracket, setIncomeBracket] = useState<'<5' | '5-7' | '7-10' | '10-20' | '>20'>('7-10');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students.length > 0 ? students[0].id : ''
  );

  // Calculate age from DOB in real-time
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 42;
    const birth = new Date(dobString);
    if (isNaN(birth.getTime())) return 42;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(18, age);
  };

  const calculatedAge = calculateAge(dob);

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({
      parentFullName: fullName,
      parentDob: dob,
      isNri,
      mobile,
      incomeBracket,
      selectedStudentId
    });
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* IMAGE 5 INSPIRED: Progress Tracker & Quote Summary Pill       */}
      {/* ============================================================ */}
      {activeQuoteSummary && (
        <div className="bg-gradient-to-r from-pink-50/70 via-white to-purple-50/60 rounded-2xl border border-pink-200/80 p-4 sm:p-5 shadow-sm transition">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & 5-Step Horizontal Tracker */}
            <div className="space-y-3 flex-1">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{fullName}, Continue {activeQuoteSummary.studentName}'s Education Policy</span>
              </div>

              {/* 5-Step Horizontal Indicator */}
              <div className="flex items-center gap-2 max-w-md">
                {[
                  { step: 1, label: 'Protection Calculated' },
                  { step: 2, label: 'Quote Created' },
                  { step: 3, label: 'Personal Details' },
                  { step: 4, label: 'Payment Page' },
                  { step: 5, label: 'Proposal Form' }
                ].map((item, idx, arr) => {
                  const isCompleted = activeQuoteSummary.stepIndex > item.step;
                  const isCurrent = activeQuoteSummary.stepIndex === item.step;

                  return (
                    <React.Fragment key={item.step}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isCompleted
                              ? 'bg-sky-500 text-white'
                              : isCurrent
                              ? 'border-2 border-sky-500 bg-white text-sky-600'
                              : 'border border-slate-300 bg-white text-slate-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : item.step}
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium hidden sm:block mt-1 text-center truncate max-w-[70px]">
                          {item.label}
                        </span>
                      </div>

                      {idx < arr.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 transition-all ${
                            isCompleted ? 'bg-sky-400' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Quote Amount & Action Button */}
            <div className="flex items-center gap-4 self-end md:self-center border-t md:border-t-0 md:border-l border-slate-200/80 pt-3 md:pt-0 md:pl-5 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Education Cover</span>
                <span className="text-sm font-black text-slate-900 block">
                  {formatINR(activeQuoteSummary.coverageAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Premium</span>
                <span className="text-sm font-black text-brand-700 block">
                  {formatINR(activeQuoteSummary.installmentAmount)} Monthly
                </span>
              </div>
              <button
                type="button"
                onClick={activeQuoteSummary.onContinue}
                className="px-5 py-2.5 rounded-full bg-pink-700 hover:bg-pink-800 text-white text-xs font-bold shadow-md shadow-pink-900/20 transition transform hover:-translate-y-0.5"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* IMAGE 4 INSPIRED: Main Calculator Card                       */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center space-y-1 pb-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Education Protection Calculator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Calculate customized college fee continuity and breadwinner protection for your child's degree.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Full Name & Date of Birth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name<span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-slate-900 font-medium text-sm transition outline-hidden bg-slate-50/30"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                * As per your Aadhaar or passport ID proof
              </span>
            </div>

            {/* Date of Birth with Age Badge */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date of Birth<span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-slate-900 font-medium text-sm transition outline-hidden bg-slate-50/30 pr-24"
                />
                {/* Real-time Age Badge inside the input right side */}
                <div className="absolute right-3 px-3 py-1 rounded-md bg-[#eef8fc] border border-[#a8ddf3] text-[#0284c7] font-bold text-xs pointer-events-none">
                  {calculatedAge} Years
                </div>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Parent / Policyholder age used for actuarial calculation
              </span>
            </div>
          </div>

          {/* Row 2: Are you an NRI? & Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NRI Segmented Control */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Are you an NRI?<span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 rounded-xl border border-slate-300 overflow-hidden bg-white p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setIsNri(false)}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold transition ${
                    !isNri
                      ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setIsNri(true)}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold transition ${
                    isNri
                      ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Yes
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Resident Indian &amp; NRI parents supported under partner university fee mandates
              </span>
            </div>

            {/* Mobile with Spam Badge */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile<span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 XXXXXX9698"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-slate-900 font-medium text-sm transition outline-hidden bg-slate-50/30 font-mono"
              />
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>We Don't Spam • Verified University Fee Updates Only</span>
              </div>
            </div>
          </div>

          {/* Row 3: Annual Income (In Lakhs) Segmented Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Annual Income (In Lakhs)
            </label>
            <div className="grid grid-cols-5 rounded-xl border border-slate-300 overflow-hidden bg-white p-1 gap-1">
              {(['<5', '5-7', '7-10', '10-20', '>20'] as const).map((bracket) => {
                const isSelected = incomeBracket === bracket;
                return (
                  <button
                    key={bracket}
                    type="button"
                    onClick={() => setIncomeBracket(bracket)}
                    className={`py-3 px-2 rounded-lg text-xs font-bold transition ${
                      isSelected
                        ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {bracket}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">
              In case of homemaker or dependent spouse, please choose aggregate family income &gt;10L
            </span>
          </div>

          {/* Row 4: Covered Student Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                <span>Insured Child / Student Beneficiary</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Student is the insured beneficiary
              </span>
            </div>

            {students.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {students.map((stu) => {
                  const isSelected = selectedStudentId === stu.id;
                  return (
                    <div
                      key={stu.id}
                      onClick={() => setSelectedStudentId(stu.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border text-xs transition ${
                        isSelected
                          ? 'border-[#0284c7] bg-[#f0f9ff] ring-2 ring-sky-300/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{stu.fullName}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#0284c7]" />}
                      </div>
                      <div className="text-slate-600 font-medium mt-1">{stu.universityName}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {stu.courseName} • Annual Tuition: {formatINR(stu.annualTuitionFee)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2">
                No child profile linked yet. Will register default candidate Aarav Sharma (IIT Delhi).
              </div>
            )}
          </div>

          {/* Prominent Berry/Magenta Action Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              className="w-full sm:w-80 py-4 px-8 rounded-full bg-pink-700 hover:bg-pink-800 text-white font-extrabold text-base shadow-xl shadow-pink-900/25 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>Calculate Now</span>
              <ArrowRight className="w-5 h-5 text-pink-200" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
