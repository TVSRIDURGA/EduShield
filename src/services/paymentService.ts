import { ClaimsRepo, PoliciesRepo } from '../repositories/firestoreRepo';
import { ClaimPayment, EducationClaim, UserProfile } from '../models/insurance';
import { generatePaymentNumber, isValidClaimTransition } from '../utils/businessRules';
import { auditService } from './auditService';

export const paymentService = {
  async processUniversityPayout(
    claim: EducationClaim,
    authorizedOfficer: UserProfile,
    notes: string = 'Authorized university fee remittance'
  ): Promise<ClaimPayment> {
    // PRIORITY 1 & 2: Role Authorization Guard
    if (authorizedOfficer.role !== 'claims_officer' && authorizedOfficer.role !== 'admin') {
      throw new Error('Unauthorized Operation: Only authorized Claims Officers or Administrators may disburse university fee remittance.');
    }

    // PRIORITY 2.5: Separation of Duties Guard
    if (claim.guardianId === authorizedOfficer.id) {
      throw new Error('Separation of Duties Violation: You cannot authorize or disburse claim settlement for your own family policy.');
    }

    // PRIORITY 2.1: Finite State Machine Transition Validation
    if (claim.status !== 'APPROVED' && claim.status !== 'PAYMENT_PROCESSING') {
      throw new Error(`Invalid Payment State: Claim must be in APPROVED or PAYMENT_PROCESSING status to disburse fee escrow, currently [${claim.status}].`);
    }

    if (!isValidClaimTransition(claim.status, 'PAID')) {
      throw new Error(`Illegal state transition from ${claim.status} to PAID.`);
    }

    const paymentNumber = generatePaymentNumber();
    const now = new Date();
    const transactionRef = `SIM-UTR-NEFT-${now.getFullYear()}${Math.floor(10000000 + Math.random() * 90000000)}`;

    const payableAmount = claim.approvedAmount > 0 ? claim.approvedAmount : claim.requestedAmount;

    const payment: ClaimPayment = {
      id: 'pay_' + Date.now(),
      paymentNumber,
      claimId: claim.id,
      policyId: claim.policyId,
      universityId: claim.universityId,
      universityName: claim.universityName,
      requestedAmount: claim.requestedAmount,
      eligibleAmount: claim.eligibleAmount,
      approvedAmount: payableAmount,
      universityAllocatedAmount: payableAmount,
      paidAmount: payableAmount,
      remainingEligibleBalance: Math.max(0, claim.eligibleAmount - payableAmount),
      beneficiaryAccount: `${claim.universityName} Fee Escrow Account (IFSC: SBIN0001077)`,
      transactionReference: transactionRef,
      status: 'COMPLETED',
      isSimulated: true, // Clearly marked as academic simulation
      processedAt: now.toISOString(),
      createdAt: now.toISOString()
    };

    // Update claim status to PAID and attach payment object
    await ClaimsRepo.update(claim.id, {
      status: 'PAID',
      payment,
      updatedAt: now.toISOString()
    });

    // Record in audit log
    await auditService.log(
      'CLAIM_PAYMENT_DISBURSED',
      'PAYMENT',
      payment.id,
      { id: authorizedOfficer.id, name: authorizedOfficer.displayName, role: authorizedOfficer.role },
      `Simulated fee payment ${payment.paymentNumber} of ₹${payableAmount.toLocaleString('en-IN')} remitted to ${claim.universityName}. Ref: ${transactionRef}`
    );

    return payment;
  }
};
