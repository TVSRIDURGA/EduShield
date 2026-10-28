import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Sparkles, 
  Building, 
  CreditCard,
  Paperclip,
  ArrowRight,
  ShieldAlert,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimsRepo } from '../../repositories/firestoreRepo';
import { EducationClaim, DocumentType } from '../../models/insurance';
import { claimService } from '../../services/claimService';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';

export const ClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [claim, setClaim] = useState<EducationClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDocOpen, setUploadDocOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('OTHER');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const c = await ClaimsRepo.getById(id);
        setClaim(c);
      } catch (err) {
        console.error('Failed to load claim:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim || !user || !docName) return;
    setIsUploading(true);
    try {
      const updated = await claimService.addDocument(
        claim.id,
        {
          fileName: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
          fileSize: 450000,
          documentType: docType,
          fileUrl: '#'
        },
        user
      );
      setClaim(updated);
      setUploadDocOpen(false);
      setDocName('');
    } catch (err) {
      console.error('Document upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">Loading claim file...</div>;
  }

  if (!claim) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">Claim Not Found</h2>
        <Link to="/claims" className="mt-4 inline-block text-brand-600 font-semibold text-sm">
          Return to Claims
        </Link>
      </div>
    );
  }

  // Authorization Check
  const isDemoGuardian = user?.email === 'guardian@edushield.demo';
  const isDemoStudent = user?.email === 'student@edushield.demo';
  const isDemoUniv = user?.email === 'university@edushield.demo';

  const isAuthorized = 
    role === 'admin' ||
    role === 'claims_officer' ||
    (role === 'guardian' && (claim.guardianId === user?.id || (isDemoGuardian && claim.guardianId === 'usr_guardian_1'))) ||
    (role === 'student' && (claim.studentId === user?.id || claim.studentName.toLowerCase() === user?.displayName.toLowerCase() || (isDemoStudent && claim.id === 'clm_active_1'))) ||
    (role === 'university' && (claim.universityId === user?.universityId || (isDemoUniv && claim.universityId === 'univ_iitd')));

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500">
          You do not have authorization to view this insurance claim record. Claims are accessible exclusively to the filing parent, the student beneficiary, the authorized university registrar, or an assigned claims officer.
        </p>
        <Link
          to="/claims"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Claims</span>
        </Link>
      </div>
    );
  }

  // Stages for Guidewire-style workflow progress
  const stages = [
    { label: 'Submitted', active: true },
    { label: 'Under Review', active: ['UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'UNIVERSITY_VERIFICATION_PENDING', 'ASSESSMENT', 'APPROVED', 'PAID'].includes(claim.status) },
    { label: 'Univ Verification', active: ['UNIVERSITY_VERIFICATION_PENDING', 'ASSESSMENT', 'APPROVED', 'PAID'].includes(claim.status) || claim.universityVerification?.status === 'VERIFIED' },
    { label: 'Assessment', active: ['ASSESSMENT', 'APPROVED', 'PAID'].includes(claim.status) },
    { label: 'Approved', active: ['APPROVED', 'PAID'].includes(claim.status) },
    { label: 'Fee Paid', active: claim.status === 'PAID' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
              {claim.claimNumber}
            </span>
            <Badge status={claim.status} />
            <span className="text-xs text-slate-400">Filed {formatDate(claim.createdAt)}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {claim.claimType.replace('_', ' ')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student: <strong>{claim.studentName}</strong> • {claim.universityName} • Policy #{claim.policyNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(role === 'claims_officer' || role === 'admin') && (
            <Link
              to={`/claims/${claim.id}/review`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <span>Adjuster Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={() => setUploadDocOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          Claim Adjudication Lifecycle
        </h4>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0"></div>
          {stages.map((stage, i) => (
            <div key={i} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                stage.active
                  ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {i + 1}
              </div>
              <span className={`text-[11px] font-medium mt-1.5 ${
                stage.active ? 'text-brand-900 font-bold' : 'text-slate-400'
              }`}>
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Preliminary Assessment Box */}
      {claim.aiPreliminaryAssessment && (
        <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 rounded-2xl border border-teal-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-teal-100 pb-3">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>EduShield AI Claim Document Assistant & Triage</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-lg">
              <span>Readiness Score:</span>
              <span className="text-sm font-black">{claim.readinessScore}%</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {claim.aiPreliminaryAssessment.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-3 rounded-xl bg-white/80 border border-teal-200 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Verified & Completed Checks:
              </span>
              <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                {claim.readinessChecklist?.filter(c => c.isCompleted).map((item, i) => (
                  <li key={i}>{item.item}</li>
                )) || <li>Policy active & waiting period verified</li>}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-white/80 border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Pending Verification Items:
              </span>
              <ul className="list-disc pl-4 text-amber-800 space-y-0.5 text-[11px]">
                {claim.aiPreliminaryAssessment.missingItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Details & Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Incident Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Incident Circumstances
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Incident Date</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{formatDate(claim.incidentDate)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Claimed Amount</span>
                <div className="font-bold text-brand-700 text-sm mt-0.5">{formatINR(claim.requestedAmount)}</div>
              </div>
            </div>
            <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              {claim.description}
            </div>
          </div>

          {/* Attached Documents */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Uploaded Proof & Documents ({claim.documents.length})
              </h3>
              <button
                onClick={() => setUploadDocOpen(true)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Upload File
              </button>
            </div>

            <div className="space-y-3">
              {claim.documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-bold text-slate-900">{doc.fileName}</div>
                      <div className="text-[10px] text-slate-500">
                        {doc.documentType} • Uploaded {formatDate(doc.uploadedAt)}
                      </div>
                    </div>
                  </div>
                  <div>
                    {doc.verifiedByOfficer ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        Verified
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium">
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: University & Payment Info */}
        <div className="space-y-6">
          {/* University Registrar Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Building className="w-4 h-4 text-amber-600" />
              <span>University Fee Verification</span>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-semibold text-slate-900">{claim.universityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registrar Status:</span>
                <Badge status={claim.universityVerification?.status || 'PENDING'} />
              </div>
              {claim.universityVerification?.status === 'VERIFIED' && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-500">Roll No: <strong>{claim.universityVerification.studentRollNo}</strong></div>
                  <div className="text-emerald-700 font-semibold mt-0.5">
                    Confirmed Dues: {formatINR(claim.universityVerification.confirmedOutstandingFee)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status Card */}
          {claim.payment ? (
            <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>University Fee Remittance</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Disbursed Amount:</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatINR(claim.payment.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge status={claim.payment.status} />
                </div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  Beneficiary: {claim.payment.beneficiaryAccount}
                  <div className="font-mono text-[10px] text-slate-600 mt-0.5">
                    UTR: {claim.payment.transactionReference}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-700">Fee Disbursement Schedule:</span>
              <p>Upon final claims officer approval, fees will be wired directly to the {claim.universityName} Registrar fee escrow.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadDocOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleUpload} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Upload Additional Document</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Document Description / Filename
              </label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Updated_Medical_Ledger.pdf"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="MEDICAL_REPORT">Medical Report</option>
                <option value="FEE_DEMAND_STATEMENT">Fee Demand Notice</option>
                <option value="IDENTITY_PROOF">Identity Proof</option>
                <option value="DISABILITY_CERTIFICATE">Disability Certificate</option>
                <option value="DEATH_CERTIFICATE">Death Certificate</option>
                <option value="OTHER">Other Proof</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUploadDocOpen(false)}
                className="px-3 py-2 border rounded-lg text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold"
              >
                {isUploading ? 'Attaching...' : 'Attach Document'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
