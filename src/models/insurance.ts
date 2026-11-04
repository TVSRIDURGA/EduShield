/**
 * Guidewire PolicyCenter & ClaimCenter inspired Insurance Domain Models for EduShield
 */

export type UserRole = 'guardian' | 'student' | 'university' | 'claims_officer' | 'admin';

export type QuoteStatus = 'DRAFT' | 'GENERATED' | 'ACCEPTED' | 'EXPIRED';

export type ProductStatus = 
  | 'DRAFT' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'PUBLISHED' 
  | 'SUSPENDED' 
  | 'WITHDRAWN';

export type PolicyStatus = 
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'QUOTE_GENERATED'
  | 'APPLICATION_SUBMITTED'
  | 'UNDERWRITING'
  | 'PAYMENT_PENDING'
  | 'PENDING_PAYMENT' 
  | 'ISSUED'
  | 'ACTIVE' 
  | 'RENEWAL_DUE' 
  | 'RENEWED'
  | 'EXPIRED' 
  | 'CANCELLED' 
  | 'SUSPENDED'
  | 'LAPSED'
  | 'REJECTED';

export type ClaimStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'DOCUMENTS_REQUIRED' 
  | 'UNIVERSITY_VERIFICATION_PENDING' 
  | 'ASSESSMENT' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'PAYMENT_PROCESSING' 
  | 'PAID' 
  | 'PAYMENT_FAILED' 
  | 'CLOSED';

export type ClaimType = 
  | 'PARENT_DEATH' 
  | 'PARENT_DISABILITY' 
  | 'CRITICAL_ILLNESS' 
  | 'UNEXPECTED_FINANCIAL_HARDSHIP';

export type PaymentStatus = 
  | 'PENDING' 
  | 'INITIATED' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED';

export type DocumentType = 
  | 'DEATH_CERTIFICATE' 
  | 'DISABILITY_CERTIFICATE' 
  | 'MEDICAL_REPORT' 
  | 'FEE_DEMAND_STATEMENT' 
  | 'ENROLLMENT_LETTER' 
  | 'IDENTITY_PROOF' 
  | 'BANK_STATEMENT' 
  | 'OTHER';

export type ClaimDecision = 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'MORE_INFO_REQUESTED' 
  | 'ESCALATED';

export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | null;
  accountStatus?: AccountStatus;
  phoneNumber?: string;
  universityId?: string; // For university representatives
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  guardianId: string;
  guardianName: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  universityId: string;
  universityName: string;
  courseName: string;
  degreeType: 'UNDERGRADUATE' | 'POSTGRADUATE' | 'DIPLOMA';
  currentAcademicYear: number;
  totalCourseDurationYears: number;
  studentIdNumber: string;
  annualTuitionFee: number;
  otherEligibleExpenses: number; // hostel, labs, examination
  // Optional administrative / verification fields
  department?: string;
  enrollmentStatus?: 'ENROLLED' | 'DEFERRED' | 'WITHDRAWN' | 'GRADUATED';
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface University {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  accreditationGrade: string;
  contactEmail: string;
  contactPhone: string;
  bankDetails: {
    accountName: string;
    accountNumberMasked: string;
    ifscCode: string;
    bankName: string;
  };
  verifiedStatus: boolean;
}

export interface InsurancePlan {
  id: string;
  code: string;
  name: string;
  tier: 'BASIC' | 'COMPREHENSIVE' | 'PREMIUM';
  description: string;
  baseRatePercent: number; // e.g., 2.5% of total cover
  maxCoverageLimit: number;
  waitingPeriodDays: number;
  coveredEvents: ClaimType[];
  includedBenefits: string[];
  exclusions: string[];
  isActive: boolean;
}

export interface PolicyBenefit {
  benefitCode: string;
  name: string;
  description: string;
  coverageLimit: number;
  deductible: number;
}

// ========================================================
// Comprehensive Enterprise Insurance Policy Architecture
// ========================================================

export type CoverageCategory = 
  | 'PARENT_DEATH' 
  | 'PARENT_DISABILITY' 
  | 'CRITICAL_ILLNESS' 
  | 'TUITION_PROTECTION' 
  | 'EMERGENCY_MEDICAL' 
  | 'EMERGENCY_TRAVEL' 
  | 'HOSTEL_LIVING' 
  | 'CAREER_CONTINUITY' 
  | 'OTHER';

export type RuleRequirementLevel = 'MANDATORY' | 'OPTIONAL' | 'CONDITIONAL';

export type PaymentFrequency = 'ANNUAL' | 'SEMESTER' | 'QUARTERLY';

export type RefundCalculationMethod = 
  | 'PRO_RATA' 
  | 'SHORT_PERIOD' 
  | 'TIERED' 
  | 'NO_REFUND_AFTER_CLAIM';

export interface EligibilityCriteria {
  minAge: number;
  maxAge: number;
  allowedAdmissionStatuses: string[];
  requireActiveEnrollment: boolean;
  allowedDegreeTypes: ('UNDERGRADUATE' | 'POSTGRADUATE' | 'DIPLOMA')[];
  allowedCourseDurationsYears: number[];
  allowedAcademicYears: number[];
  eligibleInstitutionIds: string[]; // empty or contains 'ALL' = all verified institutions
  allowedResidencies: string[];
  allowedStates: string[];
  requireStudentIdProof: boolean;
  requireParentIdProof: boolean;
  requireRelationshipProof: boolean;
  requireAdmissionLetter: boolean;
  requireEnrollmentCertificate: boolean;
  requireUniversityVerification: boolean;
  ruleRequirementLevel: Record<string, RuleRequirementLevel>;
}

export interface CoverageBenefitConfig {
  id: string;
  category: CoverageCategory;
  name: string;
  description: string;
  benefitAmount: number;
  maxBenefitAmount: number;
  perEventLimit: number;
  annualLimit: number;
  aggregateLimit: number;
  waitingPeriodDays: number;
  requiredClaimDocuments: DocumentType[];
  geographicRestrictions: string[];
  benefitRecipient: 'UNIVERSITY_DIRECT' | 'STUDENT' | 'GUARDIAN';
  isOptionalAddon: boolean;
  addonPremium: number;
}

export interface PolicyExclusionConfig {
  id: string;
  title: string;
  detailedExplanation: string;
  applicableCategory: CoverageCategory | 'ALL';
  applicableConditions: string;
  exceptions?: string;
  effectivePeriod?: string;
}

export interface FinancialLimitsConfig {
  sumInsured: number;
  maxCoverageLimit: number;
  perEventLimit: number;
  annualClaimLimit: number;
  aggregateClaimLimit: number;
  deductibleAmount: number;
  coPaymentPercent: number;
  maxPayableBenefit: number;
  minClaimAmount: number;
  sublimits: { benefitCategory: string; limitAmount: number; description?: string }[];
}

export interface AgeFactorBand {
  minAge: number;
  maxAge: number;
  factor: number;
  description?: string;
}

export interface DurationFactorBand {
  durationYears: number;
  factor: number;
  discountPercent: number;
}

export interface PremiumCalculationConfig {
  basePremium: number;
  baseRatePercent: number;
  ageBands: AgeFactorBand[];
  durationFactors: DurationFactorBand[];
  taxRatePercent: number; // e.g. 18 for GST
  minPremium: number;
  maxPremium: number;
  availableFrequencies: PaymentFrequency[];
  frequencyMultipliers: Record<PaymentFrequency, number>;
  discounts: { code: string; name: string; discountPercent: number; description: string }[];
}

export interface PolicyIssuanceRequirements {
  requireAuthentication: boolean;
  requireEligibilityVerification: boolean;
  requireInstitutionEligibility: boolean;
  requireIdentityVerification: boolean;
  requireEnrollmentProof: boolean;
  requireMandatoryDeclarations: boolean;
  requireTermsAcceptance: boolean;
  requirePremiumPayment: boolean;
  requireUnderwritingApproval: boolean;
}

export interface RenewalConditionsConfig {
  isRenewable: boolean;
  renewalWindowDays: number; // e.g. 30 days before expiry
  gracePeriodDays: number; // e.g. 15 days after expiry
  reinstatementAllowed: boolean;
  reinstatementPeriodDays: number;
  requiresReVerification: boolean;
  renewalDiscountPercent: number;
  noticeBeforeExpiryDays: number;
}

export interface CancellationConditionsConfig {
  allowPolicyholderCancellation: boolean;
  freeLookPeriodDays: number; // e.g. 15 days
  noticePeriodDays: number; // e.g. 15 days
  refundMethod: RefundCalculationMethod;
  minRetainedPremiumPercent: number;
  noRefundIfClaimsMade: boolean;
  cancellationReasons: string[];
}

export interface PolicyTermsAndConditions {
  version: string;
  effectiveDate: string;
  policyholderResponsibilities: string[];
  insuredStudentResponsibilities: string[];
  disclosureObligations: string;
  waitingPeriodClauses: string;
  claimNotificationPeriodDays: number;
  claimSubmissionTimelineDays: number;
  benefitLimitations: string[];
  disputeResolutionProcess: string;
  grievanceContact: {
    name: string;
    designation: string;
    email: string;
    phone: string;
    address: string;
  };
  applicableJurisdiction: string;
}

export interface InsuranceProduct {
  id: string;
  code: string;
  name: string;
  tier: 'BASIC' | 'COMPREHENSIVE' | 'PREMIUM';
  category: 'FOUNDATION' | 'COMPREHENSIVE' | 'SCHOLAR_ELITE' | 'SPECIALIZED';
  shortDescription: string;
  detailedDescription: string;
  policyPurpose: string;
  targetCustomerSegment: string;
  eligibleStudentCategories: string[];
  applicableInstitutions: string[]; // University IDs or ['ALL']
  applicableAcademicProgrammes: string[];
  applicableAdmissionCategories: string[];
  policyDurationYearsOptions: number[];
  currentVersion: string;
  status: ProductStatus;
  effectiveDate: string;
  expiryDate: string;
  
  eligibilityCriteria: EligibilityCriteria;
  coverageBenefits: CoverageBenefitConfig[];
  exclusions: PolicyExclusionConfig[];
  financialLimits: FinancialLimitsConfig;
  premiumConfig: PremiumCalculationConfig;
  issuanceRequirements: PolicyIssuanceRequirements;
  renewalConditions: RenewalConditionsConfig;
  cancellationConditions: CancellationConditionsConfig;
  termsAndConditions: PolicyTermsAndConditions;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PolicyVersion {
  id: string;
  productId: string;
  productCode: string;
  versionNumber: string;
  status: ProductStatus;
  effectiveDate: string;
  expiryDate?: string;
  changeNotes: string;
  productSnapshot: InsuranceProduct;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface TermsAcceptanceRecord {
  userId: string;
  userEmail: string;
  policyId: string;
  policyVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  declarationConfirmed: boolean;
}

export interface CancellationRecord {
  id: string;
  policyId: string;
  requestedByUserId: string;
  requestedByUserRole: string;
  requestedAt: string;
  effectiveDate: string;
  cancellationReason: string;
  refundMethod: RefundCalculationMethod;
  eligibleRefundAmount: number;
  refundStatus: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface RenewalRecord {
  id: string;
  policyId: string;
  renewalNumber: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  renewalPremium: number;
  paidAt: string;
  paymentReference: string;
  status: 'COMPLETED' | 'PENDING' | 'LAPSED';
}

export interface PolicyStateTransitionRecord {
  id: string;
  fromStatus: PolicyStatus;
  toStatus: PolicyStatus;
  actorId: string;
  actorName: string;
  actorRole: UserRole | string;
  timestamp: string;
  reason: string;
}

export interface PolicyTransaction {
  id: string;
  transactionNumber: string;
  policyId: string;
  policyNumber: string;
  type: 'INITIAL_PREMIUM' | 'RENEWAL_PREMIUM' | 'CANCELLATION_REFUND' | 'CLAIM_DISBURSEMENT';
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  reference: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EligibilityValidationResult {
  isEligible: boolean;
  reasons: string[];
  checks: {
    criterion: string;
    passed: boolean;
    reason: string;
    level: RuleRequirementLevel;
  }[];
}

export interface Quote {
  id: string;
  quoteNumber: string;
  guardianId: string;
  guardianName: string;
  guardianEmail: string;
  studentId: string;
  studentName: string;
  universityId: string;
  universityName: string;
  courseName: string;
  planId: string;
  planName: string;
  productId?: string;
  productCode?: string;
  policyVersion?: string;
  coverageAmount: number;
  policyDurationYears: number;
  annualTuitionFee: number;
  otherEligibleExpenses: number;
  
  // Premium breakdown
  basePremium: number;
  riskFactorAdjustment: number;
  taxAmount: number; // GST 18% in India
  totalAnnualPremium: number;
  
  // Selected add-on costs
  selectedAddons?: CoverageBenefitConfig[];
  addonPremiumTotal?: number;
  frequency?: PaymentFrequency;
  frequencyPayableAmount?: number;
  
  status: QuoteStatus;
  waitingPeriodDays: number;
  exclusions: string[];
  benefits: PolicyBenefit[];
  plainLanguageSummary: string;
  calculatedAt: string;
  expiresAt: string;
}

export interface EducationPolicy {
  id: string;
  policyNumber: string;
  quoteId: string;
  guardianId: string;
  guardianName: string;
  guardianEmail: string;
  studentId: string;
  studentName: string;
  universityId: string;
  universityName: string;
  planId: string;
  planName: string;
  
  // Enterprise Product & Version snapshot
  productId?: string;
  productCode?: string;
  policyVersion?: string;
  versionSnapshot?: InsuranceProduct;
  
  coverageAmount: number;
  totalAnnualPremium: number;
  effectiveDate: string;
  expiryDate: string;
  renewalDueDate: string;
  waitingPeriodDays: number;
  waitingPeriodEndsAt: string;
  status: PolicyStatus;
  
  benefits: PolicyBenefit[];
  exclusions: string[];
  selectedAddonBenefits?: CoverageBenefitConfig[];
  financialLimitsSnapshot?: FinancialLimitsConfig;
  paymentReference?: string;
  paymentFrequency?: PaymentFrequency;
  
  // Contractual Terms & Acceptance
  termsAcceptance?: TermsAcceptanceRecord;
  termsWordingSnapshot?: PolicyTermsAndConditions;
  
  // Lifecycle Management Records
  cancellationRecord?: CancellationRecord;
  renewalHistory?: RenewalRecord[];
  stateHistory?: PolicyStateTransitionRecord[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: string;
  verifiedByOfficer: boolean;
  aiVerificationNotes?: string;
}

export type UniversityVerificationStatus = 
  | 'PENDING' 
  | 'VERIFIED' 
  | 'VERIFIED_PAID' 
  | 'VERIFIED_OUTSTANDING' 
  | 'DISCREPANCY' 
  | 'DISCREPANCY_FOUND' 
  | 'REQUIRES_INFORMATION';

export interface UniversityVerification {
  id: string;
  claimId: string;
  universityId: string;
  universityName: string;
  studentName: string;
  studentRollNo: string;
  confirmedAnnualTuition: number;
  confirmedOutstandingFee: number;
  enrollmentStatusVerified: boolean;
  officerRemarks?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedAmount?: number;
  status: UniversityVerificationStatus;
}

export interface ClaimReview {
  id: string;
  claimId: string;
  officerId: string;
  officerName: string;
  decision: ClaimDecision;
  findings: string;
  reasonCode: string;
  recommendedAmount: number;
  reviewedAt: string;
}

export interface ClaimPayment {
  id: string;
  paymentNumber: string;
  claimId: string;
  policyId: string;
  universityId: string;
  universityName: string;
  requestedAmount: number;
  eligibleAmount: number;
  approvedAmount: number;
  universityAllocatedAmount: number;
  paidAmount: number;
  remainingEligibleBalance: number;
  beneficiaryAccount: string;
  transactionReference: string;
  status: PaymentStatus;
  isSimulated: boolean;
  processedAt?: string;
  createdAt: string;
}

export interface EducationClaim {
  id: string;
  claimNumber: string;
  policyId: string;
  policyNumber: string;
  guardianId: string;
  guardianName: string;
  studentId: string;
  studentName: string;
  universityId: string;
  universityName: string;
  
  claimType: ClaimType;
  incidentDate: string;
  description: string;
  requestedAmount: number;
  eligibleAmount: number;
  approvedAmount: number;
  
  status: ClaimStatus;
  documents: ClaimDocument[];
  universityVerification?: UniversityVerification;
  reviews: ClaimReview[];
  payment?: ClaimPayment;
  
  // AI Readiness Score (0-100)
  readinessScore: number;
  readinessChecklist: {
    item: string;
    isCompleted: boolean;
    reason?: string;
  }[];
  aiPreliminaryAssessment?: {
    summary: string;
    flaggedRisks: string[];
    missingItems: string[];
    suggestedNextSteps: string[];
    generatedAt: string;
  };

  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'QUOTE' | 'POLICY' | 'CLAIM' | 'PAYMENT' | 'USER' | 'UNIVERSITY' | 'PRODUCT' | 'POLICY_VERSION' | 'TRANSACTION';
  entityId: string;
  performedByUserId: string;
  performedByUserName: string;
  performedByUserRole: UserRole | string;
  details: string;
  timestamp: string;
  previousValue?: any;
  newValue?: any;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface FundingGapAnalysis {
  studentName: string;
  courseName: string;
  remainingYears: number;
  totalEstimatedTuition: number;
  totalEstimatedLivingExpenses: number;
  totalEducationCost: number;
  activeInsuranceCoverage: number;
  familyPlannedSavings: number;
  fundingGapAmount: number;
  protectionCoveragePercentage: number;
  status: 'OPTIMAL' | 'MODERATE_SHORTFALL' | 'CRITICAL_GAP';
  recommendation: string;
}

export interface AIInteractionLog {
  id: string;
  userId: string;
  query: string;
  response: string;
  groundedPolicyId?: string;
  modelUsed: string;
  timestamp: string;
}
