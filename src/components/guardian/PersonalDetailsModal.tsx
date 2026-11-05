import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  GraduationCap, 
  UserCheck, 
  ArrowRight, 
  Check, 
  Award, 
  Sparkles,
  Percent
} from 'lucide-react';

export interface PersonalDetailsFormData {
  parentGender: 'Male' | 'Female' | 'Transgender';
  admissionCategory: 'Merit' | 'Regular' | 'Sponsored';
  preferredLanguage: string;
  parentOccupation: 'Salaried' | 'Self-employed/Business' | 'Housewife' | 'Academic/Professional';
  parentEducation: 'Graduate & Above' | '12th Pass' | '10th Pass';
}

interface PersonalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (data: PersonalDetailsFormData) => void;
  studentName?: string;
}

export const PersonalDetailsModal: React.FC<PersonalDetailsModalProps> = ({
  isOpen,
  onClose,
  onProceed,
  studentName = 'your child'
}) => {
  const [gender, setGender] = useState<'Male' | 'Female' | 'Transgender'>('Female');
  const [admissionCategory, setAdmissionCategory] = useState<'Merit' | 'Regular' | 'Sponsored'>('Merit');
  const [language, setLanguage] = useState<string>('English');
  const [occupation, setOccupation] = useState<'Salaried' | 'Self-employed/Business' | 'Housewife' | 'Academic/Professional'>('Salaried');
  const [education, setEducation] = useState<'Graduate & Above' | '12th Pass' | '10th Pass'>('Graduate & Above');

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceed({
      parentGender: gender,
      admissionCategory,
      preferredLanguage: language,
      parentOccupation: occupation,
      parentEducation: education
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Top Handle Bar Indicator (Matching Image 3 "- · -") */}
        <div className="pt-3 pb-1 flex justify-center items-center">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-3 pt-1 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Required below details for your coverage
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Personalized profile factors and academic merit discounts for {studentName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Gender* with Female Discount Badge */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Gender<span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 gap-1">
              {(['Male', 'Female', 'Transgender'] as const).map((g) => {
                const isSelected = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`relative py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{g}</span>
                    {g === 'Female' && (
                      <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md mt-0.5 whitespace-nowrap">
                        15% Lesser Premium
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Admission & Merit Category (Adapted for Education Insurance) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Student Admission Category<span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 gap-1">
              {(['Merit', 'Regular', 'Sponsored'] as const).map((cat) => {
                const isSelected = admissionCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAdmissionCategory(cat)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat === 'Merit' && (
                      <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md mt-0.5 whitespace-nowrap">
                        10% Merit Discount
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Merit admission in partner universities qualifies for actuarial fee reduction
            </span>
          </div>

          {/* 3. Preferred Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Preferred Language
            </label>
            <div className="grid grid-cols-5 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 gap-1">
              {['English', 'Hindi', 'Tamil', 'Telugu', 'Others'].map((lang) => {
                const isSelected = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center truncate ${
                      isSelected
                        ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Occupation* (2x2 Grid with Badges) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Occupation<span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'Salaried', label: 'Salaried', badge: '15% Discount' },
                { id: 'Self-employed/Business', label: 'Self-employed / Business' },
                { id: 'Housewife', label: 'Housewife / Homemaker' },
                { id: 'Academic/Professional', label: 'Academic / Professional' }
              ].map((occ) => {
                const isSelected = occupation === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccupation(occ.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-20 ${
                      isSelected
                        ? 'bg-[#eef8fc] border-[#7ed0f4] ring-2 ring-sky-300/40 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-xs block leading-tight">{occ.label}</span>
                    {occ.badge && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block w-fit">
                        {occ.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Education* (3-column Segmented Controls) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Education<span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 rounded-2xl border border-slate-200 overflow-hidden bg-white p-1 gap-1">
              {(['Graduate & Above', '12th Pass', '10th Pass'] as const).map((edu) => {
                const isSelected = education === edu;
                return (
                  <button
                    key={edu}
                    type="button"
                    onClick={() => setEducation(edu)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition text-center truncate ${
                      isSelected
                        ? 'bg-[#eef8fc] text-[#0284c7] border border-[#7ed0f4] shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {edu}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button (Image 3 Bottom Berry/Magenta Button) */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-full bg-pink-700 hover:bg-pink-800 text-white font-extrabold text-sm shadow-xl shadow-pink-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>Proceed</span>
              <ArrowRight className="w-4 h-4 text-pink-200" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
