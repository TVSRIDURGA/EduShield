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
  ExternalLink
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
  AuditLog 
} from '../../models/insurance';
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
    const myPolicies = policies.filter(p => p.guardianId === user?.id || user?.email === 'guardian@edushield.demo');
    const myClaims = claims.filter(c => c.guardianId === user?.id || user?.email === 'guardian@edushield.demo');
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
              Welcome back, {user?.displayName || 'Rajesh Sharma'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Your children's college education is safeguarded with continuous fee protection.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/quotes/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold text-sm shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Get New Policy Quote</span>
            </Link>
            <Link
              to="/claims/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition backdrop-blur"
            >
              <FileText className="w-4 h-4" />
              <span>Submit a Claim</span>
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
            title="Active Claims"
            value={pendingClaimsCount}
            subtitle="Under review & university verification"
            icon={FileText}
            color="amber"
          />
          <StatCard
            title="Continuity Gap Calculator"
            value="Optimal"
            subtitle="Tap to view multi-year projection"
            icon={Sparkles}
            color="teal"
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
                  No policies found. <Link to="/quotes/new" className="text-brand-600 font-semibold underline">Get your first quote</Link>
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
                          <div className="text-[11px] text-slate-500">Premium: {formatINR(pol.totalAnnualPremium)}/yr</div>
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
                          Policy Details <ArrowRight className="w-3 h-3" />
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
            <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 rounded-2xl border border-teal-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm mb-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>EduShield Continuity Intelligence</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Education Funding-Gap Calculator
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Calculate potential shortfalls in college tuition, hostel, and semester expenses before emergency strikes.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-white/80 border border-teal-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-800">Aarav Sharma</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Degree:</span>
                  <span className="font-semibold text-slate-800">B.Tech CSE (IIT Delhi)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Insurance Protection:</span>
                  <span className="font-bold text-emerald-600">100% Protected</span>
                </div>
              </div>
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
      </div>
    );
  }

  // ==========================================
  // 2. CLAIMS OFFICER DASHBOARD VIEW
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

        {/* Claims Work Queue Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Priority Claims Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cases prioritized by AI Readiness Score and incident timestamp</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Claim Number</th>
                  <th className="px-6 py-3">Student & University</th>
                  <th className="px-6 py-3">Covered Event</th>
                  <th className="px-6 py-3">Requested Amount</th>
                  <th className="px-6 py-3">AI Readiness</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {claim.claimNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{claim.studentName}</div>
                      <div className="text-[11px] text-slate-500">{claim.universityName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">
                        {claim.claimType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatINR(claim.requestedAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {claim.readinessScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={claim.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/claims/${claim.id}/review`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition"
                      >
                        Review Case
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
  // 3. UNIVERSITY REPRESENTATIVE DASHBOARD
  // ==========================================
  if (role === 'university') {
    const univClaims = claims.filter(c => c.universityId === 'univ_iitd' || user?.universityId === c.universityId);
    const pendingVerifs = univClaims.filter(c => c.universityVerification?.status === 'PENDING');
    const verifiedTotal = univClaims.filter(c => c.universityVerification?.status === 'VERIFIED').length;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-amber-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>University Registrar Fee Portal</span>
            </div>
            <h1 className="text-2xl font-bold">
              Indian Institute of Technology Delhi (IIT Delhi)
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
            value={formatINR(220000)}
            subtitle="Disbursed directly into SBI Escrow"
            icon={ShieldCheck}
            color="teal"
          />
        </div>

        {/* Verification Queue Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Pending Fee Verifications</h3>
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
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. STUDENT DASHBOARD VIEW
  // ==========================================
  if (role === 'student') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-teal-900 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Student Academic Continuity Shield</span>
          </div>
          <h1 className="text-2xl font-bold">
            Hello, Aarav Sharma
          </h1>
          <p className="text-teal-200/80 text-sm mt-0.5">
            IIT Delhi • B.Tech in Computer Science & Engineering (2nd Year)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Degree Protection In-Force"
            value={formatINR(1200000)}
            subtitle="Covers tuition + hostel through graduation"
            icon={ShieldCheck}
            color="teal"
          />
          <StatCard
            title="Policy Status"
            value="ACTIVE"
            subtitle="Policy #EDU-2026-881924"
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            title="Active Claim Support"
            value="Under Review"
            subtitle="Direct fee transfer pending IIT Delhi"
            icon={FileText}
            color="amber"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Your Covered Academic Protections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Tuition Fee Direct Remittance</h5>
              <p className="text-slate-600">
                In the event of an approved contingency, EduShield pays remaining semester fees directly to the IIT Delhi Registrar so your classes and exam registration never halt.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Hostel & Living Allowance Grant</h5>
              <p className="text-slate-600">
                Includes campus hostel, mess, and laboratory allowance subsidies to ensure you can continue staying on campus seamlessly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. ADMINISTRATOR DASHBOARD VIEW (Default / Fallback)
  // ==========================================
  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.status === 'ACTIVE').length;
  const totalClaims = claims.length;
  const totalClaimAmount = claims.reduce((acc, c) => acc + c.requestedAmount, 0);

  // Recharts Chart Data: Claims by status
  const claimsByStatusData = [
    { name: 'Submitted', count: claims.filter(c => c.status === 'SUBMITTED').length, color: '#0284c7' },
    { name: 'Under Review', count: claims.filter(c => c.status === 'UNDER_REVIEW').length, color: '#8b5cf6' },
    { name: 'Univ Pending', count: claims.filter(c => c.status === 'UNIVERSITY_VERIFICATION_PENDING').length, color: '#f59e0b' },
    { name: 'Approved', count: claims.filter(c => c.status === 'APPROVED').length, color: '#10b981' },
    { name: 'Paid', count: claims.filter(c => c.status === 'PAID').length, color: '#059669' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Insurance System Administration Console</span>
          </div>
          <h1 className="text-2xl font-bold">
            EduShield Operations Hub
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Platform metrics, actuarial rule configuration, loss ratio, and audit compliance logs.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/plans"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
          >
            Manage Plans
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
          subtitle={`Total Requested: ${formatINR(totalClaimAmount)}`}
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
};
