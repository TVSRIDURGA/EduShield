import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PoliciesRepo } from '../../repositories/firestoreRepo';
import { EducationPolicy, ClaimType, DocumentType } from '../../models/insurance';
import { claimService } from '../../services/claimService';
import { formatINR, formatDate } from '../../utils/businessRules';
import { Alert } from '../../components/common/Alert';

export const NewClaimPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [policies, setPolicies] = useState<EducationPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [claimType, setClaimType] = useState<ClaimType>('CRITICAL_ILLNESS');
  const [incidentDate, setIncidentDate] = useState('2026-03-10');
  const [description, setDescription] = useState('');
  const [requestedAmount, setRequestedAmount] = useState<number>(220000);

  // Uploaded docs list
  const [documents, setDocuments] = useState<{
    fileName: string;
    fileSize: number;
    documentType: DocumentType;
    fileUrl: string;
  }[]>([
    {
      fileName: 'Government_Aadhaar_Card.pdf',
      fileSize: 450000,
      documentType: 'IDENTITY_PROOF',
      fileUrl: '#'
    },
    {
      fileName: 'Hospital_Discharge_Summary.pdf',
      fileSize: 1200000,
      documentType: 'MEDICAL_REPORT',
      fileUrl: '#'
    },
    {
      fileName: 'University_Fee_Demand_Challan.pdf',
      fileSize: 320000,
      documentType: 'FEE_DEMAND_STATEMENT',
      fileUrl: '#'
    }
  ]);

  const [newDocType, setNewDocType] = useState<DocumentType>('OTHER');
  const [newDocName, setNewDocName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await PoliciesRepo.getAll();
        const myPolicies = all.filter(p => p.status === 'ACTIVE');
        setPolicies(myPolicies);
        if (myPolicies.length > 0) {
          setSelectedPolicyId(myPolicies[0].id);
        }
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const selectedPolicy = policies.find(p => p.id === selectedPolicyId) || policies[0];

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;
    setDocuments(prev => [
      ...prev,
      {
        fileName: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
        fileSize: Math.floor(200000 + Math.random() * 800000),
        documentType: newDocType,
        fileUrl: '#'
      }
    ]);
    setNewDocName('');
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPolicy) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const createdClaim = await claimService.submitClaim(
        {
          policyId: selectedPolicy.id,
          claimType,
          incidentDate,
          description,
          requestedAmount: Number(requestedAmount),
          initialDocuments: documents
        },
        user
      );

      navigate(`/claims/${createdClaim.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-slate-500">Loading active policies...</div>;
  }

  if (policies.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">No Active Policy Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          You must have an in-force, active education policy to file a fee claim.
        </p>
        <Link to="/quotes/new" className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold">
          Get Policy Quote
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          <span>Claims Intake Portal</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Submit Education Insurance Claim
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          File an emergency fee claim for a covered event. Approved claims are transferred directly to your university registrar.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Policy Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            1. Select In-Force Policy
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Active Policy
            </label>
            <select
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              {policies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policyNumber} — {p.studentName} ({p.universityName}) [Max Cover: {formatINR(p.coverageAmount)}]
                </option>
              ))}
            </select>
          </div>

          {selectedPolicy && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400">Insured Student:</span>
                <div className="font-bold text-slate-800">{selectedPolicy.studentName}</div>
              </div>
              <div>
                <span className="text-slate-400">University:</span>
                <div className="font-bold text-slate-800">{selectedPolicy.universityName}</div>
              </div>
              <div>
                <span className="text-slate-400">Waiting Period:</span>
                <div className="font-bold text-emerald-700">Ends {formatDate(selectedPolicy.waitingPeriodEndsAt)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Incident Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            2. Covered Event & Expense Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Covered Event Category
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as ClaimType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="CRITICAL_ILLNESS">Critical Illness / Acute Medical Emergency</option>
                <option value="PARENT_DEATH">Death of Parent / Primary Breadwinner</option>
                <option value="PARENT_DISABILITY">Permanent Total Disability of Parent (&gt;50%)</option>
                <option value="UNEXPECTED_FINANCIAL_HARDSHIP">Catastrophic Involuntary Financial Hardship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Date of Incident
              </label>
              <input
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tuition Fee Amount Claimed (₹)
            </label>
            <input
              type="number"
              required
              min={10000}
              step={5000}
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(Number(e.target.value))}
              placeholder="e.g. 220000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-brand-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Should match the pending tuition invoice from {selectedPolicy?.universityName}.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Incident Narrative / Circumstances
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear factual summary of the medical diagnosis or emergency circumstances..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Step 3: Document Attachments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              <span>3. Supporting Documentation (AI Pre-Screened)</span>
            </h3>
            <span className="text-xs text-slate-500">{documents.length} attached</span>
          </div>

          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{doc.fileName}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {doc.documentType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDoc(idx)}
                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Add more document mock form */}
          <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. Additional_Medical_Report.pdf"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value as DocumentType)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="MEDICAL_REPORT">Medical Report</option>
              <option value="DEATH_CERTIFICATE">Death Certificate</option>
              <option value="DISABILITY_CERTIFICATE">Disability Certificate</option>
              <option value="FEE_DEMAND_STATEMENT">Fee Demand Notice</option>
              <option value="IDENTITY_PROOF">ID Proof</option>
              <option value="OTHER">Other Proof</option>
            </select>
            <button
              type="button"
              onClick={handleAddDocument}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition"
            >
              Attach File
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/claims"
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>{isSubmitting ? 'Evaluating AI Readiness...' : 'Submit Claim & Run AI Triage'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
