import { ClaimsRepo, PoliciesRepo } from '../repositories/firestoreRepo';
import { ClaimPayment, EducationClaim, UserProfile } from '../models/insurance';
import { generatePaymentNumber } from '../utils/businessRules';
import { auditService } from './auditService';

export const paymentService = {
  async processUniversityPayout(
    claim: EducationClaim,
    authorizedOfficer: UserProfile,
    notes: string = 'Authorized university fee remittance'
  ): Promise<ClaimPayment> {
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
