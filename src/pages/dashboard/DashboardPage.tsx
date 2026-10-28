import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2, 
  TrendingUp, 
  GraduationCap, 
  Briefcase,
  Users,
  ChevronRight,
  ExternalLink,
  Building,
  Upload,
  UserPlus,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PoliciesRepo, 
  ClaimsRepo, 
  StudentsRepo, 
  UniversitiesRepo, 
  AuditsRepo 
} from '../../repositories/firestoreRepo';
import { 
  EducationPolicy, 
  EducationClaim, 
  Student, 
  University, 
  AuditLog,
  DocumentType 
} from '../../models/insurance';
import { claimService } from '../../services/claimService';
import { formatINR, formatDate } from '../../utils/businessRules';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const DashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<EducationPolicy[]>([]);
  const [claims, setClaims] = useState<EducationClaim[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);

  // Child Registration Modal State for Parents
  const [registerChildModalOpen, setRegisterChildModalOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childUnivId, setChildUnivId] = useState('univ_iitd');
  const [childCourse, setChildCourse] = useState('B.Tech in Computer Science');
  const [childYear, setChildYear] = useState<number>(1);
  const [childDuration, setChildDuration] = useState<number>(4);
  const [childTuition, setChildTuition] = useState<number>(200000);
  const [childRollNo, setChildRollNo] = useState('');
  const [isRegisteringChild, setIsRegisteringChild] = useState(false);
  const [childRegSuccess, setChildRegSuccess] = useState<string | null>(null);

  // Quick document upload state for students
  const [studentDocModalOpen, setStudentDocModalOpen] = useState(false);
  const [studentDocName, setStudentDocName] = useState('');
  const [studentDocType, setStudentDocType] = useState<DocumentType>('ENROLLMENT_LETTER');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allPolicies, allClaims, allStudents, allUniversities, allAudits] = await Promise.all([
          PoliciesRepo.getAll(),
          ClaimsRepo.getAll(),
          StudentsRepo.getAll(),
          UniversitiesRepo.getAll(),
          AuditsRepo.getAll()
        ]);
        setPolicies(allPolicies);
        setClaims(allClaims);
        setStudents(allStudents);
        setUniversities(allUniversities);
        setAudits(allAudits);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [role, user]);

  const handleRegisterChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !childName.trim()) return;
    setIsRegisteringChild(true);

    try {
      const selectedUniv = universities.find(u => u.id === childUnivId) || universities[0];
      const newChild: Student = {
        id: 'stud_' + Date.now(),
        guardianId: user.id,
        guardianName: user.displayName,
        fullName: childName.trim(),
        dateOfBirth: '2006-05-15',
        gender: 'OTHER',
        universityId: selectedUniv.id,
        universityName: selectedUniv.name,
        courseName: childCourse,
        degreeType: 'UNDERGRADUATE',
        currentAcademicYear: Number(childYear),
        totalCourseDurationYears: Number(childDuration),
        studentIdNumber: childRollNo.trim() || `STU-${Date.now().toString().slice(-6)}`,
        annualTuitionFee: Number(childTuition),
        otherEligibleExpenses: 60000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await StudentsRepo.create(newChild);
      setStudents(prev => [newChild, ...prev]);
      setChildRegSuccess(`Successfully registered ${newChild.fullName} under your authorized family portfolio.`);
      setChildName('');
      setChildRollNo('');
      setTimeout(() => {
        setRegisterChildModalOpen(false);
        setChildRegSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to register child:', err);
    } finally {
      setIsRegisteringChild(false);
    }
  };

  const handleStudentUploadSubmit = async (e: React.FormEvent, claimId: string) => {
    e.preventDefault();
    if (!user || !studentDocName) return;
    setIsUploadingDoc(true);
    try {
      const updated = await claimService.addDocument(
        claimId,
        {
          fileName: studentDocName.endsWith('.pdf') ? studentDocName : `${studentDocName}.pdf`,
          fileSize: 350000,
          documentType: studentDocType,
          fileUrl: '#'
        },
        user
      );
      setClaims(prev => prev.map(c => c.id === updated.id ? updated : c));
      setStudentDocModalOpen(false);
      setStudentDocName('');
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  // ==========================================
  // 1. GUARDIAN DASHBOARD VIEW
  // ==========================================
  if (role === 'guardian') {
    const isCanonicalDemo = user?.email === 'guardian@edushield.demo';
    const myPolicies = policies.filter(p => p.guardianId === user?.id || (isCanonicalDemo && p.guardianId === 'usr_guardian_1'));
    const myClaims = claims.filter(c => c.guardianId === user?.id || (isCanonicalDemo && c.guardianId === 'usr_guardian_1'));
    const myStudents = students.filter(s => s.guardianId === user?.id || (isCanonicalDemo && s.guardianId === 'usr_guardian_1'));

    const totalCoverage = myPolicies.reduce((acc, p) => acc + (p.status === 'ACTIVE' ? p.coverageAmount : 0), 0);
    const activePoliciesCount = myPolicies.filter(p => p.status === 'ACTIVE').length;
    const pendingClaimsCount = myClaims.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'ASSESSMENT', 'DOCUMENTS_REQUIRED', 'UNIVERSITY_VERIFICATION_PENDING'].includes(c.status)).length;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-brand-900 via-brand-800 to-teal-800 rounded-2xl p-6 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Parent / Guardian Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.displayName}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Your registered family education policies and college fee protections are active and monitored.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRegisterChildModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition backdrop-blur"
            >
              <UserPlus className="w-4 h-4 text-teal-300" />
              <span>Register Child</span>
            </button>
            <Link
              to="/quotes/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-xs shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Get Policy Quote</span>
            </Link>
            <Link
              to="/claims/new"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs shadow-md transition"
            >
              <FileText className="w-4 h-4" />
              <span>Submit Claim</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Active Cover"
            value={formatINR(totalCoverage)}
            subtitle="Combined across covered children"
            icon={ShieldCheck}
            color="blue"
          />
          <StatCard
            title="Active Policies"
            value={activePoliciesCount}
            subtitle="Zero lapses recorded"
            icon={CheckCircle2}
            color="emerald"
            trend="100% In-Force"
            trendType="positive"
          />
          <StatCard
            title="Registered Children"
            value={myStudents.length}
            subtitle="Higher education records"
            icon={GraduationCap}
            color="teal"
          />
          <StatCard
            title="Active Claims"
            value={pendingClaimsCount}
            subtitle="Under review & university verification"
            icon={FileText}
            color="amber"
          />
        </div>

        {/* Active Policies & Claims Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Policies Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-600" />
                  <span>My Education Policies</span>
                </h3>
                <Link to="/policies" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {myPolicies.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">
                  No policies bound yet. <Link to="/quotes/new" className="text-brand-600 font-semibold underline">Get your child's first quote</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPolicies.map((pol) => (
                    <div 
                      key={pol.id} 
                      className="p-4 rounded-xl border border-slate-200/80 hover:border-brand-300 bg-slate-50/50 hover:bg-white transition shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{pol.studentName}</span>
                            <Badge status={pol.status} />
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>{pol.universityName}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-600">{pol.policyNumber}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-bold text-brand-700">{formatINR(pol.coverageAmount)}</div>
                          <div className="text-[11px] text-slate-500">Premium: {formatINR(pol.totalAnnualPremium)}/yr (Paid)</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Valid till {formatDate(pol.expiryDate)}
                        </span>
                        <Link 
                          to={`/policies/${pol.id}`}
                          className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                        >
                          Certificate Details <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Claims History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>Recent Claims & Status Progress</span>
                </h3>
                <Link to="/claims" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  View Claims <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {myClaims.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">
                  No claims submitted. Your covered students are in good standing.
                </div>
              ) : (
                <div className="space-y-4">
                  {myClaims.map((claim) => (
                    <div 
                      key={claim.id} 
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {claim.claimType.replace('_', ' ')} — {claim.studentName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Claim #{claim.claimNumber} • Filed on {formatDate(claim.createdAt)}
                          </div>
                        </div>
                        <Badge status={claim.status} />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">AI Readiness Score:</span>
                          <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {claim.readinessScore}%
                          </span>
                        </div>
                        <Link 
                          to={`/claims/${claim.id}`}
                          className="font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                        >
                          Track Claim <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick AI & Continuity Intelligence Sidebar */}
          <div className="space-y-6">
            {/* Registered Family Members */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  <span>My Covered Children</span>
                </h4>
                <button
                  onClick={() => setRegisterChildModalOpen(true)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {myStudents.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">
                  No child profile linked yet. Click Add to register your child.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myStudents.map(s => (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{s.fullName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.universityName}</div>
                      <div className="text-[11px] text-teal-700 font-medium mt-0.5">{s.courseName} (Yr {s.currentAcademicYear})</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 rounded-2xl border border-teal-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm mb-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>EduShield Continuity Intelligence</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Education Funding-Gap Calculator
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Project multi-year degree liabilities, inflation adjustments, and insurance cushions.
              </p>
              <Link
                to="/continuity"
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition"
              >
                Open Funding-Gap Simulator <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-brand-800 font-bold text-sm mb-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>AI Policy Explainer</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Have questions about exclusions, waiting periods, or mandatory claim documents? Ask our grounded AI assistant.
              </p>
              <Link
                to="/ai-assistant"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Ask policy questions <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Modal: Register Child */}
        {registerChildModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register / Link Child</h3>
                  <p className="text-xs text-slate-500">Add a child to your authorized parent portfolio for insurance coverage</p>
                </div>
              </div>

              {childRegSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  {childRegSuccess}
                </div>
              )}

              <form onSubmit={handleRegisterChildSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Child Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Enrolled University
                  </label>
                  <select
                    value={childUnivId}
                    onChange={(e) => setChildUnivId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Degree / Course Name
                  </label>
                  <input
                    type="text"
                    required
                    value={childCourse}
                    onChange={(e) => setChildCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Current Year
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      required
                      value={childYear}
                      onChange={(e) => setChildYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Annual Tuition (₹)
                    </label>
                    <input
                      type="number"
                      min={10000}
                      step={5000}
                      required
                      value={childTuition}
                      onChange={(e) => setChildTuition(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Student ID / Roll Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={childRollNo}
                    onChange={(e) => setChildRollNo(e.target.value)}
                    placeholder="e.g. 2023CS10482"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setRegisterChildModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegisteringChild}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-50"
                  >
                    {isRegisteringChild ? 'Saving...' : 'Register Child'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. STUDENT DASHBOARD VIEW (Dynamic Firestore Data)
  // ==========================================
  if (role === 'student') {
    const isCanonicalDemo = user?.email === 'student@edushield.demo';
    
    // Look up student details dynamically
    const studentProfile = students.find(s => 
      s.id === user?.id || 
      (isCanonicalDemo && s.id === 'stud_aarav_1') ||
      s.fullName.toLowerCase() === user?.displayName.toLowerCase()
    ) || students[0];

    const studentPolicy = policies.find(p => 
      p.studentId === studentProfile?.id || 
      (isCanonicalDemo && p.id === 'pol_active_aarav') ||
      p.studentName.toLowerCase() === user?.displayName.toLowerCase()
    );

    const studentClaim = claims.find(c => 
      c.studentId === studentProfile?.id || 
      (isCanonicalDemo && c.id === 'clm_active_1') ||
      c.studentName.toLowerCase() === user?.displayName.toLowerCase()
    );

    const coverageAmount = studentPolicy?.coverageAmount || (studentProfile ? studentProfile.annualTuitionFee * studentProfile.totalCourseDurationYears : 1200000);
    const policyStatus = studentPolicy?.status || 'ACTIVE';

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-teal-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>Student Academic Continuity Shield</span>
            </div>
            <h1 className="text-2xl font-bold">
              Hello, {user?.displayName}
            </h1>
            <p className="text-teal-200/80 text-sm mt-0.5">
              {studentProfile ? `${studentProfile.universityName} • ${studentProfile.courseName} (Year ${studentProfile.currentAcademicYear})` : 'Enrolled Student Account'}
            </p>
          </div>
          {studentClaim && (
            <div className="bg-teal-800/80 p-3 rounded-xl border border-teal-700 text-right">
              <span className="text-[11px] text-teal-300 block">Claim Status</span>
              <span className="text-sm font-bold text-white">{studentClaim.status.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Degree Protection In-Force"
            value={formatINR(coverageAmount)}
            subtitle="Covers tuition & campus fee through graduation"
            icon={ShieldCheck}
            color="teal"
          />
          <StatCard
            title="Coverage Policy"
            value={policyStatus}
            subtitle={studentPolicy ? `Policy #${studentPolicy.policyNumber}` : 'Protected under Parent Policy'}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Claim Support"
            value={studentClaim ? studentClaim.status.replace('_', ' ') : 'None Pending'}
            subtitle={studentClaim ? `Claim #${studentClaim.claimNumber}` : 'No active disruptions reported'}
            icon={FileText}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Your Covered Academic Protections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">Direct Tuition Remittance</h5>
                  <p className="text-slate-600">
                    If an unforeseen family contingency occurs, EduShield remits remaining semester tuition directly to {studentProfile?.universityName || 'your university registrar'} so classes and examinations proceed without delay.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-1">Campus Living Allowance</h5>
                  <p className="text-slate-600">
                    Includes mandatory hostel, laboratory, and campus mess allowances to safeguard living expenses through your degree completion.
                  </p>
                </div>
              </div>

              {/* View-Only Policy Terms Notice for Students */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Student view-only access: Policy modifications and premium payments are managed exclusively by your registered parent/guardian.</span>
                </div>
                {studentPolicy && (
                  <Link to={`/policies/${studentPolicy.id}`} className="font-semibold text-blue-700 underline text-nowrap ml-2">
                    View Policy
                  </Link>
                )}
              </div>
            </div>

            {/* Active Claim Tracker for Student */}
            {studentClaim && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-slate-900">Active Claim Tracking</h4>
                  <Badge status={studentClaim.status} />
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Claim #{studentClaim.claimNumber} • Filed for {studentClaim.claimType.replace('_', ' ')} (Requested: {formatINR(studentClaim.requestedAmount)})
                </p>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                  <span className="text-slate-500">Readiness Score: {studentClaim.readinessScore}%</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStudentDocModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition"
                    >
                      Upload Supporting Document
                    </button>
                    <Link
                      to={`/claims/${studentClaim.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
                    >
                      View Claim Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Continuity Intelligence</span>
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Check whether your multi-year degree funding is balanced against campus fee inflation.
              </p>
              <Link
                to="/continuity"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs transition"
              >
                Inspect Continuity Gap <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Ask Policy AI</span>
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Clarify any question regarding coverage limits, medical exceptions, or semester verification processes.
              </p>
              <Link
                to="/ai-assistant"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 font-semibold text-xs transition"
              >
                Chat with Assistant <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Modal: Student Document Upload */}
        {studentDocModalOpen && studentClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Upload Student Supporting Document</h3>
              <p className="text-xs text-slate-500">Attach enrollment certificates or fee demands for claim review</p>
              <form onSubmit={(e) => handleStudentUploadSubmit(e, studentClaim.id)} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={studentDocType}
                    onChange={(e) => setStudentDocType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="ENROLLMENT_LETTER">University Enrollment Letter</option>
                    <option value="FEE_DEMAND_STATEMENT">Semester Fee Demand Challan</option>
                    <option value="IDENTITY_PROOF">Student Identity Card / Aadhaar</option>
                    <option value="OTHER">Other Academic Record</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document File Name</label>
                  <input
                    type="text"
                    required
                    value={studentDocName}
                    onChange={(e) => setStudentDocName(e.target.value)}
                    placeholder="e.g. Spring_2026_Enrollment_Certificate.pdf"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStudentDocModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingDoc}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
                  >
                    {isUploadingDoc ? 'Uploading...' : 'Submit Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 3. CLAIMS OFFICER DASHBOARD VIEW
  // ==========================================
  if (role === 'claims_officer') {
    const pendingReview = claims.filter(c => ['SUBMITTED', 'UNDER_REVIEW', 'ASSESSMENT'].includes(c.status));
    const docsRequired = claims.filter(c => c.status === 'DOCUMENTS_REQUIRED');
    const univPending = claims.filter(c => c.status === 'UNIVERSITY_VERIFICATION_PENDING');
    const approvedClaims = claims.filter(c => ['APPROVED', 'PAID'].includes(c.status));

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Briefcase className="w-4 h-4" />
              <span>Claims Adjuster Console (Guidewire ClaimCenter Pattern)</span>
            </div>
            <h1 className="text-2xl font-bold">
              Claims Adjudication Queue
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Review policy coverage, verify university fee demand notes, and authorize student disbursements.
            </p>
          </div>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition"
          >
            Export Claims Ledger (CSV)
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Awaiting Adjudication"
            value={pendingReview.length}
            subtitle="Needs officer findings"
            icon={Briefcase}
            color="purple"
          />
          <StatCard
            title="Docs Required Cases"
            value={docsRequired.length}
            subtitle="Claimant action requested"
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            title="Univ Verification Pending"
            value={univPending.length}
            subtitle="Awaiting Registrar confirmation"
            icon={GraduationCap}
            color="blue"
          />
          <StatCard
            title="Authorized & Paid Payouts"
            value={approvedClaims.length}
            subtitle="Direct to University"
            icon={CheckCircle2}
            color="emerald"
          />
        </div>

        {/* Claims Queue Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Adjudication Work Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Triage priority ordered by AI readiness score and university fee deadline</p>
            </div>
            <Link to="/claims" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              View All Claims
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Claim ID</th>
                  <th className="px-6 py-3.5">Student & University</th>
                  <th className="px-6 py-3.5">Event Type</th>
                  <th className="px-6 py-3.5">Requested</th>
                  <th className="px-6 py-3.5">AI Readiness</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {claim.claimNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{claim.studentName}</div>
                      <div className="text-[11px] text-slate-500">{claim.universityName}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {claim.claimType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatINR(claim.requestedAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {claim.readinessScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={claim.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/claims/${claim.id}/review`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs transition"
                      >
                        <span>Adjudicate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. UNIVERSITY REGISTRAR DASHBOARD VIEW
  // ==========================================
  if (role === 'university') {
    const isCanonicalDemo = user?.email === 'university@edushield.demo';
    const currentUnivId = user?.universityId || (isCanonicalDemo ? 'univ_iitd' : 'univ_iitd');
    const myUniv = universities.find(u => u.id === currentUnivId) || universities[0];

    const univClaims = claims.filter(c => c.universityId === currentUnivId);
    const pendingVerifs = univClaims.filter(c => c.universityVerification?.status === 'PENDING');
    const verifiedTotal = univClaims.filter(c => c.universityVerification?.status === 'VERIFIED').length;
    const totalFeeRemittances = univClaims.filter(c => c.status === 'PAID').reduce((acc, c) => acc + c.requestedAmount, 0);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-amber-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>University Registrar Fee Portal</span>
            </div>
            <h1 className="text-2xl font-bold">
              {myUniv?.name}
            </h1>
            <p className="text-amber-200/80 text-sm mt-0.5">
              Verify student enrollment, confirm outstanding semester dues, and audit direct fee escrow remittances.
            </p>
          </div>
          <Link
            to="/university/verification"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm transition shadow-md"
          >
            Open Verification Queue
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Pending Ledger Checks"
            value={pendingVerifs.length}
            subtitle="Action required by Registrar"
            icon={GraduationCap}
            color="amber"
          />
          <StatCard
            title="Verified Students"
            value={verifiedTotal}
            subtitle="Enrollment & fees confirmed"
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Total Fee Remittances"
            value={formatINR(totalFeeRemittances || 220000)}
            subtitle={`Disbursed directly into ${myUniv?.bankDetails?.bankName || 'Institute'} Escrow`}
            icon={ShieldCheck}
            color="teal"
          />
        </div>

        {/* Verification Queue Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Pending Fee Verifications for {myUniv?.name}</h3>
          {univClaims.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No claims pending for this institution.</p>
          ) : (
            <div className="space-y-4">
              {univClaims.map((claim) => (
                <div key={claim.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {claim.studentName} — Claim #{claim.claimNumber}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Claimed Tuition: {formatINR(claim.requestedAmount)} • Event: {claim.claimType}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={claim.universityVerification?.status || 'PENDING'} />
                    <Link
                      to="/university/verification"
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition"
                    >
                      Verify Ledger
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. ADMINISTRATOR DASHBOARD VIEW (Strictly for role === 'admin')
  // ==========================================
  if (role === 'admin') {
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(p => p.status === 'ACTIVE').length;
    const totalClaims = claims.length;
    const totalClaimAmount = claims.reduce((acc, c) => acc + c.requestedAmount, 0);

    const claimsByStatusData = [
      { name: 'Submitted', count: claims.filter(c => c.status === 'SUBMITTED').length, color: '#0284c7' },
      { name: 'Under Review', count: claims.filter(c => c.status === 'UNDER_REVIEW').length, color: '#8b5cf6' },
      { name: 'Univ Pending', count: claims.filter(c => c.status === 'UNIVERSITY_VERIFICATION_PENDING').length, color: '#f59e0b' },
      { name: 'Approved', count: claims.filter(c => c.status === 'APPROVED').length, color: '#10b981' },
      { name: 'Paid', count: claims.filter(c => c.status === 'PAID').length, color: '#059669' },
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Insurance System Administration Console</span>
            </div>
            <h1 className="text-2xl font-bold">
              EduShield Operations Hub
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Platform metrics, user role management, actuarial rules, and audit logs.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/users"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
            >
              Manage Users & Roles
            </Link>
            <Link
              to="/admin/plans"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
            >
              Plans
            </Link>
            <Link
              to="/admin/rules"
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition"
            >
              Business Rules
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Policies In-Force"
            value={activePolicies}
            subtitle={`${totalPolicies} total issued`}
            icon={ShieldCheck}
            color="blue"
          />
          <StatCard
            title="Total Claims Filed"
            value={totalClaims}
            subtitle={`Requested: ${formatINR(totalClaimAmount)}`}
            icon={FileText}
            color="amber"
          />
          <StatCard
            title="Partner Universities"
            value={universities.length}
            subtitle="Direct fee integration active"
            icon={GraduationCap}
            color="teal"
          />
          <StatCard
            title="Audited System Actions"
            value={audits.length}
            subtitle="100% trace coverage"
            icon={Users}
            color="purple"
          />
        </div>

        {/* Operational Charts with Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Claims by Operational Status</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution across the claims adjudication lifecycle</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={claimsByStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit Log Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Immutable Audit Trail</h3>
                <p className="text-xs text-slate-500">Live operational events recorded under Guidewire audit principles</p>
              </div>
              <Link to="/reports" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                View Log
              </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
              {audits.slice(0, 6).map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDate(log.timestamp)}</span>
                  </div>
                  <p className="text-slate-600 mt-1 line-clamp-1">{log.details}</p>
                  <div className="mt-1 text-[10px] text-slate-500">
                    By: {log.performedByUserName} ({log.performedByUserRole})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. DEFAULT FALLBACK: ACCESS PENDING / UNVERIFIED ROLE
  // ==========================================
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Account Role Pending Verification</h2>
      <p className="text-xs text-slate-500">
        Your account ({user?.email}) has authenticated, but an authorized role has not been provisioned. Contact an administrator to assign your operational privileges.
      </p>
    </div>
  );
};
