import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  Layers,
  Clock,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  StudentsRepo, 
  UniversitiesRepo, 
  ProductsRepo 
} from '../../repositories/firestoreRepo';
import { 
  Student, 
  University, 
  InsuranceProduct, 
  PaymentFrequency,
  EligibilityValidationResult 
} from '../../models/insurance';
import { formatINR } from '../../utils/businessRules';
import { quoteService } from '../../services/quoteService';
import { policyEngine } from '../../services/policyEngine';
import { Alert } from '../../components/common/Alert';

export const NewQuotePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [students, setStudents] = useState<Student[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isNewStudent, setIsNewStudent] = useState(false);

  // New Student details
  const [studentName, setStudentName] = useState('');
  const [dob, setDob] = useState('2005-04-12');
  const [selectedUnivId, setSelectedUnivId] = useState('');
  const [courseName, setCourseName] = useState('B.Tech in Computer Science');
  const [degreeType, setDegreeType] = useState<'UNDERGRADUATE' | 'POSTGRADUATE' | 'DIPLOMA'>('UNDERGRADUATE');
  const [currentYear, setCurrentYear] = useState(1);
  const [durationYears, setDurationYears] = useState(4);
  const [annualTuition, setAnnualTuition] = useState(250000);
  const [otherExpenses, setOtherExpenses] = useState(80000);

  // Enterprise Plan & Add-ons Selection
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<PaymentFrequency>('ANNUAL');
  const [discountCode, setDiscountCode] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [studs, univs, prods] = await Promise.all([
          StudentsRepo.getAll(),
          UniversitiesRepo.getAll(),
          ProductsRepo.getAll()
        ]);
        setStudents(studs);
        setUniversities(univs);

        const published = prods.filter(p => p.status === 'PUBLISHED');
        setProducts(published);

        // Preselect from query params if given
        const requestedPlan = searchParams.get('plan');
        if (requestedPlan && published.some(p => p.id === requestedPlan)) {
          setSelectedProductId(requestedPlan);
        } else if (published.length > 0) {
          const comp = published.find(p => p.category === 'COMPREHENSIVE') || published[0];
          setSelectedProductId(comp.id);
        }

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
  }, [searchParams]);

  // Sync selected existing student
  useEffect(() => {
    if (!isNewStudent && selectedStudentId) {
      const s = students.find(item => item.id === selectedStudentId);
      if (s) {
        setStudentName(s.fullName);
        setDob(s.dateOfBirth);
        setSelectedUnivId(s.universityId);
        setCourseName(s.courseName);
        setDegreeType(s.degreeType);
        setCurrentYear(s.currentAcademicYear);
        setDurationYears(s.totalCourseDurationYears);
        setAnnualTuition(s.annualTuitionFee);
        setOtherExpenses(s.otherEligibleExpenses);
      }
    }
  }, [selectedStudentId, isNewStudent, students]);

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];
  const selectedUniv = universities.find(u => u.id === selectedUnivId) || universities[0];

  const birthDate = new Date(dob || '2005-01-01');
  const now = new Date();
  let studentAge = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    studentAge--;
  }

  // Construct virtual student for real-time validation
  const virtualStudent: Student = {
    id: selectedStudentId || 'stud_temp',
    guardianId: user?.id || 'usr_temp',
    guardianName: user?.displayName || 'Guardian',
    fullName: studentName || 'Student',
    dateOfBirth: dob,
    gender: 'MALE',
    universityId: selectedUniv?.id || 'univ_temp',
    universityName: selectedUniv?.name || 'University',
    courseName,
    degreeType,
    currentAcademicYear: Number(currentYear),
    totalCourseDurationYears: Number(durationYears),
    studentIdNumber: 'STU-VERIFIED',
    annualTuitionFee: Number(annualTuition) || 0,
    otherEligibleExpenses: Number(otherExpenses) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Run Real-Time Centralized Eligibility Validation
  const eligibilityResult: EligibilityValidationResult | null = selectedProduct 
    ? policyEngine.validateStudentEligibility(virtualStudent, selectedProduct, user || undefined)
    : null;

  // Real-time enterprise calculation
  const quoteCalc = selectedProduct ? policyEngine.calculateEnterprisePremium({
    annualTuitionFee: Number(annualTuition) || 0,
    otherEligibleExpenses: Number(otherExpenses) || 0,
    policyDurationYears: Number(durationYears) || 1,
    product: selectedProduct,
    studentAge,
    selectedAddonIds,
    frequency,
    discountCode: discountCode || undefined
  }) : null;

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProduct || !quoteCalc) return;
    setError(null);
    setIsSubmitting(true);

    try {
      // Check eligibility
      if (eligibilityResult && !eligibilityResult.isEligible) {
        throw new Error(`Cannot generate quote: ${eligibilityResult.reasons.join(' ')}`);
      }

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
          degreeType,
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
        selectedProduct,
        Number(durationYears),
        {
          selectedAddonIds,
          frequency,
          discountCode: discountCode || undefined
        }
      );

      navigate(`/quotes/${generated.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">Loading policy options...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>PolicyCenter Quote & Eligibility Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Education Insurance Quote & Plan Discovery
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Explore verified policies, check real-time student qualification, and customize coverage add-ons.
          </p>
        </div>

        <Link
          to="/policies/compare"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-300 shadow-xs transition"
        >
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          <span>Compare Policies Side-by-Side</span>
        </Link>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleGenerateQuote} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Inputs & Plan Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Student Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <span>1. Student & Academic Institution Information</span>
            </h3>

            {students.length > 0 && (
              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={!isNewStudent}
                    onChange={() => setIsNewStudent(false)}
                    className="text-brand-600"
                  />
                  <span>Select Registered Student</span>
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
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Choose Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Partner University / Institution</label>
                <select
                  value={selectedUnivId}
                  onChange={(e) => setSelectedUnivId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Degree Type</label>
                <select
                  value={degreeType}
                  onChange={(e) => setDegreeType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value="UNDERGRADUATE">UNDERGRADUATE (B.Tech, B.Sc, B.Com)</option>
                  <option value="POSTGRADUATE">POSTGRADUATE (M.Tech, MBA, M.Sc)</option>
                  <option value="DIPLOMA">DIPLOMA (Polytechnic / Advanced Diploma)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Annual Tuition Fee (₹) *</label>
                <input
                  type="number"
                  required
                  min={25000}
                  step={10000}
                  value={annualTuition}
                  onChange={(e) => setAnnualTuition(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Hostel & Living Expenses (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Course Duration (Years)</label>
                <select
                  value={durationYears}
                  onChange={(e) => setDurationYears(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value={1}>1 Year</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years</option>
                  <option value={4}>4 Years (Standard Engineering)</option>
                  <option value={5}>5 Years (Dual Degree)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Policy Product Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>2. Select Published Policy Product</span>
              </h3>
              <span className="text-xs text-slate-500">{products.length} Products Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => {
                const isSelected = p.id === selectedProductId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
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
                        {p.tier} TIER • v{p.currentVersion}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{p.name}</h4>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{p.shortDescription}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <div className="text-xs text-slate-500">Base Premium Rate:</div>
                      <div className="text-base font-bold text-brand-700">{p.premiumConfig?.baseRatePercent}% / yr</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Max Cap: {formatINR(p.financialLimits?.maxCoverageLimit || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Centralized Eligibility Indicator */}
          {eligibilityResult && (
            <div className={`p-5 rounded-2xl border ${
              eligibilityResult.isEligible 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                {eligibilityResult.isEligible ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">Student Qualifies for this Policy</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        All mandatory age, enrollment, degree level, and university accreditation requirements are satisfied.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">Policy Unavailable: Ineligibility Detected</h4>
                      <p className="text-xs text-rose-700 mt-0.5">
                        The student does not satisfy configured policy conditions:
                      </p>
                    </div>
                  </>
                )}
              </div>

              {!eligibilityResult.isEligible && (
                <ul className="mt-3 list-disc pl-6 space-y-1 text-xs text-rose-800">
                  {eligibilityResult.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Section 4: Optional Add-on Benefit Riders */}
          {selectedProduct && selectedProduct.coverageBenefits?.some(b => b.isOptionalAddon) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                3. Optional Benefit Riders & Add-ons
              </h3>
              <p className="text-xs text-slate-500">
                Enhance your student's education protection with specialized coverage add-ons.
              </p>

              <div className="space-y-2">
                {selectedProduct.coverageBenefits.filter(b => b.isOptionalAddon).map(addon => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isChecked 
                          ? 'bg-brand-50/60 border-brand-400 text-brand-900 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          className="w-4 h-4 text-brand-600"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{addon.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{addon.description}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-brand-700 text-xs">+{formatINR(addon.addonPremium)}/yr</div>
                        <div className="text-[10px] text-slate-400">Cap: {formatINR(addon.benefitAmount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 5: Payment Frequency */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              4. Payment Schedule Frequency
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'ANNUAL', name: 'Annual Installment', desc: '1 payment / year (Lowest cost)' },
                { id: 'SEMESTER', name: 'Per-Semester (Bi-Annual)', desc: '2 payments / year (Aligned with fee dues)' },
                { id: 'QUARTERLY', name: 'Quarterly', desc: '4 payments / year (Budget friendly)' }
              ].map(f => {
                const isSelected = frequency === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setFrequency(f.id as PaymentFrequency)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected ? 'border-brand-500 bg-brand-50/60 font-bold' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{f.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{f.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Live Actuarial Calculation Sticky Box */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md sticky top-24 space-y-5">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Transparent Premium Breakdown</span>
            </div>

            {quoteCalc && selectedProduct ? (
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
                    <span className="font-medium">{formatINR(quoteCalc.baseRateComponent)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Policy Administration Fee:</span>
                    <span className="font-medium">{formatINR(quoteCalc.basePremium)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Age Factor Adjustment:</span>
                    <span className="font-medium text-emerald-600">
                      {quoteCalc.ageAdjustment >= 0 ? `+${formatINR(quoteCalc.ageAdjustment)}` : formatINR(quoteCalc.ageAdjustment)}
                    </span>
                  </div>
                  {quoteCalc.durationDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Multi-Year Degree Discount ({durationYears} yrs):</span>
                      <span className="font-bold">-{formatINR(quoteCalc.durationDiscountAmount)}</span>
                    </div>
                  )}

                  {quoteCalc.addonPremiumTotal > 0 && (
                    <div className="flex justify-between text-brand-700">
                      <span>Selected Optional Add-ons ({quoteCalc.selectedAddons.length}):</span>
                      <span className="font-bold">+{formatINR(quoteCalc.addonPremiumTotal)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Statutory GST (18%):</span>
                    <span className="font-medium">{formatINR(quoteCalc.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-brand-900 border-t border-slate-200 pt-2 mt-2">
                    <span>Total Annual Premium:</span>
                    <span className="text-brand-700">{formatINR(quoteCalc.totalAnnualPremium)}/yr</span>
                  </div>

                  {frequency !== 'ANNUAL' && (
                    <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-bold flex justify-between">
                      <span>{frequency === 'SEMESTER' ? 'Per-Semester Due:' : 'Quarterly Due:'}</span>
                      <span>{formatINR(quoteCalc.frequencyInstallmentAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-900">Contractual Safeguards:</div>
                  <div>• Waiting Period: <strong>{selectedProduct.coverageBenefits[0]?.waitingPeriodDays ?? 0} days</strong></div>
                  <div>• Deductible: <strong>{formatINR(selectedProduct.financialLimits.deductibleAmount)}</strong></div>
                  <div>• Free-Look Period: <strong>{selectedProduct.cancellationConditions.freeLookPeriodDays} days full refund</strong></div>
                  <div>• Direct University Registrar Escrow Disbursement</div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || (eligibilityResult !== null && !eligibilityResult.isEligible)}
                  className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Evaluating Quote...' : 'Generate Formal Policy Quote'}</span>
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
