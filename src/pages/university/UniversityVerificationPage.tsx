import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimsRepo } from '../../repositories/firestoreRepo';
import { EducationClaim } from '../../models/insurance';
import { claimService } from '../../services/claimService';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const UniversityVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<EducationClaim[]>([]);
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
        const all = await ClaimsRepo.getAll();
        const univClaims = all.filter(c => c.universityId === 'univ_iitd' || user?.universityId === c.universityId);
        setClaims(univClaims);
        if (univClaims.length > 0 && !activeClaimId) {
          setActiveClaimId(univClaims[0].id);
        }
      } catch (err) {
        console.error('Failed to load university verification cases:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

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
            Indian Institute of Technology Delhi (IIT Delhi)
          </h1>
          <p className="text-xs text-amber-200/80 mt-0.5">
            Authorized portal for Registrar Accounts to confirm student enrollment, inspect fee demand challans, and certify institutional dues.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-amber-200">Registrar Representative:</div>
          <div className="text-sm font-bold">{user?.displayName || 'Dr. Sunita Deshmukh'}</div>
        </div>
      </div>

      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cases List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Pending Verification Cases</h3>
          {claims.map((c) => {
            const isSelected = c.id === activeClaim?.id;
            const isVerified = c.universityVerification?.status === 'VERIFIED';
            return (
              <div
                key={c.id}
                onClick={() => setActiveClaimId(c.id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected 
                    ? 'border-amber-500 bg-amber-50/50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{c.studentName}</span>
                  <Badge status={c.universityVerification?.status || 'PENDING'} />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Claim #{c.claimNumber} • {formatINR(c.requestedAmount)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Form */}
        <div className="lg:col-span-2">
          {activeClaim ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Verify Student Enrollment & Fee Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Claim #{activeClaim.claimNumber} filed for {activeClaim.claimType}
                  </p>
                </div>
                <Badge status={activeClaim.universityVerification?.status || 'PENDING'} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400">Student Name:</span>
                  <div className="font-bold text-slate-900 text-sm">{activeClaim.studentName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Claimed Tuition:</span>
                  <div className="font-bold text-brand-700 text-sm">{formatINR(activeClaim.requestedAmount)}</div>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Institute Roll / Registration Number
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Certified Outstanding Tuition Dues (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={outstandingFee}
                      onChange={(e) => setOutstandingFee(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-amber-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">
                    Registrar Remarks & Enrollment Confirmation
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                  ℹ️ Once certified, this claim advances automatically to <strong>ASSESSMENT</strong> and updates the policy's AI Readiness Score to 100%.
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isVerifying ? 'Certifying...' : 'Certify Enrollment & Fee Dues'}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">Select a claim to review</div>
          )}
        </div>
      </div>
    </div>
  );
};
