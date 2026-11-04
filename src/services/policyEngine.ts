import { 
  InsuranceProduct, 
  PolicyVersion, 
  Student, 
  UserProfile, 
  EducationPolicy, 
  Quote, 
  EligibilityValidationResult, 
  PaymentFrequency,
  ProductStatus,
  PolicyStatus,
  CoverageBenefitConfig,
  TermsAcceptanceRecord,
  CancellationRecord,
  RenewalRecord,
  PolicyStateTransitionRecord,
  PolicyTransaction
} from '../models/insurance';
import { 
  ProductsRepo, 
  PolicyVersionsRepo, 
  PoliciesRepo, 
  QuotesRepo, 
  PolicyTransactionsRepo 
} from '../repositories/firestoreRepo';
import { generatePolicyNumber } from '../utils/businessRules';
import { auditService } from './auditService';

/**
 * Valid Enterprise Product Lifecycle Transitions
 * DRAFT -> UNDER_REVIEW, WITHDRAWN
 * UNDER_REVIEW -> APPROVED, DRAFT, REJECTED
 * APPROVED -> PUBLISHED, UNDER_REVIEW
 * PUBLISHED -> SUSPENDED, WITHDRAWN, UNDER_REVIEW
 * SUSPENDED -> PUBLISHED, WITHDRAWN
 * WITHDRAWN -> []
 */
export const ALLOWED_PRODUCT_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  DRAFT: ['UNDER_REVIEW', 'WITHDRAWN'],
  UNDER_REVIEW: ['APPROVED', 'DRAFT', 'WITHDRAWN'],
  APPROVED: ['PUBLISHED', 'UNDER_REVIEW', 'WITHDRAWN'],
  PUBLISHED: ['SUSPENDED', 'WITHDRAWN', 'UNDER_REVIEW'],
  SUSPENDED: ['PUBLISHED', 'WITHDRAWN'],
  WITHDRAWN: []
};

/**
 * Valid Enterprise Policy Contract Lifecycle Transitions
 */
export const ALLOWED_POLICY_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
  DRAFT: ['APPLICATION_SUBMITTED', 'CANCELLED'],
  APPLICATION_SUBMITTED: ['UNDERWRITING', 'PAYMENT_PENDING', 'REJECTED', 'CANCELLED'],
  UNDERWRITING: ['PAYMENT_PENDING', 'REJECTED', 'CANCELLED'],
  PAYMENT_PENDING: ['ISSUED', 'ACTIVE', 'CANCELLED', 'REJECTED'],
  PENDING_PAYMENT: ['ISSUED', 'ACTIVE', 'CANCELLED'],
  QUOTE_GENERATED: ['APPLICATION_SUBMITTED', 'EXPIRED', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PUBLISHED', 'PAYMENT_PENDING', 'CANCELLED'],
  PUBLISHED: ['ACTIVE', 'SUSPENDED'],
  ISSUED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['RENEWAL_DUE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'],
  RENEWAL_DUE: ['RENEWED', 'ACTIVE', 'LAPSED', 'EXPIRED', 'CANCELLED'],
  RENEWED: ['ACTIVE', 'RENEWAL_DUE', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
  LAPSED: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
  EXPIRED: [],
  CANCELLED: [],
  REJECTED: []
};

export interface EnterprisePremiumCalculationInput {
  annualTuitionFee: number;
  otherEligibleExpenses: number;
  policyDurationYears: number;
  product: InsuranceProduct;
  studentAge: number;
  selectedAddonIds?: string[];
  frequency?: PaymentFrequency;
  discountCode?: string;
}

export interface EnterprisePremiumCalculationResult {
  coverageAmount: number;
  annualCoverageComponent: number;
  basePremium: number;
  baseRateComponent: number;
  ageAdjustment: number;
  durationDiscountAmount: number;
  selectedAddons: CoverageBenefitConfig[];
  addonPremiumTotal: number;
  subtotal: number;
  discountAmount: number;
  discountApplied?: { code: string; name: string; discountPercent: number };
  taxableAmount: number;
  taxAmount: number; // GST 18%
  totalAnnualPremium: number;
  frequency: PaymentFrequency;
  frequencyInstallmentAmount: number;
  factors: {
    baseRatePercent: number;
    ageFactor: number;
    durationFactor: number;
    taxRatePercent: number;
    frequencyMultiplier: number;
  };
}

export const policyEngine = {
  canTransitionPolicyStatus(from: PolicyStatus, to: PolicyStatus): boolean {
    return ALLOWED_POLICY_TRANSITIONS[from]?.includes(to) ?? false;
  },

  canTransitionProductStatus(from: ProductStatus, to: ProductStatus): boolean {
    return ALLOWED_PRODUCT_TRANSITIONS[from]?.includes(to) ?? false;
  },

  // ========================================================
  // MODULE 2: CENTRALIZED ELIGIBILITY VALIDATION ENGINE
  // ========================================================
  validateStudentEligibility(
    student: Student,
    product: InsuranceProduct,
    _guardian?: UserProfile
  ): EligibilityValidationResult {
    const checks: EligibilityValidationResult['checks'] = [];
    const reasons: string[] = [];

    const birthDate = new Date(student.dateOfBirth);
    const now = new Date();
    let studentAge = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      studentAge--;
    }

    const criteria = product.eligibilityCriteria;

    // 1. Student Age Validation
    const agePassed = studentAge >= criteria.minAge && studentAge <= criteria.maxAge;
    checks.push({
      criterion: `Student Age (${criteria.minAge} to ${criteria.maxAge} years)`,
      passed: agePassed,
      reason: agePassed 
        ? `Student age (${studentAge}) satisfies policy eligibility bracket [${criteria.minAge} - ${criteria.maxAge}].` 
        : `Policy unavailable: Student age (${studentAge}) does not meet the required eligibility bracket [${criteria.minAge} - ${criteria.maxAge} years].`,
      level: criteria.ruleRequirementLevel['minAge'] || 'MANDATORY'
    });
    if (!agePassed) {
      reasons.push(`Student age (${studentAge}) is outside the required eligibility range of ${criteria.minAge} to ${criteria.maxAge} years.`);
    }

    // 2. Degree Type Validation
    const degreePassed = criteria.allowedDegreeTypes.includes(student.degreeType);
    checks.push({
      criterion: `Degree Type (${criteria.allowedDegreeTypes.join(', ')})`,
      passed: degreePassed,
      reason: degreePassed 
        ? `Enrolled degree type (${student.degreeType}) is covered under this product.` 
        : `Policy unavailable: The student's degree type (${student.degreeType}) is not eligible for this product. Eligible types: ${criteria.allowedDegreeTypes.join(', ')}.`,
      level: criteria.ruleRequirementLevel['degreeType'] || 'MANDATORY'
    });
    if (!degreePassed) {
      reasons.push(`Degree type "${student.degreeType}" is not covered under this policy template.`);
    }

    // 3. Course Duration Validation
    const durationPassed = criteria.allowedCourseDurationsYears.includes(student.totalCourseDurationYears);
    checks.push({
      criterion: `Course Duration (${criteria.allowedCourseDurationsYears.join(', ')} years)`,
      passed: durationPassed,
      reason: durationPassed
        ? `Course duration (${student.totalCourseDurationYears} years) is supported.`
        : `Policy unavailable: Course duration of ${student.totalCourseDurationYears} years is not supported. Eligible durations: ${criteria.allowedCourseDurationsYears.join(', ')} years.`,
      level: 'MANDATORY'
    });
    if (!durationPassed) {
      reasons.push(`Course duration (${student.totalCourseDurationYears} years) is outside permitted duration limits (${criteria.allowedCourseDurationsYears.join(', ')} years).`);
    }

    // 4. Academic Year Validation
    const yearPassed = criteria.allowedAcademicYears.includes(student.currentAcademicYear);
    checks.push({
      criterion: `Current Academic Year (${criteria.allowedAcademicYears.join(', ')})`,
      passed: yearPassed,
      reason: yearPassed
        ? `Current academic year (Year ${student.currentAcademicYear}) is eligible.`
        : `Policy unavailable: Current academic year (${student.currentAcademicYear}) is outside eligible years [${criteria.allowedAcademicYears.join(', ')}].`,
      level: 'MANDATORY'
    });
    if (!yearPassed) {
      reasons.push(`Current academic year ${student.currentAcademicYear} is not eligible for initial policy binding.`);
    }

    // 5. Institution Eligibility
    const hasAllInstitutions = product.applicableInstitutions.includes('ALL') || 
                               (criteria.eligibleInstitutionIds.length === 0);
    const institutionPassed = hasAllInstitutions || 
                              product.applicableInstitutions.includes(student.universityId) ||
                              criteria.eligibleInstitutionIds.includes(student.universityId);
    checks.push({
      criterion: 'Accredited Partner Institution Eligibility',
      passed: institutionPassed,
      reason: institutionPassed
        ? `Enrolled institution (${student.universityName}) is an approved partner university.`
        : `Policy unavailable: The selected institution (${student.universityName}) is not included in this policy's eligible institution list.`,
      level: criteria.ruleRequirementLevel['institutionEligibility'] || 'MANDATORY'
    });
    if (!institutionPassed) {
      reasons.push(`The selected institution (${student.universityName}) is not included in this policy's eligible institution list.`);
    }

    // 6. Active Enrollment Requirement
    const enrollmentPassed = !!student.studentIdNumber && student.studentIdNumber.trim().length > 0;
    checks.push({
      criterion: 'Verified University Enrollment & Student ID Number',
      passed: enrollmentPassed,
      reason: enrollmentPassed
        ? `Active enrollment verified with Student ID: ${student.studentIdNumber}.`
        : 'Policy unavailable: Missing verified university enrollment or student identification number.',
      level: 'MANDATORY'
    });
    if (!enrollmentPassed) {
      reasons.push('Student identification number is missing or not verified with the university registrar.');
    }

    const isEligible = checks.every(c => c.level !== 'MANDATORY' || c.passed);

    return {
      isEligible,
      reasons,
      checks
    };
  },

  // ========================================================
  // MODULE 5: CENTRALIZED ENTERPRISE PREMIUM CALCULATION ENGINE
  // ========================================================
  calculateEnterprisePremium(
    input: EnterprisePremiumCalculationInput
  ): EnterprisePremiumCalculationResult {
    const { 
      annualTuitionFee, 
      otherEligibleExpenses, 
      policyDurationYears, 
      product, 
      studentAge, 
      selectedAddonIds = [],
      frequency = 'ANNUAL',
      discountCode 
    } = input;

    const limits = product.financialLimits;
    const premiumCfg = product.premiumConfig;

    // 1. Total coverage calculation
    const annualTotalExpense = annualTuitionFee + otherEligibleExpenses;
    const rawCoverage = annualTotalExpense * policyDurationYears;
    const coverageAmount = Math.min(rawCoverage, limits.maxCoverageLimit);
    const annualCoverageComponent = Math.round(coverageAmount / policyDurationYears);

    // 2. Base rate calculation (percentage of annual coverage)
    const baseRate = premiumCfg.baseRatePercent / 100;
    const baseRateComponent = Math.round(annualCoverageComponent * baseRate);
    const baseFee = premiumCfg.basePremium;
    const unadjustedAnnual = baseRateComponent + baseFee;

    // 3. Age factor band matching
    let ageFactor = 1.0;
    const matchedAgeBand = premiumCfg.ageBands.find(
      b => studentAge >= b.minAge && studentAge <= b.maxAge
    );
    if (matchedAgeBand) {
      ageFactor = matchedAgeBand.factor;
    } else if (studentAge < (premiumCfg.ageBands[0]?.minAge || 16)) {
      ageFactor = 0.95;
    } else {
      ageFactor = 1.15;
    }

    // 4. Duration factor band matching
    let durationFactor = 1.0;
    const matchedDuration = premiumCfg.durationFactors.find(
      d => d.durationYears === policyDurationYears
    );
    if (matchedDuration) {
      durationFactor = matchedDuration.factor;
    } else if (policyDurationYears >= 4) {
      durationFactor = 0.90;
    }

    // 5. Adjusted base premium
    const adjustedAnnual = Math.round(unadjustedAnnual * ageFactor * durationFactor);
    const ageAdjustment = Math.round(unadjustedAnnual * (ageFactor - 1.0));
    const durationDiscountAmount = Math.max(0, Math.round(unadjustedAnnual * (1.0 - durationFactor)));

    // 6. Selected optional add-on benefits
    const selectedAddons: CoverageBenefitConfig[] = [];
    let addonPremiumTotal = 0;

    if (selectedAddonIds.length > 0 && product.coverageBenefits) {
      for (const cov of product.coverageBenefits) {
        if (cov.isOptionalAddon && selectedAddonIds.includes(cov.id)) {
          selectedAddons.push(cov);
          addonPremiumTotal += cov.addonPremium;
        }
      }
    }

    // 7. Subtotal before discounts
    const subtotal = adjustedAnnual + addonPremiumTotal;

    // 8. Discounts
    let discountAmount = 0;
    let discountApplied: { code: string; name: string; discountPercent: number } | undefined;

    if (discountCode && premiumCfg.discounts) {
      const match = premiumCfg.discounts.find(
        d => d.code.toUpperCase() === discountCode.trim().toUpperCase()
      );
      if (match) {
        discountAmount = Math.round(subtotal * (match.discountPercent / 100));
        discountApplied = match;
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);

    // 9. Statutory Tax (GST 18%)
    const taxRate = premiumCfg.taxRatePercent / 100;
    const taxAmount = Math.round(taxableAmount * taxRate);

    // 10. Total Annual Premium enforced within min/max bounds
    let rawTotalAnnual = taxableAmount + taxAmount;
    if (premiumCfg.minPremium && rawTotalAnnual < premiumCfg.minPremium) {
      rawTotalAnnual = premiumCfg.minPremium;
    }
    if (premiumCfg.maxPremium && rawTotalAnnual > premiumCfg.maxPremium) {
      rawTotalAnnual = premiumCfg.maxPremium;
    }
    const totalAnnualPremium = Math.round(rawTotalAnnual);

    // 11. Payment Frequency Installment
    const multiplier = premiumCfg.frequencyMultipliers[frequency] || 1.0;
    const frequencyInstallmentAmount = Math.round(totalAnnualPremium * multiplier);

    return {
      coverageAmount,
      annualCoverageComponent,
      basePremium: baseFee,
      baseRateComponent,
      ageAdjustment,
      durationDiscountAmount,
      selectedAddons,
      addonPremiumTotal,
      subtotal,
      discountAmount,
      discountApplied,
      taxableAmount,
      taxAmount,
      totalAnnualPremium,
      frequency,
      frequencyInstallmentAmount,
      factors: {
        baseRatePercent: premiumCfg.baseRatePercent,
        ageFactor,
        durationFactor,
        taxRatePercent: premiumCfg.taxRatePercent,
        frequencyMultiplier: multiplier
      }
    };
  },

  // ========================================================
  // MODULE 6: FINANCIAL LIMITS & DEDUCTIBLES ENFORCEMENT
  // ========================================================
  validateClaimAgainstPolicyLimits(
    claimAmount: number,
    policy: EducationPolicy,
    benefitCategory: string,
    previouslyPaidSum: number = 0
  ): {
    isAllowed: boolean;
    eligibleAmount: number;
    deductibleApplied: number;
    coPayApplied: number;
    payableAmount: number;
    reason: string;
  } {
    const limits = policy.financialLimitsSnapshot || {
      sumInsured: policy.coverageAmount,
      maxCoverageLimit: policy.coverageAmount,
      perEventLimit: policy.coverageAmount,
      annualClaimLimit: policy.coverageAmount,
      aggregateClaimLimit: policy.coverageAmount,
      deductibleAmount: 0,
      coPaymentPercent: 0,
      maxPayableBenefit: policy.coverageAmount,
      minClaimAmount: 1000,
      sublimits: []
    };

    // Minimum claim check
    if (claimAmount < limits.minClaimAmount) {
      return {
        isAllowed: false,
        eligibleAmount: 0,
        deductibleApplied: 0,
        coPayApplied: 0,
        payableAmount: 0,
        reason: `Claim amount (₹${claimAmount.toLocaleString('en-IN')}) is below the policy minimum claim threshold of ₹${limits.minClaimAmount.toLocaleString('en-IN')}.`
      };
    }

    // Remaining aggregate cover
    const remainingAggregate = Math.max(0, limits.aggregateClaimLimit - previouslyPaidSum);
    if (remainingAggregate <= 0) {
      return {
        isAllowed: false,
        eligibleAmount: 0,
        deductibleApplied: 0,
        coPayApplied: 0,
        payableAmount: 0,
        reason: `Aggregate policy benefit of ₹${limits.aggregateClaimLimit.toLocaleString('en-IN')} has been fully exhausted by previous claim settlements.`
      };
    }

    // Sublimit check if configured
    let categoryLimit = limits.perEventLimit;
    const sublimit = limits.sublimits?.find(s => s.benefitCategory === benefitCategory);
    if (sublimit && sublimit.limitAmount > 0) {
      categoryLimit = Math.min(categoryLimit, sublimit.limitAmount);
    }

    // Eligible amount capped by per-event limit, sublimit, and available balance
    let eligibleAmount = Math.min(claimAmount, categoryLimit, remainingAggregate, limits.maxCoverageLimit);

    // Apply deductible
    const deductibleApplied = Math.min(eligibleAmount, limits.deductibleAmount || 0);
    let afterDeductible = Math.max(0, eligibleAmount - deductibleApplied);

    // Apply co-payment percentage
    const coPayPercent = limits.coPaymentPercent || 0;
    const coPayApplied = Math.round(afterDeductible * (coPayPercent / 100));
    let payableAmount = Math.max(0, afterDeductible - coPayApplied);

    // Final cap by maxPayableBenefit
    payableAmount = Math.min(payableAmount, limits.maxPayableBenefit);

    return {
      isAllowed: true,
      eligibleAmount,
      deductibleApplied,
      coPayApplied,
      payableAmount,
      reason: `Claim evaluated successfully. Eligible: ₹${eligibleAmount.toLocaleString('en-IN')}, Deductible: ₹${deductibleApplied.toLocaleString('en-IN')}, Co-Pay: ₹${coPayApplied.toLocaleString('en-IN')}, Final Payable: ₹${payableAmount.toLocaleString('en-IN')}.`
    };
  },

  // ========================================================
  // MODULE 7: POLICY ISSUANCE SERVICE
  // ========================================================
  async issuePolicyFromQuote(
    quote: Quote,
    guardian: UserProfile,
    product: InsuranceProduct,
    termsAcceptance: TermsAcceptanceRecord,
    paymentMethod: string = 'SIMULATED_NETBANKING'
  ): Promise<EducationPolicy> {
    // 1. Authentication & Role verification
    if (guardian.role !== 'guardian' && guardian.role !== 'admin') {
      throw new Error('Unauthorized Operation: Premium payment initiation and policy binding are restricted exclusively to authenticated Parents/Guardians.');
    }
    if (quote.guardianId !== guardian.id && guardian.role !== 'admin') {
      throw new Error('Ownership Violation: You can only bind policies for your own authorized quotes.');
    }

    // 2. Terms acceptance check
    if (!termsAcceptance || !termsAcceptance.declarationConfirmed) {
      throw new Error('Issuance Pre-Condition Failed: Mandatory Terms & Conditions and statutory declarations must be formally acknowledged before policy issuance.');
    }
    if (termsAcceptance.policyVersion !== product.currentVersion) {
      throw new Error(`Version Mismatch: Accepted terms version (${termsAcceptance.policyVersion}) does not match current published version (${product.currentVersion}).`);
    }

    // 3. Date calculations
    const now = new Date();
    const effectiveDate = now.toISOString();

    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + (quote.policyDurationYears || 1));
    const expiryDate = expiry.toISOString();

    const renewalDue = new Date(expiry);
    renewalDue.setDate(renewalDue.getDate() - (product.renewalConditions?.renewalWindowDays || 30));
    const renewalDueDate = renewalDue.toISOString();

    const waitingPeriodDays = product.coverageBenefits?.[0]?.waitingPeriodDays ?? quote.waitingPeriodDays ?? 15;
    const waitingPeriodEnds = new Date(now);
    waitingPeriodEnds.setDate(waitingPeriodEnds.getDate() + waitingPeriodDays);
    const waitingPeriodEndsAt = waitingPeriodEnds.toISOString();

    const policyNumber = generatePolicyNumber();
    const simTxnRef = `TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Initial state transition record
    const stateTransition: PolicyStateTransitionRecord = {
      id: `trans_${Date.now()}_init`,
      fromStatus: 'APPLICATION_SUBMITTED',
      toStatus: 'ACTIVE',
      actorId: guardian.id,
      actorName: guardian.displayName,
      actorRole: guardian.role || 'guardian',
      timestamp: effectiveDate,
      reason: `Policy issued and bound following verified payment simulation (${simTxnRef}) of ₹${quote.totalAnnualPremium.toLocaleString('en-IN')}.`
    };

    // 5. Construct issued policy snapshot
    const issuedPolicy: EducationPolicy = {
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

      // Enterprise version-controlled snapshot
      productId: product.id,
      productCode: product.code,
      policyVersion: product.currentVersion,
      versionSnapshot: JSON.parse(JSON.stringify(product)), // Immutable contractual snapshot
      
      coverageAmount: quote.coverageAmount,
      totalAnnualPremium: quote.totalAnnualPremium,
      effectiveDate,
      expiryDate,
      renewalDueDate,
      waitingPeriodDays,
      waitingPeriodEndsAt,
      status: 'ACTIVE',

      benefits: quote.benefits,
      exclusions: quote.exclusions,
      selectedAddonBenefits: quote.selectedAddons || [],
      financialLimitsSnapshot: JSON.parse(JSON.stringify(product.financialLimits)),
      paymentReference: `${paymentMethod}:${simTxnRef}`,
      paymentFrequency: quote.frequency || 'ANNUAL',

      termsAcceptance: {
        ...termsAcceptance,
        policyId: 'pol_' + Date.now()
      },
      termsWordingSnapshot: JSON.parse(JSON.stringify(product.termsAndConditions)),

      renewalHistory: [],
      stateHistory: [stateTransition],

      createdAt: effectiveDate,
      updatedAt: effectiveDate
    };

    // Save policy
    await PoliciesRepo.create(issuedPolicy);

    // Update quote status
    await QuotesRepo.update(quote.id, { status: 'ACCEPTED' });

    // Record initial premium transaction
    const initialTxn: PolicyTransaction = {
      id: 'txn_' + Date.now(),
      transactionNumber: `PAY-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      policyId: issuedPolicy.id,
      policyNumber: issuedPolicy.policyNumber,
      type: 'INITIAL_PREMIUM',
      amount: issuedPolicy.totalAnnualPremium,
      paymentMethod,
      status: 'COMPLETED',
      reference: simTxnRef,
      timestamp: effectiveDate,
      metadata: {
        quoteId: quote.id,
        policyVersion: product.currentVersion,
        frequency: quote.frequency || 'ANNUAL'
      }
    };
    await PolicyTransactionsRepo.create(initialTxn);

    // Write immutable audit log
    await auditService.log(
      'POLICY_ISSUED',
      'POLICY',
      issuedPolicy.id,
      { id: guardian.id, name: guardian.displayName, role: guardian.role },
      `Policy ${issuedPolicy.policyNumber} (Version ${issuedPolicy.policyVersion}) issued for ₹${issuedPolicy.totalAnnualPremium.toLocaleString('en-IN')}`
    );

    return issuedPolicy;
  },

  // ========================================================
  // MODULE 8: RENEWAL ENGINE
  // ========================================================
  evaluateRenewalEligibility(
    policy: EducationPolicy
  ): {
    isEligible: boolean;
    reason: string;
    renewalDueDate: string;
    expiryDate: string;
    isGracePeriod: boolean;
  } {
    if (policy.status !== 'ACTIVE' && policy.status !== 'RENEWAL_DUE') {
      return {
        isEligible: false,
        reason: `Policy status is ${policy.status}. Only ACTIVE or RENEWAL_DUE policies can be renewed.`,
        renewalDueDate: policy.renewalDueDate,
        expiryDate: policy.expiryDate,
        isGracePeriod: false
      };
    }

    const now = new Date();
    const expiry = new Date(policy.expiryDate);
    const renewalDue = new Date(policy.renewalDueDate);
    const graceEnd = new Date(expiry);
    graceEnd.setDate(graceEnd.getDate() + 15); // 15-day grace period

    if (now < renewalDue) {
      return {
        isEligible: true,
        reason: `Upcoming renewal window opens on ${renewalDue.toLocaleDateString('en-IN')}. Early renewal available.`,
        renewalDueDate: policy.renewalDueDate,
        expiryDate: policy.expiryDate,
        isGracePeriod: false
      };
    }

    if (now <= expiry) {
      return {
        isEligible: true,
        reason: 'Policy is currently within its primary renewal window before expiration.',
        renewalDueDate: policy.renewalDueDate,
        expiryDate: policy.expiryDate,
        isGracePeriod: false
      };
    }

    if (now <= graceEnd) {
      return {
        isEligible: true,
        reason: 'Policy has expired but is currently within the 15-day statutory grace period. Coverage can be reinstated without lapse penalties.',
        renewalDueDate: policy.renewalDueDate,
        expiryDate: policy.expiryDate,
        isGracePeriod: true
      };
    }

    return {
      isEligible: false,
      reason: 'Grace period has expired. Policy is lapsed and requires formal administrator reinstatement.',
      renewalDueDate: policy.renewalDueDate,
      expiryDate: policy.expiryDate,
      isGracePeriod: false
    };
  },

  calculateRenewalPremium(
    policy: EducationPolicy,
    product?: InsuranceProduct
  ): {
    basePremium: number;
    discountPercent: number;
    discountAmount: number;
    taxAmount: number;
    finalRenewalPayable: number;
  } {
    const renewalDiscountPercent = product?.renewalConditions?.renewalDiscountPercent ?? 5;
    const base = policy.totalAnnualPremium;
    const beforeTaxDiscount = Math.round((base / 1.18) * (renewalDiscountPercent / 100));
    const discountedBase = Math.round((base / 1.18) - beforeTaxDiscount);
    const tax = Math.round(discountedBase * 0.18);
    const finalRenewalPayable = discountedBase + tax;

    return {
      basePremium: base,
      discountPercent: renewalDiscountPercent,
      discountAmount: beforeTaxDiscount,
      taxAmount: tax,
      finalRenewalPayable
    };
  },

  async processPolicyRenewal(
    policyId: string,
    actor: UserProfile,
    paymentMethod: string = 'SIMULATED_NETBANKING'
  ): Promise<EducationPolicy> {
    const policy = await PoliciesRepo.getById(policyId);
    if (!policy) throw new Error('Policy not found');

    const eligibility = this.evaluateRenewalEligibility(policy);
    if (!eligibility.isEligible && actor.role !== 'admin') {
      throw new Error(`Renewal Ineligible: ${eligibility.reason}`);
    }

    const renewalCalc = this.calculateRenewalPremium(policy);
    const now = new Date();
    const currentExpiry = new Date(policy.expiryDate);
    
    // Extend expiry by 1 year from previous expiry date
    const newExpiry = new Date(currentExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    const newRenewalDue = new Date(newExpiry);
    newRenewalDue.setDate(newRenewalDue.getDate() - 30);

    const renewalRef = `REN-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const renewalRecord: RenewalRecord = {
      id: 'ren_' + Date.now(),
      policyId: policy.id,
      renewalNumber: renewalRef,
      previousExpiryDate: policy.expiryDate,
      newExpiryDate: newExpiry.toISOString(),
      renewalPremium: renewalCalc.finalRenewalPayable,
      paidAt: now.toISOString(),
      paymentReference: `${paymentMethod}:${renewalRef}`,
      status: 'COMPLETED'
    };

    const stateTransition: PolicyStateTransitionRecord = {
      id: `trans_${Date.now()}_ren`,
      fromStatus: policy.status,
      toStatus: 'RENEWED',
      actorId: actor.id,
      actorName: actor.displayName,
      actorRole: actor.role || 'guardian',
      timestamp: now.toISOString(),
      reason: `Policy renewed for 1 academic year through ${newExpiry.toLocaleDateString('en-IN')} with ₹${renewalCalc.finalRenewalPayable.toLocaleString('en-IN')} premium.`
    };

    const updated = await PoliciesRepo.update(policy.id, {
      expiryDate: newExpiry.toISOString(),
      renewalDueDate: newRenewalDue.toISOString(),
      status: 'ACTIVE',
      updatedAt: now.toISOString(),
      renewalHistory: [...(policy.renewalHistory || []), renewalRecord],
      stateHistory: [...(policy.stateHistory || []), stateTransition]
    });

    // Record Transaction
    await PolicyTransactionsRepo.create({
      id: 'txn_' + Date.now(),
      transactionNumber: `PAY-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      type: 'RENEWAL_PREMIUM',
      amount: renewalCalc.finalRenewalPayable,
      paymentMethod,
      status: 'COMPLETED',
      reference: renewalRef,
      timestamp: now.toISOString()
    });

    await auditService.log(
      'POLICY_RENEWED',
      'POLICY',
      policy.id,
      { id: actor.id, name: actor.displayName, role: actor.role },
      `Policy ${policy.policyNumber} renewed until ${newExpiry.toLocaleDateString('en-IN')}`
    );

    return updated as EducationPolicy;
  },

  // ========================================================
  // MODULE 9: CANCELLATION & REFUND ENGINE
  // ========================================================
  calculateCancellationRefund(
    policy: EducationPolicy,
    hasClaimsMade: boolean = false
  ): {
    eligibleRefund: number;
    retainedPremium: number;
    methodApplied: string;
    explanation: string;
    isFreeLook: boolean;
  } {
    if (hasClaimsMade) {
      return {
        eligibleRefund: 0,
        retainedPremium: policy.totalAnnualPremium,
        methodApplied: 'NO_REFUND_AFTER_CLAIM',
        explanation: '0% refund: Claims have previously been filed or paid under this policy term.',
        isFreeLook: false
      };
    }

    const inception = new Date(policy.effectiveDate);
    const now = new Date();
    const daysElapsed = Math.max(0, Math.floor((now.getTime() - inception.getTime()) / (1000 * 60 * 60 * 24)));

    // Free look period (first 15 days)
    if (daysElapsed <= 15) {
      const stampDuty = 100; // statutory non-refundable stamp duty
      const refund = Math.max(0, policy.totalAnnualPremium - stampDuty);
      return {
        eligibleRefund: refund,
        retainedPremium: stampDuty,
        methodApplied: 'FREE_LOOK',
        explanation: `Statutory 15-day Free-Look Period: 100% refund of premium less ₹100 nominal stamp duty. Elapsed: ${daysElapsed} days.`,
        isFreeLook: true
      };
    }

    // Short-period retention scale
    let retainedPercent = 0.20; // default 20%
    if (daysElapsed <= 30) {
      retainedPercent = 0.20; // 80% refund
    } else if (daysElapsed <= 90) {
      retainedPercent = 0.40; // 60% refund
    } else if (daysElapsed <= 180) {
      retainedPercent = 0.60; // 40% refund
    } else {
      retainedPercent = 1.00; // 0% refund after 6 months
    }

    const retainedPremium = Math.round(policy.totalAnnualPremium * retainedPercent);
    const eligibleRefund = Math.max(0, policy.totalAnnualPremium - retainedPremium);

    return {
      eligibleRefund,
      retainedPremium,
      methodApplied: 'SHORT_PERIOD_SCALE',
      explanation: `Short-period retention scale applied (${daysElapsed} days elapsed since inception): ${retainedPercent * 100}% retained (₹${retainedPremium.toLocaleString('en-IN')}), ${((1 - retainedPercent) * 100).toFixed(0)}% refunded (₹${eligibleRefund.toLocaleString('en-IN')}).`,
      isFreeLook: false
    };
  },

  async requestPolicyCancellation(
    policyId: string,
    reason: string,
    actor: UserProfile,
    hasClaimsMade: boolean = false
  ): Promise<EducationPolicy> {
    const policy = await PoliciesRepo.getById(policyId);
    if (!policy) throw new Error('Policy not found');

    if (policy.status === 'CANCELLED' || policy.status === 'EXPIRED') {
      throw new Error(`Policy is already in ${policy.status} state.`);
    }

    const refundCalc = this.calculateCancellationRefund(policy, hasClaimsMade);
    const now = new Date();

    const cancellationRecord: CancellationRecord = {
      id: 'can_' + Date.now(),
      policyId: policy.id,
      requestedByUserId: actor.id,
      requestedByUserRole: actor.role || 'guardian',
      requestedAt: now.toISOString(),
      effectiveDate: now.toISOString(),
      cancellationReason: reason,
      refundMethod: refundCalc.isFreeLook ? 'PRO_RATA' : 'SHORT_PERIOD',
      eligibleRefundAmount: refundCalc.eligibleRefund,
      refundStatus: refundCalc.eligibleRefund > 0 ? 'APPROVED' : 'PROCESSED',
      approvedBy: actor.role === 'admin' ? actor.displayName : 'Automated Rules Engine',
      approvedAt: now.toISOString(),
      notes: refundCalc.explanation
    };

    const stateTransition: PolicyStateTransitionRecord = {
      id: `trans_${Date.now()}_can`,
      fromStatus: policy.status,
      toStatus: 'CANCELLED',
      actorId: actor.id,
      actorName: actor.displayName,
      actorRole: actor.role || 'guardian',
      timestamp: now.toISOString(),
      reason: `Policy cancelled: ${reason}. Refund calculation: ₹${refundCalc.eligibleRefund.toLocaleString('en-IN')}.`
    };

    const updated = await PoliciesRepo.update(policy.id, {
      status: 'CANCELLED',
      cancellationRecord,
      updatedAt: now.toISOString(),
      stateHistory: [...(policy.stateHistory || []), stateTransition]
    });

    // Record Refund Transaction if applicable
    if (refundCalc.eligibleRefund > 0) {
      await PolicyTransactionsRepo.create({
        id: 'txn_' + Date.now(),
        transactionNumber: `REF-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        type: 'CANCELLATION_REFUND',
        amount: refundCalc.eligibleRefund,
        paymentMethod: 'ORIGINAL_SOURCE_REVERSAL',
        status: 'COMPLETED',
        reference: `REFUND-${policy.policyNumber}`,
        timestamp: now.toISOString(),
        metadata: {
          reason,
          retainedPremium: refundCalc.retainedPremium,
          method: refundCalc.methodApplied
        }
      });
    }

    await auditService.log(
      'POLICY_CANCELLED',
      'POLICY',
      policy.id,
      { id: actor.id, name: actor.displayName, role: actor.role },
      `Policy ${policy.policyNumber} cancelled with ₹${refundCalc.eligibleRefund.toLocaleString('en-IN')} refund`
    );

    return updated as EducationPolicy;
  },

  // ========================================================
  // MODULE 1 & 8: POLICY PRODUCT TEMPLATE & VERSION MANAGEMENT
  // ========================================================
  async createProductTemplate(
    data: Omit<InsuranceProduct, 'id' | 'createdAt' | 'updatedAt'>,
    admin: UserProfile
  ): Promise<InsuranceProduct> {
    if (admin.role !== 'admin') {
      throw new Error('Unauthorized Operation: Only Administrators can configure insurance products.');
    }

    // Validation checks
    if (!data.name || !data.code || !data.category) {
      throw new Error('Product Validation Failed: Name, unique policy code, and category are mandatory.');
    }
    if (!data.coverageBenefits || data.coverageBenefits.length === 0) {
      throw new Error('Product Validation Failed: At least one covered risk and benefit schedule must be configured.');
    }
    if (!data.financialLimits || data.financialLimits.maxCoverageLimit <= 0) {
      throw new Error('Product Validation Failed: Valid positive maximum coverage financial limits must be specified.');
    }
    if (!data.eligibilityCriteria || data.eligibilityCriteria.minAge <= 0) {
      throw new Error('Product Validation Failed: Explicit eligibility criteria must be defined.');
    }

    const now = new Date().toISOString();
    const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const product: InsuranceProduct = {
      ...data,
      id,
      createdBy: admin.id,
      createdAt: now,
      updatedAt: now
    };

    await ProductsRepo.create(product);

    const versionNum = product.currentVersion || '1.0.0';
    // Create Initial Version
    const initialVersion: PolicyVersion = {
      id: `ver_${product.id}_${versionNum.replace(/\./g, '_')}`,
      productId: product.id,
      productCode: product.code,
      versionNumber: versionNum,
      status: product.status || 'DRAFT',
      effectiveDate: product.effectiveDate,
      expiryDate: product.expiryDate,
      changeNotes: `Initial creation of ${product.name} (Code: ${product.code})`,
      productSnapshot: JSON.parse(JSON.stringify(product)),
      approvedBy: admin.id,
      approvedAt: product.status === 'PUBLISHED' ? now : undefined,
      createdAt: now
    };

    await PolicyVersionsRepo.create(initialVersion);

    await auditService.log(
      'PRODUCT_CREATED',
      'PRODUCT',
      product.id,
      { id: admin.id, name: admin.displayName, role: 'admin' },
      `Administrator configured new insurance product template: ${product.name} [${product.code}] v${product.currentVersion}`
    );

    return product;
  },

  async updateProductTemplate(
    productId: string,
    updates: Partial<InsuranceProduct>,
    admin: UserProfile,
    changeNotes?: string
  ): Promise<InsuranceProduct> {
    if (admin.role !== 'admin') {
      throw new Error('Unauthorized Operation: Only Administrators can modify insurance products.');
    }

    const existing = await ProductsRepo.getById(productId);
    if (!existing) throw new Error('Product template not found');

    const now = new Date().toISOString();
    const updatedProduct = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: now
    };

    await ProductsRepo.update(productId, updatedProduct);

    // If version changed, create a new immutable policy version record
    if (updates.currentVersion && updates.currentVersion !== existing.currentVersion) {
      const newVersion: PolicyVersion = {
        id: `ver_${existing.id}_${updates.currentVersion.replace(/\./g, '_')}`,
        productId: existing.id,
        productCode: existing.code,
        versionNumber: updates.currentVersion,
        status: updatedProduct.status,
        effectiveDate: updatedProduct.effectiveDate,
        expiryDate: updatedProduct.expiryDate,
        changeNotes: changeNotes || `Version upgrade to ${updates.currentVersion}`,
        productSnapshot: JSON.parse(JSON.stringify(updatedProduct)),
        approvedBy: admin.id,
        approvedAt: now,
        createdAt: now
      };
      await PolicyVersionsRepo.create(newVersion);
    }

    await auditService.log(
      'PRODUCT_UPDATED',
      'PRODUCT',
      existing.id,
      { id: admin.id, name: admin.displayName, role: 'admin' },
      `Administrator updated insurance product: ${existing.name} [${existing.code}]`
    );

    return updatedProduct;
  },

  async transitionProductStatus(
    productId: string,
    newStatus: ProductStatus,
    admin: UserProfile,
    reason: string
  ): Promise<InsuranceProduct> {
    if (admin.role !== 'admin') {
      throw new Error('Unauthorized: Product lifecycle status changes require Administrator privileges.');
    }

    const product = await ProductsRepo.getById(productId);
    if (!product) throw new Error('Product not found');

    const allowed = ALLOWED_PRODUCT_TRANSITIONS[product.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid Product State Transition: Cannot transition from ${product.status} to ${newStatus}. Allowed transitions: ${allowed?.join(', ') || 'None (Terminal state)'}.`);
    }

    // Validation before publishing
    if (newStatus === 'PUBLISHED') {
      if (!product.coverageBenefits || product.coverageBenefits.length === 0) {
        throw new Error('Cannot publish product: At least one coverage benefit must be configured.');
      }
      if (!product.exclusions || product.exclusions.length === 0) {
        throw new Error('Cannot publish product: Mandatory policy exclusions must be defined.');
      }
      if (!product.termsAndConditions || !product.termsAndConditions.policyholderResponsibilities?.length) {
        throw new Error('Cannot publish product: Complete contractual terms and conditions are mandatory.');
      }
    }

    const now = new Date().toISOString();
    const updated = await ProductsRepo.update(productId, {
      status: newStatus,
      publishedAt: newStatus === 'PUBLISHED' ? now : product.publishedAt,
      updatedAt: now
    });

    await auditService.log(
      'PRODUCT_STATUS_CHANGED',
      'PRODUCT',
      productId,
      { id: admin.id, name: admin.displayName, role: 'admin' },
      `Product ${product.code} status transitioned from [${product.status}] to [${newStatus}]. Reason: ${reason}`
    );

    return updated as InsuranceProduct;
  },

  async duplicateProduct(
    sourceProductId: string,
    admin: UserProfile
  ): Promise<InsuranceProduct> {
    if (admin.role !== 'admin') {
      throw new Error('Unauthorized: Only Administrators can duplicate product templates.');
    }

    const source = await ProductsRepo.getById(sourceProductId);
    if (!source) throw new Error('Source product not found');

    const duplicateCode = `${source.code}-COPY-${Math.floor(100 + Math.random() * 900)}`;
    const duplicateData: Omit<InsuranceProduct, 'id' | 'createdAt' | 'updatedAt'> = {
      ...source,
      code: duplicateCode,
      name: `${source.name} (Copy)`,
      status: 'DRAFT',
      currentVersion: '1.0.0-draft',
      publishedAt: undefined
    };

    return this.createProductTemplate(duplicateData, admin);
  }
};
