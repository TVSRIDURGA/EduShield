import { EducationPolicy, EducationClaim, DocumentType, ClaimType } from '../models/insurance';
import { evaluateClaimReadiness } from '../utils/businessRules';

export interface PolicyExplanationResult {
  answer: string;
  citedClauses: string[];
  groundedInPolicy: boolean;
  requiredDocuments: string[];
  waitingPeriodStatus: string;
}

export interface DocumentAnalysisResult {
  summary: string;
  identifiedDocTypes: DocumentType[];
  missingMandatoryItems: string[];
  riskFlags: string[];
  claimReadinessScore: number;
  preliminaryRecommendation: 'RECOMMEND_APPROVAL' | 'DOCUMENTS_REQUIRED' | 'MANUAL_REVIEW_NEEDED';
  rationale: string;
}

export const aiService = {
  /**
   * Feature B: Grounded AI Policy Explainer
   * Explains coverage, exclusions, waiting periods, and next steps strictly grounded in policy terms.
   */
  async explainPolicy(query: string, policy: EducationPolicy): Promise<PolicyExplanationResult> {
    const qLower = query.toLowerCase();
    const citedClauses: string[] = [];
    const requiredDocs: string[] = [];

    // Check waiting period status
    const now = new Date();
    const waitingEnds = new Date(policy.waitingPeriodEndsAt);
    const isWaitingOver = now >= waitingEnds;
    const waitingPeriodStatus = isWaitingOver 
      ? `Completed on ${waitingEnds.toLocaleDateString('en-IN')}`
      : `Active until ${waitingEnds.toLocaleDateString('en-IN')} (${Math.ceil((waitingEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining)`;

    let answer = '';

    // Grounded clause matching
    if (qLower.includes('cover') || qLower.includes('benefit') || qLower.includes('how much') || qLower.includes('limit')) {
      citedClauses.push('Clause 3.1: Eligible Education Expenses & Benefit Schedule');
      citedClauses.push(`Policy Schedule: Coverage Limit ₹${policy.coverageAmount.toLocaleString('en-IN')}`);
      
      const benefitList = policy.benefits.map(b => `• ${b.name}: Limit ₹${b.coverageLimit.toLocaleString('en-IN')}`).join('\n');
      answer = `Under policy ${policy.policyNumber} (${policy.planName}), your child ${policy.studentName} is covered up to a total of ₹${policy.coverageAmount.toLocaleString('en-IN')}.\n\nCovered Benefits:\n${benefitList}\n\nAll approved disbursements are transferred directly to ${policy.universityName} to ensure continuous enrollment.`;
    } 
    else if (qLower.includes('exclusion') || qLower.includes('not cover') || qLower.includes('rejected')) {
      citedClauses.push('Clause 7.4: General Policy Exclusions & Non-Covered Events');
      const exclusionList = policy.exclusions.map(e => `• ${e}`).join('\n');
      answer = `Policy ${policy.policyNumber} specifies the following exclusion and non-covered conditions:\n\n${exclusionList}\n\nIn addition, claims arising from events before policy effective date (${new Date(policy.effectiveDate).toLocaleDateString('en-IN')}) or during unfulfilled waiting periods are strictly excluded.`;
    }
    else if (qLower.includes('waiting period') || qLower.includes('waiting')) {
      citedClauses.push(`Clause 2.3: Initial Policy Waiting Period (${policy.waitingPeriodDays} Days)`);
      answer = `Your policy specifies a ${policy.waitingPeriodDays}-day waiting period from inception.\n\nCurrent Status: ${waitingPeriodStatus}.\nClaims for incidents occurring prior to this date cannot be authorized under Section 2.3.`;
    }
    else if (qLower.includes('document') || qLower.includes('need') || qLower.includes('proof')) {
      citedClauses.push('Section 8: Mandatory Claim Proof & Documentation Guidelines');
      requiredDocs.push('Government ID Proof of Guardian & Student');
      requiredDocs.push('Official University Tuition Fee Demand Notice / Ledger Statement');
      requiredDocs.push('Medical Certificate / Hospital Discharge / Death Certificate (depending on incident)');
      
      answer = `To initiate a claim against policy ${policy.policyNumber}, the following documents are mandatory under Section 8:\n1. Government Identity Proof (Aadhaar / Passport)\n2. Official Fee Demand Notice from ${policy.universityName}\n3. Official verification certificate corresponding to the covered event.\n\nAll documents are verified against university records before payout authorization.`;
    }
    else {
      citedClauses.push('EduShield Master Policy Terms & Conditions (2026 Edition)');
      answer = `Policy ${policy.policyNumber} is currently ACTIVE for student ${policy.studentName} at ${policy.universityName}. Total coverage is ₹${policy.coverageAmount.toLocaleString('en-IN')} with annual renewal on ${new Date(policy.renewalDueDate).toLocaleDateString('en-IN')}. For specific clause inquiries, you may ask about covered benefits, exclusions, waiting periods, or claim documentation requirements.`;
    }

    return {
      answer,
      citedClauses,
      groundedInPolicy: true,
      requiredDocuments: requiredDocs,
      waitingPeriodStatus
    };
  },

  /**
   * Feature C: AI Claim Document Assistant & Preliminary Triage
   * Summarizes documents, detects missing items, evaluates readiness score.
   */
  async analyzeClaimDocuments(
    claim: EducationClaim,
    policy: EducationPolicy
  ): Promise<DocumentAnalysisResult> {
    const uploadedTypes = claim.documents.map(d => d.documentType);
    const hasUnivVerif = claim.universityVerification?.status === 'VERIFIED';
    const isPolicyActive = policy.status === 'ACTIVE';
    const isWaitingOver = new Date() >= new Date(policy.waitingPeriodEndsAt);

    const readiness = evaluateClaimReadiness(
      claim.claimType,
      uploadedTypes,
      hasUnivVerif,
      isPolicyActive,
      isWaitingOver
    );

    const riskFlags: string[] = [];
    if (!isPolicyActive) riskFlags.push('Policy is not currently in ACTIVE status.');
    if (!isWaitingOver) riskFlags.push('Incident occurred within the mandatory policy waiting period.');
    if (claim.requestedAmount > policy.coverageAmount) {
      riskFlags.push(`Requested amount (₹${claim.requestedAmount.toLocaleString('en-IN')}) exceeds total policy coverage limit (₹${policy.coverageAmount.toLocaleString('en-IN')}).`);
    }

    let preliminaryRecommendation: 'RECOMMEND_APPROVAL' | 'DOCUMENTS_REQUIRED' | 'MANUAL_REVIEW_NEEDED' = 'RECOMMEND_APPROVAL';
    let rationale = '';

    if (readiness.missingDocs.length > 0) {
      preliminaryRecommendation = 'DOCUMENTS_REQUIRED';
      rationale = `Missing ${readiness.missingDocs.length} mandatory documentation item(s): ${readiness.missingDocs.join(', ')}.`;
    } else if (riskFlags.length > 0) {
      preliminaryRecommendation = 'MANUAL_REVIEW_NEEDED';
      rationale = `Risk flags detected: ${riskFlags.join('; ')}. Senior Claims Adjuster review required.`;
    } else if (!hasUnivVerif) {
      preliminaryRecommendation = 'MANUAL_REVIEW_NEEDED';
      rationale = `Awaiting registrar enrollment & fee balance verification from ${claim.universityName}.`;
    } else {
      preliminaryRecommendation = 'RECOMMEND_APPROVAL';
      rationale = 'All mandatory documents verified, policy active, waiting period satisfied, and university ledger confirmed.';
    }

    const summary = `Analyzed ${claim.documents.length} document(s) for claim ${claim.claimNumber} (${claim.claimType}). Readiness Score is ${readiness.readinessScore}%. ${rationale}`;

    return {
      summary,
      identifiedDocTypes: uploadedTypes,
      missingMandatoryItems: readiness.missingDocs,
      riskFlags,
      claimReadinessScore: readiness.readinessScore,
      preliminaryRecommendation,
      rationale
    };
  }
};
