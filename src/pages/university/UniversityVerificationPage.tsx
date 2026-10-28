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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimsRepo, UniversitiesRepo } from '../../repositories/firestoreRepo';
import { EducationClaim, University } from '../../models/insurance';
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
  const [remarks, setRemarks] = useState('Enrollment verified in good standing. Spring semester tuition outstanding in institute accounts.');
  const [isVerifying, setIsVerifying] = useState(false);
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
        const targetUnivId = user?.universityId || (isDemoUniv ? 'univ_iitd' : 'univ_iitd');

        const univClaims = role === 'admin' 
          ? all 
          : all.filter(c => c.universityId === targetUnivId);

        setClaims(univClaims);
        if (univClaims.length > 0) {
          setActiveClaimId(univClaims[0].id);
          setAnnualFee(univClaims[0].requestedAmount);
          setOutstandingFee(univClaims[0].requestedAmount);
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
  const targetUnivId = user?.universityId || (isDemoUniv ? 'univ_iitd' : 'univ_iitd');
  const myUniv = universities.find(u => u.id === targetUnivId) || universities[0];
  const activeClaim = claims.find(c => c.id === activeClaimId) || claims[0];

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim || !user) return;
    setIsVerifying(true);
    setSuccessMsg(null);

    try {
      const updated = await claimService.verifyByUniversity(
        activeClaim.id,
        rollNo,
        Number(annualFee),
        Number(outstandingFee),
        remarks,
        user
      );
      setClaims(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSuccessMsg(`Institutional verification completed for ${updated.studentName}! Claim advanced to Assessment.`);
    } catch (err: any) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-amber-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building className="w-4 h-4" />
            <span>University Registrar Fee Verification Console</span>
          </div>
          <h1 className="text-2xl font-bold">
            {myUniv?.name}
          </h1>
          <p className="text-xs text-amber-200/80 mt-0.5">
            Authorized portal for Registrar Accounts to confirm student enrollment, inspect fee demand challans, and certify institutional dues.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-amber-200">Registrar Representative:</div>
          <div className="text-sm font-bold">{user?.displayName}</div>
        </div>
      </div>

      {successMsg && <Alert type="success">{successMsg}</Alert>}

      {claims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 text-base">Verification Queue Clear</h3>
          <p className="text-xs mt-1">There are currently no claims awaiting enrollment certification for {myUniv?.name}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Verification Cases List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Assigned Claims Queue ({claims.length})
            </h3>

            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => {
                    setActiveClaimId(claim.id);
                    setAnnualFee(claim.requestedAmount);
                    setOutstandingFee(claim.requestedAmount);
                  }}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                    activeClaim?.id === claim.id
                      ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-700">{claim.claimNumber}</span>
                    <Badge status={claim.universityVerification?.status || 'PENDING'} />
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-1">{claim.studentName}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{claim.claimType.replace('_', ' ')}</div>
                  <div className="mt-2 text-slate-700 font-semibold">
                    Fee Due: {formatINR(claim.requestedAmount)}
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
                    Certify Enrollment & Tuition Dues: {activeClaim.studentName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Institution: {activeClaim.universityName} • Policy #{activeClaim.policyNumber}
                  </p>
                </div>

                {/* Submitted Challan Document Preview */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-brand-600" />
                    <span>Parent Attached Fee Challan:</span>
                  </div>
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-800">
                      {activeClaim.documents.find(d => d.documentType === 'FEE_DEMAND_STATEMENT')?.fileName || 'University_Fee_Demand_Challan.pdf'}
                    </span>
                    <span className="text-[11px] font-semibold text-brand-600">Attached in File</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Parent Claim Statement: "{activeClaim.description}"
                  </p>
                </div>

                {/* Verification Form */}
                <form onSubmit={handleVerify} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Institute Roll Number / Student Registration ID
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 2023CS10482"
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-700"
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
                      placeholder="Confirm student is currently registered, semester credits, and fee deadline date..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    🏛️ <strong>Direct Escrow Certification</strong>: By certifying, you verify this student is in good standing and designate institutional bank escrow <strong>{myUniv?.bankDetails?.accountName}</strong> for claim fee remittance.
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? 'Certifying...' : 'Certify Enrollment & Confirm Tuition Dues'}</span>
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
