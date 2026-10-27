import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Calculator,
  Sliders,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { PoliciesRepo, StudentsRepo } from '../../repositories/firestoreRepo';
import { calculateFundingGap, formatINR } from '../../utils/businessRules';
import { FundingGapAnalysis } from '../../models/insurance';

export const ContinuityPage: React.FC = () => {
  const { user } = useAuth();

  // Inputs
  const [studentName, setStudentName] = useState('Aarav Sharma');
  const [courseName, setCourseName] = useState('B.Tech in Computer Science & Engineering (IIT Delhi)');
  const [currentYear, setCurrentYear] = useState<number>(2);
  const [totalCourseYears, setTotalCourseYears] = useState<number>(4);
  const [annualTuition, setAnnualTuition] = useState<number>(220000);
  const [annualLiving, setAnnualLiving] = useState<number>(80000);
  const [familySavings, setFamilySavings] = useState<number>(50000);
  const [activeInsuranceCoverage, setActiveInsuranceCoverage] = useState<number>(1200000);

  const [analysis, setAnalysis] = useState<FundingGapAnalysis>(() => 
    calculateFundingGap({
      studentName: 'Aarav Sharma',
      courseName: 'B.Tech in Computer Science & Engineering (IIT Delhi)',
      currentYear: 2,
      totalCourseYears: 4,
      annualTuition: 220000,
      annualLivingAndHostel: 80000,
      familyAnnualPlannedSavings: 50000,
      activeInsuranceCoverage: 1200000
    })
  );

  useEffect(() => {
    async function loadUserPolicy() {
      try {
        const [policies, students] = await Promise.all([
          PoliciesRepo.getAll(),
          StudentsRepo.getAll()
        ]);
        const myPol = policies.find(p => p.status === 'ACTIVE');
        if (myPol) {
          setActiveInsuranceCoverage(myPol.coverageAmount);
          setStudentName(myPol.studentName);
        }
      } catch (err) {
        console.error('Failed to load user policy:', err);
      }
    }
    loadUserPolicy();
  }, [user]);

  // Recalculate on any input change
  useEffect(() => {
    const res = calculateFundingGap({
      studentName,
      courseName,
      currentYear: Number(currentYear),
      totalCourseYears: Number(totalCourseYears),
      annualTuition: Number(annualTuition),
      annualLivingAndHostel: Number(annualLiving),
      familyAnnualPlannedSavings: Number(familySavings),
      activeInsuranceCoverage: Number(activeInsuranceCoverage)
    });
    setAnalysis(res);
  }, [studentName, courseName, currentYear, totalCourseYears, annualTuition, annualLiving, familySavings, activeInsuranceCoverage]);

  const chartData = [
    {
      category: 'Education Financing',
      'Total Remaining Cost': analysis.totalEducationCost,
      'Insurance Protection': analysis.activeInsuranceCoverage,
      'Family Savings': analysis.familyPlannedSavings,
      'Uncovered Gap': analysis.fundingGapAmount,
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-brand-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>EduShield Signature Innovation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Education Continuity & Funding-Gap Calculator
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Model the exact multi-year financial exposure of your child's college degree against unexpected breadwinner loss.
          </p>
        </div>
        <Link
          to="/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-xs shadow-md transition"
        >
          <Calculator className="w-4 h-4" />
          <span>Adjust Coverage / Get Quote</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Inputs Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-brand-900 font-bold text-base border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-brand-600" />
            <span>Financial Modeling Variables</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Current Year
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalCourseYears}
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Total Course Years
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={totalCourseYears}
                  onChange={(e) => setTotalCourseYears(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Annual College Tuition (₹)
              </label>
              <input
                type="number"
                step={10000}
                value={annualTuition}
                onChange={(e) => setAnnualTuition(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Annual Hostel & Campus Living (₹)
              </label>
              <input
                type="number"
                step={5000}
                value={annualLiving}
                onChange={(e) => setAnnualLiving(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Family Annual Planned College Savings (₹)
              </label>
              <input
                type="number"
                step={5000}
                value={familySavings}
                onChange={(e) => setFamilySavings(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Active Insurance Cover Amount (₹)
              </label>
              <input
                type="number"
                step={50000}
                value={activeInsuranceCoverage}
                onChange={(e) => setActiveInsuranceCoverage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-teal-700"
              />
            </div>
          </div>
        </div>

        {/* Right Output & Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Remaining Degree Cost</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatINR(analysis.totalEducationCost)}
              </div>
              <span className="text-[11px] text-slate-500">Over {analysis.remainingYears} remaining years</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Protection In-Force</span>
              <div className="text-2xl font-black text-teal-700 mt-1">
                {formatINR(analysis.activeInsuranceCoverage + analysis.familyPlannedSavings)}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">{analysis.protectionCoveragePercentage}% Protected</span>
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${
              analysis.fundingGapAmount === 0 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/60 border-rose-200 text-rose-950'
            }`}>
              <span className="text-xs font-semibold uppercase opacity-75">Estimated Shortfall Gap</span>
              <div className="text-2xl font-black mt-1">
                {formatINR(analysis.fundingGapAmount)}
              </div>
              <span className="text-[11px] font-bold">
                {analysis.fundingGapAmount === 0 ? '✓ Zero Shortfall' : '⚠️ Financial Exposure'}
              </span>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Education Financial Cushion Comparison</h3>
                <p className="text-xs text-slate-500 mt-0.5">Total degree liability versus secured coverage and family reserves</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip formatter={(value: any) => formatINR(Number(value))} />
                  <Legend />
                  <Bar dataKey="Total Remaining Cost" fill="#334155" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Insurance Protection" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Family Savings" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Uncovered Gap" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="bg-gradient-to-br from-teal-50 via-white to-brand-50 rounded-2xl border border-teal-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>EduShield Continuity Advisory Recommendation</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {analysis.recommendation}
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/quotes/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
              >
                <span>Optimize Protection Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
