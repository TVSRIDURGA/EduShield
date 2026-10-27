import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  FileCheck,
  Building,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PoliciesRepo, ClaimsRepo } from '../../repositories/firestoreRepo';
import { EducationPolicy, EducationClaim } from '../../models/insurance';
import { aiService, PolicyExplanationResult, DocumentAnalysisResult } from '../../services/aiService';
import { Badge } from '../../components/common/Badge';

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<EducationPolicy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [claims, setClaims] = useState<EducationClaim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'policy_explainer' | 'doc_assistant'>('policy_explainer');

  // Policy Explainer State
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{
    role: 'user' | 'assistant';
    content: string;
    citedClauses?: string[];
    groundedInPolicy?: boolean;
    requiredDocs?: string[];
  }[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your EduShield Grounded AI Policy Assistant. You can ask me any question about your active coverage limits, waiting periods, eligible college expenses, or mandatory claim documents.',
      citedClauses: ['EduShield Master Policy Terms & Conditions (2026 Edition)']
    }
  ]);
  const [isAnswering, setIsAnswering] = useState(false);

  // Document Assistant State
  const [docAnalysis, setDocAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [analyzingDocs, setAnalyzingDocs] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [allPols, allClaims] = await Promise.all([
          PoliciesRepo.getAll(),
          ClaimsRepo.getAll()
        ]);
        setPolicies(allPols);
        if (allPols.length > 0) {
          setSelectedPolicyId(allPols[0].id);
        }
        setClaims(allClaims);
        if (allClaims.length > 0) {
          setSelectedClaimId(allClaims[0].id);
        }
      } catch (err) {
        console.error('Failed to load AI context:', err);
      }
    }
    load();
  }, [user]);

  const activePolicy = policies.find(p => p.id === selectedPolicyId) || policies[0];
  const activeClaim = claims.find(c => c.id === selectedClaimId) || claims[0];

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q || !activePolicy || isAnswering) return;

    const userMessage = { role: 'user' as const, content: q };
    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');
    setIsAnswering(true);

    try {
      const res = await aiService.explainPolicy(q, activePolicy);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          citedClauses: res.citedClauses,
          groundedInPolicy: res.groundedInPolicy,
          requiredDocs: res.requiredDocuments
        }
      ]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your policy query. Please try again.',
          citedClauses: []
        }
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleRunDocScan = async () => {
    if (!activeClaim || !activePolicy) return;
    setAnalyzingDocs(true);
    try {
      const result = await aiService.analyzeClaimDocuments(activeClaim, activePolicy);
      setDocAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzingDocs(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-brand-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>EduShield Continuity Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            AI Policy Explainer & Document Assistant
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Grounded answers backed strictly by verified policy terms and schema-validated document verification checklists.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/10 p-1.5 rounded-xl border border-white/20 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('policy_explainer')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'policy_explainer' ? 'bg-white text-slate-900 shadow-sm' : 'text-white hover:text-teal-200'
            }`}
          >
            Policy Explainer
          </button>
          <button
            onClick={() => setActiveTab('doc_assistant')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'doc_assistant' ? 'bg-white text-slate-900 shadow-sm' : 'text-white hover:text-teal-200'
            }`}
          >
            Claim Document Triage
          </button>
        </div>
      </div>

      {/* Active Context Banner */}
      {activePolicy && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Active Grounded Policy:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {activePolicy.policyNumber}
            </span>
            <span className="font-semibold text-brand-700">{activePolicy.studentName} ({activePolicy.universityName})</span>
          </div>

          {policies.length > 1 && (
            <select
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
            >
              {policies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policyNumber} ({p.studentName})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* TAB 1: GROUNDED POLICY EXPLAINER */}
      {activeTab === 'policy_explainer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chat stream */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" /> Grounded Q&A Assistant
              </span>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                Clause-Grounded
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`p-4 rounded-2xl text-xs max-w-xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-xs whitespace-pre-line'
                  }`}>
                    {msg.content}

                    {/* Grounded Clause Badges */}
                    {msg.citedClauses && msg.citedClauses.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 space-y-1">
                        <span className="font-semibold text-slate-700 block">Grounding Citations:</span>
                        {msg.citedClauses.map((clause, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-teal-700 font-mono">
                            <BookOpen className="w-3 h-3 text-teal-600" />
                            <span>{clause}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isAnswering && (
                <div className="text-xs text-slate-400 italic flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  Grounded AI is analyzing policy schedule and clauses...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleAsk(); }}
              className="p-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-b-2xl"
            >
              <input
                type="text"
                placeholder="Ask about covered tuition, exclusions, waiting period, or claim documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <button
                type="submit"
                disabled={isAnswering || !query.trim()}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right: Suggested Questions Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand-600" /> Frequently Asked Policy Clauses
              </h4>
              <p className="text-xs text-slate-500">
                Click any standard query to inspect how the assistant retrieves grounded policy clauses:
              </p>

              <div className="space-y-2">
                {[
                  'What does my policy cover?',
                  'What are the major exclusions under this plan?',
                  'What is my waiting period status?',
                  'What documents are required to file a fee claim?',
                  'How does the university direct payout work?'
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(q)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-xs text-slate-700 hover:text-brand-800 transition font-medium"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" /> Strict Hallucination Guardrails
              </span>
              <p className="text-[11px] text-teal-800/90 leading-relaxed">
                The assistant strictly references verified clauses within active policy schedules and master guidelines. It does not invent benefits or authorize claims autonomously.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLAIM DOCUMENT TRIAGE */}
      {activeTab === 'doc_assistant' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Claim Document Pre-Screening & Readiness Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated checklist validation, document summarization, and discrepancy detection.
                </p>
              </div>

              {activeClaim && (
                <button
                  onClick={handleRunDocScan}
                  disabled={analyzingDocs}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{analyzingDocs ? 'Scanning Checklist...' : 'Run Document Pre-Screen'}</span>
                </button>
              )}
            </div>

            {activeClaim ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Claim:</span>
                  <span className="font-bold text-slate-900">#{activeClaim.claimNumber} ({activeClaim.studentName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Event Category:</span>
                  <span className="font-semibold text-slate-800">{activeClaim.claimType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attached Files:</span>
                  <span className="font-semibold text-slate-800">{activeClaim.documents.length} document(s)</span>
                </div>
              </div>
            ) : null}

            {docAnalysis && (
              <div className="mt-4 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Calculated Claim Readiness Score
                    </span>
                    <div className="text-3xl font-black text-emerald-700">
                      {docAnalysis.claimReadinessScore}%
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Recommendation: <strong>{docAnalysis.preliminaryRecommendation}</strong>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Identified Risk Flags & Action Items
                    </span>
                    <ul className="list-disc pl-4 text-amber-800 text-[11px] space-y-1">
                      {docAnalysis.riskFlags.length > 0 ? (
                        docAnalysis.riskFlags.map((rf, idx) => <li key={idx}>{rf}</li>)
                      ) : (
                        <li>No acute risk or duplicate submission flags detected</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-900">Document Summary & Rationale:</span>
                  <p className="text-slate-700 leading-relaxed">{docAnalysis.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
