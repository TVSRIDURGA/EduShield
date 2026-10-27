import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  Info,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  StudentsRepo, 
  UniversitiesRepo, 
  PlansRepo 
} from '../../repositories/firestoreRepo';
import { 
  Student, 
  University, 
  InsurancePlan, 
  UserProfile 
} from '../../models/insurance';
import { calculatePremium, formatINR } from '../../utils/businessRules';
import { quoteService } from '../../services/quoteService';
import { Alert } from '../../components/common/Alert';

export const NewQuotePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isNewStudent, setIsNewStudent] = useState(false);

  // New Student details
  const [studentName, setStudentName] = useState('');
  const [dob, setDob] = useState('2005-04-12');
  const [selectedUnivId, setSelectedUnivId] = useState('');
  const [courseName, setCourseName] = useState('B.Tech in Computer Science');
  const [currentYear, setCurrentYear] = useState(1);
  const [durationYears, setDurationYears] = useState(4);
  const [annualTuition, setAnnualTuition] = useState(250000);
  const [otherExpenses, setOtherExpenses] = useState(80000);

  // Plan Selection
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_comprehensive');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [studs, univs, plns] = await Promise.all([
          StudentsRepo.getAll(),
          UniversitiesRepo.getAll(),
          PlansRepo.getAll()
        ]);
        setStudents(studs);
        setUniversities(univs);
        setPlans(plns);

        if (studs.length > 0) {
          setSelectedStudentId(studs[0].id);
        } else {
          setIsNewStudent(true);
        }

        if (univs.length > 0) {
          setSelectedUnivId(univs[0].id);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Sync selected existing student
  useEffect(() => {
    if (!isNewStudent && selectedStudentId) {
      const s = students.find(item => item.id === selectedStudentId);
      if (s) {
        setStudentName(s.fullName);
        setDob(s.dateOfBirth);
        setSelectedUnivId(s.universityId);
        setCourseName(s.courseName);
        setCurrentYear(s.currentAcademicYear);
        setDurationYears(s.totalCourseDurationYears);
        setAnnualTuition(s.annualTuitionFee);
        setOtherExpenses(s.otherEligibleExpenses);
      }
    }
  }, [selectedStudentId, isNewStudent, students]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const selectedUniv = universities.find(u => u.id === selectedUnivId) || universities[0];

  const studentAge = new Date().getFullYear() - new Date(dob || '2005-01-01').getFullYear();

  // Real-time deterministic calculation
  const quoteCalc = selectedPlan ? calculatePremium({
    annualTuitionFee: Number(annualTuition) || 0,
    otherEligibleExpenses: Number(otherExpenses) || 0,
    policyDurationYears: Number(durationYears) || 1,
    plan: selectedPlan,
    studentAge
  }) : null;

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan || !quoteCalc) return;
    setError(null);
    setIsSubmitting(true);

    try {
      let targetStudent: Student;

      if (isNewStudent) {
        const newStud: Student = {
          id: 'stud_' + Date.now(),
          guardianId: user.id,
          guardianName: user.displayName,
          fullName: studentName,
          dateOfBirth: dob,
          gender: 'MALE',
          universityId: selectedUniv.id,
          universityName: selectedUniv.name,
          courseName,
          degreeType: 'UNDERGRADUATE',
          currentAcademicYear: Number(currentYear),
          totalCourseDurationYears: Number(durationYears),
          studentIdNumber: `STU-${Date.now().toString().slice(-6)}`,
          annualTuitionFee: Number(annualTuition),
          otherEligibleExpenses: Number(otherExpenses),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await StudentsRepo.create(newStud);
        targetStudent = newStud;
      } else {
        const existing = students.find(s => s.id === selectedStudentId);
        if (!existing) throw new Error('Student not found');
        targetStudent = existing;
      }

      const generated = await quoteService.generateQuote(
        user,
        targetStudent,
        selectedPlan,
        Number(durationYears)
      );

      navigate(`/quotes/${generated.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">Loading quote parameters...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
          <Calculator className="w-4 h-4" />
          <span>Guidewire-Inspired Quote Engine</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Calculate Education Insurance Quote
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Obtain instant, transparent pricing based on verified college tuition, degree duration, and actuarial risk factors.
        </p>
      </div>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      <form onSubmit={handleGenerateQuote} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Student & Course inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <span>1. Student & University Profile</span>
            </h3>

            {/* Select existing or new student */}
            {students.length > 0 && (
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isNewStudent}
                    onChange={() => setIsNewStudent(false)}
                    className="text-brand-600"
                  />
                  <span>Select Existing Registered Child</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={isNewStudent}
                    onChange={() => setIsNewStudent(true)}
                    className="text-brand-600"
                  />
                  <span>Add New Student</span>
                </label>
              </div>
            )}

            {!isNewStudent && students.length > 0 ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Choose Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.courseName} - {s.universityName})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {/* University & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Accredited University / Institute
                </label>
                <select
                  value={selectedUnivId}
                  onChange={(e) => setSelectedUnivId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Degree / Course Name
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Fees and Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Annual Tuition Fee (₹)
                </label>
                <input
                  type="number"
                  required
                  min={50000}
                  step={10000}
                  value={annualTuition}
                  onChange={(e) => setAnnualTuition(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Hostel / Lab Expenses (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Duration (Years)
                </label>
                <select
                  value={durationYears}
                  onChange={(e) => setDurationYears(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value={1}>1 Year (Single Academic Year)</option>
                  <option value={2}>2 Years (Postgraduate / M.Tech / MBA)</option>
                  <option value={3}>3 Years (B.Sc / BCA / BA)</option>
                  <option value={4}>4 Years (B.Tech / B.E.)</option>
                  <option value={5}>5 Years (Dual Degree / MBBS / Law)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Plan Selector Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>2. Choose Protection Plan Tier</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected 
                        ? 'border-brand-600 bg-brand-50/50 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                        {p.tier} TIER
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{p.name}</h4>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80">
                      <div className="text-xs text-slate-500">Base Premium Rate:</div>
                      <div className="text-base font-bold text-brand-700">{p.baseRatePercent}% / yr</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Max Cap: {formatINR(p.maxCoverageLimit)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Transparent Calculation Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md sticky top-24 space-y-5">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Live Actuarial Premium Breakdown</span>
            </div>

            {quoteCalc ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500">Total Education Coverage</span>
                  <div className="text-2xl font-black text-slate-900">
                    {formatINR(quoteCalc.coverageAmount)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Covers {durationYears} academic years at {selectedUniv?.name}
                  </span>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Annual Rate ({quoteCalc.factors.baseRatePercent}%):</span>
                    <span className="font-medium">{formatINR(quoteCalc.basePremium)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Age & Duration Adjustment:</span>
                    <span className="font-medium text-emerald-600">
                      {quoteCalc.riskFactorAdjustment >= 0 ? `+${formatINR(quoteCalc.riskFactorAdjustment)}` : formatINR(quoteCalc.riskFactorAdjustment)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Statutory Tax):</span>
                    <span className="font-medium">{formatINR(quoteCalc.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-brand-900 border-t border-slate-200 pt-2 mt-2">
                    <span>Total Annual Premium:</span>
                    <span className="text-brand-700">{formatINR(quoteCalc.totalAnnualPremium)}/yr</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-900">Important Terms:</div>
                  <div>• Waiting Period: <strong>{selectedPlan.waitingPeriodDays} days</strong></div>
                  <div>• Direct University Fee Escrow Channel</div>
                  <div>• 30-Day Guaranteed Price Validity</div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Calculating...' : 'Generate Formal Quote'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
};
