/**
 * Guidewire PolicyCenter & ClaimCenter inspired Insurance Domain Models for EduShield
 */

export type UserRole = 'guardian' | 'student' | 'university' | 'claims_officer' | 'admin';

export type QuoteStatus = 'DRAFT' | 'GENERATED' | 'ACCEPTED' | 'EXPIRED';

export type PolicyStatus = 
  | 'PENDING_PAYMENT' 
  | 'ACTIVE' 
  | 'RENEWAL_DUE' 
  | 'EXPIRED' 
  | 'CANCELLED' 
  | 'SUSPENDED';

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

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  universityId?: string; // For university representatives
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
  coverageAmount: number;
  policyDurationYears: number;
  annualTuitionFee: number;
  otherEligibleExpenses: number;
  
  // Premium breakdown
  basePremium: number;
  riskFactorAdjustment: number;
  taxAmount: number; // GST 18% in India
  totalAnnualPremium: number;
  
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
  paymentReference?: string;
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
  status: 'PENDING' | 'VERIFIED' | 'DISCREPANCY_FOUND';
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
  entityType: 'QUOTE' | 'POLICY' | 'CLAIM' | 'PAYMENT' | 'USER' | 'UNIVERSITY';
  entityId: string;
  performedByUserId: string;
  performedByUserName: string;
  performedByUserRole: UserRole;
  details: string;
  timestamp: string;
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
