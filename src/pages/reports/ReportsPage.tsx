import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Table, 
  ShieldCheck, 
  Calendar, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { 
  QuotesRepo, 
  PoliciesRepo, 
  ClaimsRepo, 
  AuditsRepo 
} from '../../repositories/firestoreRepo';
import { 
  Quote, 
  EducationPolicy, 
  EducationClaim, 
  AuditLog 
} from '../../models/insurance';
import { formatINR, formatDate } from '../../utils/businessRules';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'policies' | 'claims' | 'quotes' | 'audits'>('claims');
  const [policies, setPolicies] = useState<EducationPolicy[]>([]);
  const [claims, setClaims] = useState<EducationClaim[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, c, q, a] = await Promise.all([
          PoliciesRepo.getAll(),
          ClaimsRepo.getAll(),
          QuotesRepo.getAll(),
          AuditsRepo.getAll()
        ]);
        setPolicies(p);
        setClaims(c);
        setQuotes(q);
        setAudits(a);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    const now = new Date().toISOString().split('T')[0];
    if (reportType === 'claims') {
      const headers = ['Claim Number', 'Student Name', 'University', 'Event Type', 'Requested (INR)', 'Approved (INR)', 'Status', 'Readiness Score', 'Created Date'];
      const rows = claims.map(c => [
        c.claimNumber,
        c.studentName,
        c.universityName,
        c.claimType,
        c.requestedAmount,
        c.approvedAmount,
        c.status,
        `${c.readinessScore}%`,
        formatDate(c.createdAt)
      ]);
      downloadCSV(`edushield_claims_report_${now}.csv`, headers, rows);
    } else if (reportType === 'policies') {
      const headers = ['Policy Number', 'Guardian', 'Student', 'University', 'Plan Tier', 'Coverage Limit (INR)', 'Annual Premium (INR)', 'Status', 'Effective Date', 'Expiry Date'];
      const rows = policies.map(p => [
        p.policyNumber,
        p.guardianName,
        p.studentName,
        p.universityName,
        p.planName,
        p.coverageAmount,
        p.totalAnnualPremium,
        p.status,
        formatDate(p.effectiveDate),
        formatDate(p.expiryDate)
      ]);
      downloadCSV(`edushield_policies_report_${now}.csv`, headers, rows);
    } else if (reportType === 'quotes') {
      const headers = ['Quote Number', 'Guardian', 'Student', 'University', 'Plan', 'Coverage (INR)', 'Annual Premium (INR)', 'Status', 'Calculated Date'];
      const rows = quotes.map(q => [
        q.quoteNumber,
        q.guardianName,
        q.studentName,
        q.universityName,
        q.planName,
        q.coverageAmount,
        q.totalAnnualPremium,
        q.status,
        formatDate(q.calculatedAt)
      ]);
      downloadCSV(`edushield_quotes_report_${now}.csv`, headers, rows);
    } else if (reportType === 'audits') {
      const headers = ['Action', 'Entity Type', 'Entity ID', 'User Name', 'Role', 'Details', 'Timestamp'];
      const rows = audits.map(a => [
        a.action,
        a.entityType,
        a.entityId,
        a.performedByUserName,
        a.performedByUserRole,
        a.details,
        a.timestamp
      ]);
      downloadCSV(`edushield_audit_trail_${now}.csv`, headers, rows);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Operational Reporting & Audit Compliance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Reports & Export Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export authorized policy, claim, payment, and audit trail records in CSV format.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition"
        >
          <Download className="w-4 h-4" />
          <span>Export {reportType.toUpperCase()} (CSV)</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {(['claims', 'policies', 'quotes', 'audits'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setReportType(tab)}
            className={`px-3 py-1.5 rounded-lg capitalize transition ${
              reportType === tab
                ? 'bg-brand-50 text-brand-700 border border-brand-200 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} Report
          </button>
        ))}
      </div>

      {/* Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
              {reportType === 'claims' && (
                <tr>
                  <th className="px-6 py-3">Claim Number</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">University</th>
                  <th className="px-6 py-3">Event</th>
                  <th className="px-6 py-3">Requested</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              )}
              {reportType === 'policies' && (
                <tr>
                  <th className="px-6 py-3">Policy Number</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Coverage</th>
                  <th className="px-6 py-3">Premium</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              )}
              {reportType === 'quotes' && (
                <tr>
                  <th className="px-6 py-3">Quote Number</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Coverage</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              )}
              {reportType === 'audits' && (
                <tr>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Entity</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Time</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {reportType === 'claims' && claims.map(c => (
                <tr key={c.id}>
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">{c.claimNumber}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">{c.studentName}</td>
                  <td className="px-6 py-3 text-slate-600">{c.universityName}</td>
                  <td className="px-6 py-3 text-slate-700">{c.claimType}</td>
                  <td className="px-6 py-3 font-bold text-slate-900">{formatINR(c.requestedAmount)}</td>
                  <td className="px-6 py-3">{c.status}</td>
                </tr>
              ))}
              {reportType === 'policies' && policies.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">{p.policyNumber}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">{p.studentName}</td>
                  <td className="px-6 py-3 text-slate-600">{p.planName}</td>
                  <td className="px-6 py-3 font-bold text-slate-900">{formatINR(p.coverageAmount)}</td>
                  <td className="px-6 py-3 text-slate-700">{formatINR(p.totalAnnualPremium)}/yr</td>
                  <td className="px-6 py-3">{p.status}</td>
                </tr>
              ))}
              {reportType === 'quotes' && quotes.map(q => (
                <tr key={q.id}>
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">{q.quoteNumber}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">{q.studentName}</td>
                  <td className="px-6 py-3 text-slate-600">{q.planName}</td>
                  <td className="px-6 py-3 font-bold text-slate-900">{formatINR(q.coverageAmount)}</td>
                  <td className="px-6 py-3">{q.status}</td>
                </tr>
              ))}
              {reportType === 'audits' && audits.map(a => (
                <tr key={a.id}>
                  <td className="px-6 py-3 font-bold text-slate-900">{a.action}</td>
                  <td className="px-6 py-3 font-mono text-[11px] text-slate-600">{a.entityType}:{a.entityId}</td>
                  <td className="px-6 py-3 text-slate-700">{a.performedByUserName} ({a.performedByUserRole})</td>
                  <td className="px-6 py-3 text-slate-600 max-w-xs truncate">{a.details}</td>
                  <td className="px-6 py-3 font-mono text-[10px] text-slate-400">{formatDate(a.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
