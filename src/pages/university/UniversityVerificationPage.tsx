import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  ArrowRight,
  ShieldCheck,
  Lock,
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimsRepo, UniversitiesRepo } from '../../repositories/firestoreRepo';
import { EducationClaim, University, UniversityVerificationStatus } from '../../models/insurance';
import { claimService } from '../../services/claimService';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const UniversityVerificationPage: React.FC = () => {
  const { user, role } = useAuth();
  const [claims, setClaims] = useState<EducationClaim[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for active item
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [rollNo, setRollNo] = useState('2023CS10482');
  const [annualFee, setAnnualFee] = useState<number>(220000);
  const [outstandingFee, setOutstandingFee] = useState<number>(220000);
  const [verifStatus, setVerifStatus] = useState<UniversityVerificationStatus>('VERIFIED_OUTSTANDING');
  const [remarks, setRemarks] = useState('Official university records verified. Student enrollment and semester tuition dues confirmed with Registrar fee accounts.');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [all, allUnivs] = await Promise.all([
          ClaimsRepo.getAll(),
          UniversitiesRepo.getAll()
        ]);
        setUniversities(allUnivs);

        const isDemoUniv = user?.email === 'university@edushield.demo';
        const targetUnivId = user?.universityId || (isDemoUniv ? 'univ_iitd' : '');

        const univClaims = role === 'admin' 
          ? all 
          : all.filter(c => c.universityId === targetUnivId);

        setClaims(univClaims);
        if (univClaims.length > 0) {
          const first = univClaims[0];
          setActiveClaimId(first.id);
          setRollNo(first.universityVerification?.studentRollNo || '2023CS10482');
          setAnnualFee(first.universityVerification?.confirmedAnnualTuition || first.requestedAmount);
          setOutstandingFee(first.universityVerification?.confirmedOutstandingFee || first.requestedAmount);
          if (first.universityVerification?.status && first.universityVerification.status !== 'PENDING') {
            setVerifStatus(first.universityVerification.status);
          } else {
            setVerifStatus('VERIFIED_OUTSTANDING');
          }
          if (first.universityVerification?.officerRemarks) {
            setRemarks(first.universityVerification.officerRemarks);
          }
        }
      } catch (err) {
        console.error('Failed to load university verification cases:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, role]);

  // Authorization check
  if (role !== 'university' && role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          The University Verification Console is accessible exclusively to authorized university registrar accounts and administrators.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  const isDemoUniv = user?.email === 'university@edushield.demo';
  const targetUnivId = user?.universityId || (isDemoUniv ? 'univ_iitd' : '');
  const myUniv = universities.find(u => u.id === targetUnivId) || universities[0];
  const activeClaim = claims.find(c => c.id === activeClaimId) || claims[0];

  const handleSelectClaim = (c: EducationClaim) => {
    setActiveClaimId(c.id);
    setRollNo(c.universityVerification?.studentRollNo || '2023CS10482');
    setAnnualFee(c.universityVerification?.confirmedAnnualTuition || c.requestedAmount);
    setOutstandingFee(c.universityVerification?.confirmedOutstandingFee || c.requestedAmount);
    if (c.universityVerification?.status && c.universityVerification.status !== 'PENDING') {
      setVerifStatus(c.universityVerification.status);
    } else {
      setVerifStatus('VERIFIED_OUTSTANDING');
    }
    if (c.universityVerification?.officerRemarks) {
      setRemarks(c.universityVerification.officerRemarks);
    }
    setError(null);
    setSuccessMsg(null);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim || !user) return;
    setError(null);
    setSuccessMsg(null);
    setIsVerifying(true);

    try {
      const updated = await claimService.verifyByUniversity(
        activeClaim.id,
        rollNo,
        Number(annualFee),
        Number(outstandingFee),
        remarks,
        user,
        verifStatus
      );
      setClaims(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSuccessMsg(`Institutional verification recorded for ${updated.studentName}! Decision status: [${verifStatus}]. Synchronized with claim adjudication.`);
    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Verification failed. Please check parameters.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Institution Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-800">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>Dedicated University Registrar Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {myUniv?.name}
          </h1>
          <p className="text-xs text-amber-200/80 mt-0.5">
            {myUniv?.code} • {myUniv?.city}, {myUniv?.state} • {myUniv?.accreditationGrade}
          </p>
          <div className="mt-2 text-[11px] text-amber-200/90 font-mono bg-amber-950/60 inline-block px-2.5 py-1 rounded-lg border border-amber-800/80">
            Escrow Beneficiary: {myUniv?.bankDetails?.accountName} ({myUniv?.bankDetails?.bankName} - {myUniv?.bankDetails?.accountNumberMasked})
          </div>
        </div>
        <div className="text-left md:text-right bg-amber-950/40 p-3 rounded-xl border border-amber-800/50">
          <div className="text-[11px] text-amber-300 uppercase font-semibold">Authorized Registrar:</div>
          <div className="text-sm font-bold text-white">{user?.displayName}</div>
          <div className="text-[11px] text-amber-200/70 font-mono">{user?.email}</div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      {claims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-lg">Verification Queue Clear</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            There are currently no active claims requiring institutional fee verification for <strong>{myUniv?.name}</strong>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Verification Cases List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Fee Verification Queue ({claims.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">{myUniv?.code}</span>
            </div>

            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => handleSelectClaim(claim)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                    activeClaim?.id === claim.id
                      ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-500/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-700">{claim.claimNumber}</span>
                    <Badge status={claim.universityVerification?.status || 'PENDING'} />
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-1">{claim.studentName}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{claim.claimType.replace('_', ' ')}</div>
                  <div className="mt-2 text-slate-800 font-semibold flex justify-between items-center">
                    <span>Claimed Dues:</span>
                    <span className="text-amber-800 font-bold">{formatINR(claim.requestedAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 2 Columns: Active Verification Form */}
          {activeClaim && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Case #{activeClaim.claimNumber}
                    </span>
                    <Badge status={activeClaim.universityVerification?.status || 'PENDING'} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    Audit & Certify Tuition Dues: {activeClaim.studentName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Institution: <strong className="text-slate-700">{activeClaim.universityName}</strong> • Policy #{activeClaim.policyNumber}
                  </p>
                </div>

                {/* Submitted Challan Document Preview */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-brand-600" />
                    <span>Parent / Student Attached Fee Demand Challan:</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-800">
                      {activeClaim.documents.find(d => d.documentType === 'FEE_DEMAND_STATEMENT')?.fileName || `${myUniv?.code}_Semester_Fee_Demand_Challan.pdf`}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Document Attached
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">
                    Claim Description: "{activeClaim.description}"
                  </p>
                </div>

                {/* Verification Form */}
                <form onSubmit={handleVerify} className="space-y-4 text-xs">
                  {/* Status Selection Buttons */}
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Institutional Verification Decision & Ledger Outcome
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setVerifStatus('VERIFIED_OUTSTANDING')}
                        className={`p-3 rounded-xl border text-left transition ${
                          verifStatus === 'VERIFIED_OUTSTANDING'
                            ? 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          <span className="font-bold">VERIFIED_OUTSTANDING</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Enrollment confirmed; semester fee is outstanding on institute ledger (approved for wire).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerifStatus('VERIFIED_PAID')}
                        className={`p-3 rounded-xl border text-left transition ${
                          verifStatus === 'VERIFIED_PAID'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-bold">VERIFIED_PAID</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Enrollment confirmed; records verify semester fee has already been settled in full.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerifStatus('DISCREPANCY')}
                        className={`p-3 rounded-xl border text-left transition ${
                          verifStatus === 'DISCREPANCY'
                            ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span className="font-bold">DISCREPANCY</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Mismatched roll number, student not enrolled in current semester, or ineligible dues.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVerifStatus('REQUIRES_INFORMATION')}
                        className={`p-3 rounded-xl border text-left transition ${
                          verifStatus === 'REQUIRES_INFORMATION'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="font-bold">REQUIRES_INFORMATION</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Additional semester tuition challan or department clearance required before verification.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Institute Roll Number / Student Registration ID
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 2024A7PS0192H"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Annual Tuition Fee (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={annualFee}
                        onChange={(e) => setAnnualFee(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Outstanding Fee Balance (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={outstandingFee}
                        onChange={(e) => setOutstandingFee(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Registrar Certification Remarks
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Confirm student is currently registered, semester credits, fee ledger status, and payment details..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    🏛️ <strong>Direct Escrow Certification</strong>: By submitting, you certify records on behalf of <strong>{myUniv?.name}</strong>. Certified dues will disburse directly to institutional escrow: <strong>{myUniv?.bankDetails?.accountName}</strong>.
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? 'Submitting Verification...' : `Submit Institutional Decision [${verifStatus}]`}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
