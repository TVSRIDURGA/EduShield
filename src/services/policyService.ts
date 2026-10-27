import { PoliciesRepo, QuotesRepo } from '../repositories/firestoreRepo';
import { EducationPolicy, Quote, UserProfile } from '../models/insurance';
import { generatePolicyNumber } from '../utils/businessRules';
import { auditService } from './auditService';

export const policyService = {
  async bindPolicyFromQuote(
    quote: Quote,
    guardian: UserProfile,
    paymentMethod: string = 'SIMULATED_NETBANKING'
  ): Promise<EducationPolicy> {
    const policyNumber = generatePolicyNumber();
    const now = new Date();
    
    // Effective immediately
    const effectiveDate = now.toISOString();
    
    // Policy duration 1 year renewable
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);
    const expiryDate = expiry.toISOString();

    // Renewal due 30 days before expiry
    const renewalDue = new Date(expiry);
    renewalDue.setDate(renewalDue.getDate() - 30);
    const renewalDueDate = renewalDue.toISOString();

    // Waiting period calculation
    const waitingPeriodEnds = new Date(now);
    waitingPeriodEnds.setDate(waitingPeriodEnds.getDate() + (quote.waitingPeriodDays || 0));
    const waitingPeriodEndsAt = waitingPeriodEnds.toISOString();

    const simTransactionRef = `SIM-TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const policy: EducationPolicy = {
      id: 'pol_' + Date.now(),
      policyNumber,
      quoteId: quote.id,
      guardianId: guardian.id,
      guardianName: guardian.displayName,
      guardianEmail: guardian.email,
      studentId: quote.studentId,
      studentName: quote.studentName,
      universityId: quote.universityId,
      universityName: quote.universityName,
      planId: quote.planId,
      planName: quote.planName,
      coverageAmount: quote.coverageAmount,
      totalAnnualPremium: quote.totalAnnualPremium,
      effectiveDate,
      expiryDate,
      renewalDueDate,
      waitingPeriodDays: quote.waitingPeriodDays,
      waitingPeriodEndsAt,
      status: 'ACTIVE',
      benefits: quote.benefits,
      exclusions: quote.exclusions,
      paymentReference: `${paymentMethod}:${simTransactionRef}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Update Quote status to ACCEPTED
    await QuotesRepo.update(quote.id, { status: 'ACCEPTED' });

    // Save Policy
    await PoliciesRepo.create(policy);

    // Audit log
    await auditService.log(
      'POLICY_ACTIVATED',
      'POLICY',
      policy.id,
      { id: guardian.id, name: guardian.displayName, role: guardian.role },
      `Policy ${policy.policyNumber} activated via simulated payment (${simTransactionRef}) for ₹${policy.totalAnnualPremium.toLocaleString('en-IN')}`
    );

    return policy;
  },

  async getById(id: string): Promise<EducationPolicy | null> {
    return PoliciesRepo.getById(id);
  },

  async listByGuardian(guardianId: string): Promise<EducationPolicy[]> {
    return PoliciesRepo.findBy('guardianId', guardianId);
  },

  async getAll(): Promise<EducationPolicy[]> {
    return PoliciesRepo.getAll();
  }
};
