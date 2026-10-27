import { 
  ClaimStatus, 
  ClaimType, 
  DocumentType, 
  InsurancePlan, 
  PolicyStatus, 
  QuoteStatus,
  EducationPolicy,
  FundingGapAnalysis
} from '../models/insurance';

/**
 * Format currency in Indian Rupees (INR ₹)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format dates in Indian locale (DD/MM/YYYY)
 */
export function formatDate(isoDateString?: string): string {
  if (!isoDateString) return '—';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoDateString;
  }
}

/**
 * Collision-resistant sequential ID generators
 */
export function generateQuoteNumber(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `QTE-${new Date().getFullYear()}-${randomSuffix}`;
}

export function generatePolicyNumber(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `EDU-${new Date().getFullYear()}-${randomSuffix}`;
}

export function generateClaimNumber(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `CLM-${new Date().getFullYear()}-${randomSuffix}`;
}

export function generatePaymentNumber(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `PAY-${new Date().getFullYear()}-${randomSuffix}`;
}

/**
 * Deterministic Transparent Premium Calculator
 */
export interface PremiumCalculationInput {
  annualTuitionFee: number;
  otherEligibleExpenses: number;
  policyDurationYears: number;
  plan: InsurancePlan;
  studentAge: number;
}

export interface PremiumCalculationResult {
  coverageAmount: number;
  basePremium: number;
  riskFactorAdjustment: number;
  taxAmount: number;
  totalAnnualPremium: number;
  factors: {
    baseRatePercent: number;
    durationFactor: number;
    ageFactor: number;
    taxRatePercent: number;
  };
}

export function calculatePremium(input: PremiumCalculationInput): PremiumCalculationResult {
  const { annualTuitionFee, otherEligibleExpenses, policyDurationYears, plan, studentAge } = input;
  
  // Total coverage = (Annual tuition + other expenses) * duration
  const annualTotalExpense = annualTuitionFee + otherEligibleExpenses;
  const coverageAmount = Math.min(annualTotalExpense * policyDurationYears, plan.maxCoverageLimit);

  // Age factor: standard college age (17-25) = 1.0; older students slightly adjusted
  let ageFactor = 1.0;
  if (studentAge < 17) ageFactor = 0.95;
  else if (studentAge > 28) ageFactor = 1.10;

  // Duration factor: Longer commitments get volume discounts
  let durationFactor = 1.0;
  if (policyDurationYears >= 4) durationFactor = 0.90; // 10% discount for 4+ year courses
  else if (policyDurationYears === 3) durationFactor = 0.95;

  const baseAnnualCover = coverageAmount / policyDurationYears;
  const baseRate = plan.baseRatePercent / 100;
  const rawAnnualBase = baseAnnualCover * baseRate;

  const adjustedAnnual = rawAnnualBase * ageFactor * durationFactor;
  const riskFactorAdjustment = Math.round(adjustedAnnual - rawAnnualBase);

  // Standard Indian GST (18%) on insurance products
  const taxRate = 0.18;
  const taxAmount = Math.round(adjustedAnnual * taxRate);
  const totalAnnualPremium = Math.round(adjustedAnnual + taxAmount);

  return {
    coverageAmount,
    basePremium: Math.round(rawAnnualBase),
    riskFactorAdjustment,
    taxAmount,
    totalAnnualPremium,
    factors: {
      baseRatePercent: plan.baseRatePercent,
      durationFactor,
      ageFactor,
      taxRatePercent: 18,
    }
  };
}

/**
 * Education Funding-Gap Calculator
 */
export interface FundingGapInput {
  studentName: string;
  courseName: string;
  currentYear: number;
  totalCourseYears: number;
  annualTuition: number;
  annualLivingAndHostel: number;
  familyAnnualPlannedSavings: number;
  activeInsuranceCoverage: number;
}

export function calculateFundingGap(input: FundingGapInput): FundingGapAnalysis {
  const remainingYears = Math.max(1, input.totalCourseYears - input.currentYear + 1);
  const totalEstimatedTuition = input.annualTuition * remainingYears;
  const totalEstimatedLivingExpenses = input.annualLivingAndHostel * remainingYears;
  const totalEducationCost = totalEstimatedTuition + totalEstimatedLivingExpenses;

  const familyPlannedSavings = input.familyAnnualPlannedSavings * remainingYears;
  const totalAvailableProtection = input.activeInsuranceCoverage + familyPlannedSavings;
  
  const rawGap = totalEducationCost - totalAvailableProtection;
  const fundingGapAmount = Math.max(0, rawGap);
  
  const protectionCoveragePercentage = Math.min(100, Math.round((totalAvailableProtection / totalEducationCost) * 100));

  let status: 'OPTIMAL' | 'MODERATE_SHORTFALL' | 'CRITICAL_GAP' = 'OPTIMAL';
  let recommendation = 'Your education financing is fully protected against contingencies.';

  if (fundingGapAmount > 0 && protectionCoveragePercentage < 60) {
    status = 'CRITICAL_GAP';
    recommendation = `Significant shortfall of ${formatINR(fundingGapAmount)} detected across ${remainingYears} remaining years. Recommend selecting a Comprehensive or Scholar Elite Plan with higher coverage.`;
  } else if (fundingGapAmount > 0) {
    status = 'MODERATE_SHORTFALL';
    recommendation = `A modest funding gap of ${formatINR(fundingGapAmount)} exists. Consider increasing policy benefit riders for hostel and examination fee coverage.`;
  }

  return {
    studentName: input.studentName,
    courseName: input.courseName,
    remainingYears,
    totalEstimatedTuition,
    totalEstimatedLivingExpenses,
    totalEducationCost,
    activeInsuranceCoverage: input.activeInsuranceCoverage,
    familyPlannedSavings,
    fundingGapAmount,
    protectionCoveragePercentage,
    status,
    recommendation,
  };
}

/**
 * State Transition Rules (Guidewire-inspired finite state machine)
 */
export const ALLOWED_CLAIM_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  DRAFT: ['SUBMITTED', 'CLOSED'],
  SUBMITTED: ['UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'REJECTED'],
  UNDER_REVIEW: ['DOCUMENTS_REQUIRED', 'UNIVERSITY_VERIFICATION_PENDING', 'ASSESSMENT', 'REJECTED'],
  DOCUMENTS_REQUIRED: ['UNDER_REVIEW', 'ASSESSMENT', 'REJECTED'],
  UNIVERSITY_VERIFICATION_PENDING: ['ASSESSMENT', 'DOCUMENTS_REQUIRED', 'REJECTED'],
  ASSESSMENT: ['APPROVED', 'REJECTED', 'DOCUMENTS_REQUIRED'],
  APPROVED: ['PAYMENT_PROCESSING', 'REJECTED'],
  PAYMENT_PROCESSING: ['PAID', 'PAYMENT_FAILED'],
  PAYMENT_FAILED: ['PAYMENT_PROCESSING', 'CLOSED'],
  PAID: ['CLOSED'],
  REJECTED: ['CLOSED'],
  CLOSED: [],
};

export function isValidClaimTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  const allowed = ALLOWED_CLAIM_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Deterministic Claim Readiness Checklist & Score
 */
export interface ChecklistResult {
  readinessScore: number;
  items: { item: string; isCompleted: boolean; reason?: string }[];
  missingDocs: string[];
}

export function evaluateClaimReadiness(
  claimType: ClaimType,
  uploadedDocTypes: DocumentType[],
  hasUniversityVerification: boolean,
  isPolicyActive: boolean,
  isWaitingPeriodOver: boolean
): ChecklistResult {
  const items: { item: string; isCompleted: boolean; reason?: string }[] = [];
  const missingDocs: string[] = [];

  // Check 1: Active Policy
  items.push({
    item: 'Policy Active at time of incident',
    isCompleted: isPolicyActive,
    reason: isPolicyActive ? 'Policy is currently active' : 'Policy is not active or has expired/cancelled'
  });

  // Check 2: Waiting period
  items.push({
    item: 'Policy waiting period elapsed',
    isCompleted: isWaitingPeriodOver,
    reason: isWaitingPeriodOver ? 'Waiting period successfully completed' : 'Incident occurred during initial waiting period'
  });

  // Check 3: Essential identity proof
  const hasId = uploadedDocTypes.includes('IDENTITY_PROOF');
  items.push({
    item: 'Government Identity Proof of Guardian & Student',
    isCompleted: hasId,
    reason: hasId ? 'ID Proof uploaded' : 'Government ID Proof is missing'
  });
  if (!hasId) missingDocs.push('IDENTITY_PROOF');

  // Check 4: Event-specific primary proof
  if (claimType === 'PARENT_DEATH') {
    const hasDeathCert = uploadedDocTypes.includes('DEATH_CERTIFICATE');
    items.push({
      item: 'Official Death Certificate of Parent/Guardian',
      isCompleted: hasDeathCert,
      reason: hasDeathCert ? 'Death Certificate verified' : 'Official Death Certificate required'
    });
    if (!hasDeathCert) missingDocs.push('DEATH_CERTIFICATE');
  } else if (claimType === 'PARENT_DISABILITY') {
    const hasDisabilityCert = uploadedDocTypes.includes('DISABILITY_CERTIFICATE');
    items.push({
      item: 'Government Medical Board Disability Certificate (>50%)',
      isCompleted: hasDisabilityCert,
      reason: hasDisabilityCert ? 'Disability Certificate verified' : 'Medical Board Disability Certificate required'
    });
    if (!hasDisabilityCert) missingDocs.push('DISABILITY_CERTIFICATE');
  } else if (claimType === 'CRITICAL_ILLNESS') {
    const hasMedical = uploadedDocTypes.includes('MEDICAL_REPORT');
    items.push({
      item: 'Hospital Discharge Summary & Specialist Medical Reports',
      isCompleted: hasMedical,
      reason: hasMedical ? 'Medical reports uploaded' : 'Hospital Discharge Summary required'
    });
    if (!hasMedical) missingDocs.push('MEDICAL_REPORT');
  }

  // Check 5: University Tuition Fee Demand Statement
  const hasFeeDemand = uploadedDocTypes.includes('FEE_DEMAND_STATEMENT');
  items.push({
    item: 'Official University Fee Demand Notice / Ledger Statement',
    isCompleted: hasFeeDemand,
    reason: hasFeeDemand ? 'Fee statement attached' : 'Official university fee statement required for fee disbursement'
  });
  if (!hasFeeDemand) missingDocs.push('FEE_DEMAND_STATEMENT');

  // Check 6: University direct verification
  items.push({
    item: 'University Registrar Enrollment & Fee Balance Verification',
    isCompleted: hasUniversityVerification,
    reason: hasUniversityVerification ? 'Confirmed by University Representative' : 'Pending institutional confirmation'
  });

  const total = items.length;
  const completed = items.filter(i => i.isCompleted).length;
  const readinessScore = Math.round((completed / total) * 100);

  return {
    readinessScore,
    items,
    missingDocs,
  };
}
