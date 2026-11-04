import { PoliciesRepo, QuotesRepo, ProductsRepo, PolicyTransactionsRepo } from '../repositories/firestoreRepo';
import { EducationPolicy, Quote, UserProfile, TermsAcceptanceRecord, PolicyStateTransitionRecord } from '../models/insurance';
import { generatePolicyNumber } from '../utils/businessRules';
import { auditService } from './auditService';
import { policyEngine } from './policyEngine';

export const policyService = {
  async bindPolicyFromQuote(
    quote: Quote,
    guardian: UserProfile,
    paymentMethod: string = 'SIMULATED_NETBANKING',
    termsAcceptance?: TermsAcceptanceRecord
  ): Promise<EducationPolicy> {
    // PRIORITY 1.9: Payment initiation exclusive to authenticated Parent/Guardian
    if (guardian.role !== 'guardian' && guardian.role !== 'admin') {
      throw new Error('Unauthorized Operation: Premium payment initiation and policy binding are restricted exclusively to authenticated Parents/Guardians.');
    }

    if (quote.guardianId !== guardian.id && guardian.role !== 'admin') {
      throw new Error('Ownership Violation: You can only bind policies for your own authorized quotes.');
    }

    // Try finding matching enterprise insurance product
    const allProducts = await ProductsRepo.getAll();
    const matchedProduct = allProducts.find(
      p => p.id === quote.productId || p.id === quote.planId || p.code === quote.productCode
    );

    if (matchedProduct) {
      // Build terms acceptance record if not supplied (for backward compatibility)
      const validTerms: TermsAcceptanceRecord = termsAcceptance || {
        userId: guardian.id,
        userEmail: guardian.email,
        policyId: 'pending',
        policyVersion: matchedProduct.currentVersion,
        acceptedAt: new Date().toISOString(),
        declarationConfirmed: true
      };

      return policyEngine.issuePolicyFromQuote(quote, guardian, matchedProduct, validTerms, paymentMethod);
    }

    // Legacy fallback path preserving backward compatibility
    const policyNumber = generatePolicyNumber();
    const now = new Date();
    
    // Effective immediately
    const effectiveDate = now.toISOString();
    
    // Policy duration 1 year renewable
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + (quote.policyDurationYears || 1));
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

    const initialTransition: PolicyStateTransitionRecord = {
      id: `trans_${Date.now()}_init`,
      fromStatus: 'APPLICATION_SUBMITTED',
      toStatus: 'ACTIVE',
      actorId: guardian.id,
      actorName: guardian.displayName,
      actorRole: guardian.role || 'guardian',
      timestamp: effectiveDate,
      reason: `Policy ${policyNumber} activated via simulated payment (${simTransactionRef}) for ₹${quote.totalAnnualPremium.toLocaleString('en-IN')}`
    };

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
      selectedAddonBenefits: quote.selectedAddons || [],
      paymentReference: `${paymentMethod}:${simTransactionRef}`,
      stateHistory: [initialTransition],
      renewalHistory: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Update Quote status to ACCEPTED
    await QuotesRepo.update(quote.id, { status: 'ACCEPTED' });

    // Save Policy
    await PoliciesRepo.create(policy);

    // Record Transaction
    await PolicyTransactionsRepo.create({
      id: 'txn_' + Date.now(),
      transactionNumber: `PAY-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      type: 'INITIAL_PREMIUM',
      amount: policy.totalAnnualPremium,
      paymentMethod,
      status: 'COMPLETED',
      reference: simTransactionRef,
      timestamp: effectiveDate
    });

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

  async renewPolicy(
    policyId: string,
    actor: UserProfile,
    paymentMethod: string = 'SIMULATED_NETBANKING'
  ): Promise<EducationPolicy> {
    return policyEngine.processPolicyRenewal(policyId, actor, paymentMethod);
  },

  async cancelPolicy(
    policyId: string,
    reason: string,
    actor: UserProfile,
    hasClaimsMade: boolean = false
  ): Promise<EducationPolicy> {
    return policyEngine.requestPolicyCancellation(policyId, reason, actor, hasClaimsMade);
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
