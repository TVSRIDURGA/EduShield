import { ClaimsRepo, PoliciesRepo, NotificationsRepo } from '../repositories/firestoreRepo';
import { 
  EducationClaim, 
  ClaimDocument, 
  ClaimDecision, 
  ClaimStatus, 
  ClaimType, 
  DocumentType, 
  UserProfile, 
  UniversityVerification,
  UniversityVerificationStatus
} from '../models/insurance';
import { 
  generateClaimNumber, 
  isValidClaimTransition, 
  evaluateClaimReadiness 
} from '../utils/businessRules';
import { aiService } from './aiService';
import { auditService } from './auditService';

export interface SubmitClaimInput {
  policyId: string;
  claimType: ClaimType;
  incidentDate: string;
  description: string;
  requestedAmount: number;
  initialDocuments: {
    fileName: string;
    fileSize: number;
    documentType: DocumentType;
    fileUrl: string;
  }[];
}

export const claimService = {
  async submitClaim(input: SubmitClaimInput, claimant: UserProfile): Promise<EducationClaim> {
    if (claimant.role !== 'guardian' && claimant.role !== 'admin') {
      throw new Error('Unauthorized Operation: Only authenticated Parents/Guardians may submit new education claims.');
    }

    const policy = await PoliciesRepo.getById(input.policyId);
    if (!policy) throw new Error('Policy not found');
    if (policy.guardianId !== claimant.id && claimant.role !== 'admin') {
      throw new Error('Unauthorized to submit claim for this policy');
    }

    const claimNumber = generateClaimNumber();
    const now = new Date().toISOString();

    const claimId = 'clm_' + Date.now();
    const documents: ClaimDocument[] = input.initialDocuments.map((doc, idx) => ({
      id: `doc_${Date.now()}_${idx}`,
      claimId,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl,
      uploadedAt: now,
      verifiedByOfficer: false,
    }));

    // Initial university verification placeholder
    const univVerification: UniversityVerification = {
      id: `uv_${Date.now()}`,
      claimId,
      universityId: policy.universityId,
      universityName: policy.universityName,
      studentName: policy.studentName,
      studentRollNo: 'Pending Roll No',
      confirmedAnnualTuition: 0,
      confirmedOutstandingFee: 0,
      enrollmentStatusVerified: false,
      status: 'PENDING'
    };

    const initialClaim: EducationClaim = {
      id: claimId,
      claimNumber,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      guardianId: policy.guardianId,
      guardianName: policy.guardianName,
      studentId: policy.studentId,
      studentName: policy.studentName,
      universityId: policy.universityId,
      universityName: policy.universityName,
      claimType: input.claimType,
      incidentDate: input.incidentDate,
      description: input.description,
      requestedAmount: input.requestedAmount,
      eligibleAmount: Math.min(input.requestedAmount, policy.coverageAmount),
      approvedAmount: 0,
      status: 'SUBMITTED',
      documents,
      universityVerification: univVerification,
      reviews: [],
      readinessScore: 0,
      readinessChecklist: [],
      createdAt: now,
      updatedAt: now
    };

    // Run AI Readiness Analysis
    const aiAnalysis = await aiService.analyzeClaimDocuments(initialClaim, policy);
    initialClaim.readinessScore = aiAnalysis.claimReadinessScore;
    initialClaim.aiPreliminaryAssessment = {
      summary: aiAnalysis.summary,
      flaggedRisks: aiAnalysis.riskFlags,
      missingItems: aiAnalysis.missingMandatoryItems,
      suggestedNextSteps: [
        `University Registrar of ${policy.universityName} to verify enrollment & tuition dues`,
        'Claims adjuster to inspect submitted certificates'
      ],
      generatedAt: now
    };

    await ClaimsRepo.create(initialClaim);

    // Audit Log
    await auditService.log(
      'CLAIM_SUBMITTED',
      'CLAIM',
      initialClaim.id,
      { id: claimant.id, name: claimant.displayName, role: claimant.role },
      `Claim ${claimNumber} submitted for ${input.claimType} requesting ₹${input.requestedAmount.toLocaleString('en-IN')}`
    );

    // Notification for claims officer
    await NotificationsRepo.create({
      id: 'notif_' + Date.now(),
      userId: 'usr_officer_1',
      title: 'New Claim Awaiting Review',
      message: `Claim ${claimNumber} for ${policy.studentName} (${policy.universityName}) submitted. Readiness: ${initialClaim.readinessScore}%.`,
      type: 'INFO',
      read: false,
      linkUrl: `/claims/${initialClaim.id}/review`,
      createdAt: now
    });

    return initialClaim;
  },

  async addDocument(
    claimId: string, 
    document: { fileName: string; fileSize: number; documentType: DocumentType; fileUrl: string },
    user: UserProfile
  ): Promise<EducationClaim> {
    const claim = await ClaimsRepo.getById(claimId);
    if (!claim) throw new Error('Claim not found');

    const isAuthorized = claim.guardianId === user.id || claim.studentId === user.id || user.role === 'claims_officer' || user.role === 'admin';
    if (!isAuthorized) {
      throw new Error('Unauthorized Operation: You can only upload documents to your own authorized claim.');
    }

    const newDoc: ClaimDocument = {
      id: `doc_${Date.now()}`,
      claimId,
      documentType: document.documentType,
      fileName: document.fileName,
      fileSize: document.fileSize,
      fileUrl: document.fileUrl,
      uploadedAt: new Date().toISOString(),
      verifiedByOfficer: false,
    };

    const updatedDocs = [...claim.documents, newDoc];
    const policy = await PoliciesRepo.getById(claim.policyId);
    
    let readinessScore = claim.readinessScore;
    if (policy) {
      const analysis = await aiService.analyzeClaimDocuments({ ...claim, documents: updatedDocs }, policy);
      readinessScore = analysis.claimReadinessScore;
    }

    const updated = await ClaimsRepo.update(claimId, {
      documents: updatedDocs,
      readinessScore,
      updatedAt: new Date().toISOString()
    });

    await auditService.log(
      'DOCUMENT_UPLOADED',
      'CLAIM',
      claimId,
      { id: user.id, name: user.displayName, role: user.role },
      `Uploaded ${document.documentType} (${document.fileName})`
    );

    return updated!;
  },

  async verifyByUniversity(
    claimId: string,
    studentRollNo: string,
    confirmedAnnualTuition: number,
    confirmedOutstandingFee: number,
    officerRemarks: string,
    univUser: UserProfile,
    decisionStatus: UniversityVerificationStatus = 'VERIFIED_OUTSTANDING'
  ): Promise<EducationClaim> {
    const claim = await ClaimsRepo.getById(claimId);
    if (!claim) throw new Error('Claim not found');

    // Strict Cross-University Access Guard: Registrar can only verify claims of their assigned university
    if (univUser.role === 'university' && univUser.universityId && univUser.universityId !== claim.universityId) {
      throw new Error(`Institutional Security Violation: You are authorized only for [${univUser.universityId}], cannot access or verify records for [${claim.universityId}].`);
    }

    // Validation rule: Registrars cannot falsely mark fees as paid without verifying records & providing remarks
    if (decisionStatus === 'VERIFIED_PAID') {
      if (!studentRollNo || !studentRollNo.trim()) {
        throw new Error('Student roll number is required to confirm fee ledger payment records.');
      }
      if (!officerRemarks || officerRemarks.trim().length < 5) {
        throw new Error('Detailed ledger verification remarks are required to certify fee payment status.');
      }
    }

    const isVerified = decisionStatus === 'VERIFIED_PAID' || decisionStatus === 'VERIFIED_OUTSTANDING' || decisionStatus === 'VERIFIED';

    const updatedVerification: UniversityVerification = {
      id: claim.universityVerification?.id || `uv_${Date.now()}`,
      claimId,
      universityId: claim.universityId,
      universityName: claim.universityName,
      studentName: claim.studentName,
      studentRollNo: studentRollNo.trim(),
      confirmedAnnualTuition: Number(confirmedAnnualTuition) || 0,
      confirmedOutstandingFee: Number(confirmedOutstandingFee) || 0,
      enrollmentStatusVerified: isVerified,
      officerRemarks: officerRemarks.trim(),
      verifiedAt: new Date().toISOString(),
      verifiedBy: univUser.displayName,
      verifiedAmount: Number(confirmedOutstandingFee) || 0,
      status: decisionStatus
    };

    // Re-evaluate readiness
    const policy = await PoliciesRepo.getById(claim.policyId);
    let readinessScore = claim.readinessScore;
    if (policy) {
      const analysis = await aiService.analyzeClaimDocuments({
        ...claim,
        universityVerification: updatedVerification
      }, policy);
      readinessScore = analysis.claimReadinessScore;
    }

    // Workflow transition based on institutional verification:
    // - Verified states: advance claim to ASSESSMENT for Claims Officer review
    // - Discrepancy: keep claim blocked under review
    // - Requires info: advance to DOCUMENTS_REQUIRED
    let nextClaimStatus: ClaimStatus = claim.status;
    if (isVerified) {
      nextClaimStatus = 'ASSESSMENT';
    } else if (decisionStatus === 'DISCREPANCY' || decisionStatus === 'DISCREPANCY_FOUND') {
      nextClaimStatus = 'UNIVERSITY_VERIFICATION_PENDING';
    } else if (decisionStatus === 'REQUIRES_INFORMATION') {
      nextClaimStatus = 'DOCUMENTS_REQUIRED';
    }

    if (nextClaimStatus !== claim.status && !isValidClaimTransition(claim.status, nextClaimStatus)) {
      throw new Error(`Illegal state transition from ${claim.status} to ${nextClaimStatus}`);
    }

    const updated = await ClaimsRepo.update(claimId, {
      universityVerification: updatedVerification,
      readinessScore,
      status: nextClaimStatus,
      updatedAt: new Date().toISOString()
    });

    // Immutable audit log
    await auditService.log(
      'UNIVERSITY_VERIFICATION_COMPLETED',
      'CLAIM',
      claimId,
      { id: univUser.id, name: univUser.displayName, role: univUser.role },
      `Registrar (${univUser.displayName}) recorded decision [${decisionStatus}] for ${claim.studentName} (Roll: ${studentRollNo}) at ${claim.universityName}. Certified Fee: ₹${confirmedOutstandingFee.toLocaleString('en-IN')}. Remarks: ${officerRemarks}`
    );

    // Notify Claims Officer
    await NotificationsRepo.create({
      id: 'notif_' + Date.now(),
      userId: 'usr_officer_1',
      title: `University Fee Verification: ${decisionStatus}`,
      message: `${claim.universityName} Registrar recorded decision [${decisionStatus}] for Claim ${claim.claimNumber} (${claim.studentName}).`,
      type: isVerified ? 'SUCCESS' : 'WARNING',
      read: false,
      linkUrl: `/claims/${claimId}/review`,
      createdAt: new Date().toISOString()
    });

    // Notify Parent/Guardian
    await NotificationsRepo.create({
      id: 'notif_guard_' + Date.now(),
      userId: claim.guardianId,
      title: `University Verification: ${decisionStatus}`,
      message: `${claim.universityName} Registrar has verified your student's fee ledger with status [${decisionStatus}].`,
      type: isVerified ? 'SUCCESS' : 'INFO',
      read: false,
      linkUrl: `/claims/${claimId}`,
      createdAt: new Date().toISOString()
    });

    return updated!;
  },

  async adjudicateClaim(
    claimId: string,
    decision: ClaimDecision,
    findings: string,
    reasonCode: string,
    recommendedAmount: number,
    officer: UserProfile
  ): Promise<EducationClaim> {
    const claim = await ClaimsRepo.getById(claimId);
    if (!claim) throw new Error('Claim not found');

    // PRIORITY 2.5: Separation of Duties Violation check
    if (claim.guardianId === officer.id) {
      throw new Error('Separation of Duties Violation: You cannot adjudicate or approve your own family claim.');
    }

    // Rule: Claims Officer cannot approve a claim while university verification is pending, discrepancy, or incomplete
    if (decision === 'APPROVED') {
      const univStatus = claim.universityVerification?.status;
      const isUnivVerified = univStatus === 'VERIFIED_PAID' || univStatus === 'VERIFIED_OUTSTANDING' || univStatus === 'VERIFIED';
      if (!isUnivVerified) {
        throw new Error(
          `Adjudication Blocked: University fee verification is currently [${univStatus || 'PENDING'}]. Mandatory institutional registrar verification must be completed prior to claim approval.`
        );
      }
    }

    let nextStatus: ClaimStatus = claim.status;
    if (decision === 'APPROVED') {
      nextStatus = 'APPROVED';
    } else if (decision === 'REJECTED') {
      nextStatus = 'REJECTED';
    } else if (decision === 'MORE_INFO_REQUESTED') {
      nextStatus = 'DOCUMENTS_REQUIRED';
    }

    if (!isValidClaimTransition(claim.status, nextStatus)) {
      throw new Error(`Illegal state transition from ${claim.status} to ${nextStatus}`);
    }

    const review = {
      id: `rev_${Date.now()}`,
      claimId,
      officerId: officer.id,
      officerName: officer.displayName,
      decision,
      findings,
      reasonCode,
      recommendedAmount,
      reviewedAt: new Date().toISOString()
    };

    const updatedReviews = [...claim.reviews, review];
    const approvedAmount = decision === 'APPROVED' ? recommendedAmount : 0;

    const updated = await ClaimsRepo.update(claimId, {
      status: nextStatus,
      approvedAmount,
      reviews: updatedReviews,
      updatedAt: new Date().toISOString()
    });

    await auditService.log(
      `CLAIM_DECISION_${decision}`,
      'CLAIM',
      claimId,
      { id: officer.id, name: officer.displayName, role: officer.role },
      `Decision: ${decision}. Amount: ₹${approvedAmount.toLocaleString('en-IN')}. Notes: ${findings}`
    );

    // Notify guardian
    await NotificationsRepo.create({
      id: 'notif_' + Date.now(),
      userId: claim.guardianId,
      title: `Claim ${claim.claimNumber} Update: ${decision}`,
      message: `Your claim has been updated to ${nextStatus}. ${findings}`,
      type: decision === 'APPROVED' ? 'SUCCESS' : decision === 'REJECTED' ? 'ERROR' : 'WARNING',
      read: false,
      linkUrl: `/claims/${claimId}`,
      createdAt: new Date().toISOString()
    });

    return updated!;
  },

  async getById(id: string): Promise<EducationClaim | null> {
    return ClaimsRepo.getById(id);
  },

  async listByGuardian(guardianId: string): Promise<EducationClaim[]> {
    return ClaimsRepo.findBy('guardianId', guardianId);
  },

  async listByUniversity(universityId: string): Promise<EducationClaim[]> {
    return ClaimsRepo.findBy('universityId', universityId);
  },

  async getAll(): Promise<EducationClaim[]> {
    return ClaimsRepo.getAll();
  }
};
