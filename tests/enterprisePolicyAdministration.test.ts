import { describe, it, expect, beforeEach, vi } from 'vitest';
import { policyEngine } from '../src/services/policyEngine';
import { policyService } from '../src/services/policyService';
import { 
  InsuranceProduct, 
  UserProfile, 
  Quote, 
  EducationPolicy,
  TermsAcceptanceRecord,
  Student
} from '../src/models/insurance';
import { 
  SEED_ENTERPRISE_PRODUCTS, 
  SEED_ENTERPRISE_VERSIONS 
} from '../src/utils/enterpriseSeedData';

// In-Memory Repository Mocks for Fast, Deterministic Unit Testing
const store: Record<string, Record<string, any>> = {
  products: {},
  versions: {},
  policies: {},
  quotes: {},
  transactions: {},
  claims: {},
  audits: {}
};

function createMockRepo(collection: string) {
  return {
    getById: vi.fn(async (id: string) => store[collection][id] ? JSON.parse(JSON.stringify(store[collection][id])) : null),
    create: vi.fn(async (item: any) => {
      store[collection][item.id] = JSON.parse(JSON.stringify(item));
      return store[collection][item.id];
    }),
    update: vi.fn(async (id: string, updates: any) => {
      if (!store[collection][id]) return null;
      store[collection][id] = { ...store[collection][id], ...JSON.parse(JSON.stringify(updates)) };
      return store[collection][id];
    }),
    getAll: vi.fn(async () => Object.values(store[collection]).map(v => JSON.parse(JSON.stringify(v)))),
    findBy: vi.fn(async (field: string, value: any) => {
      return Object.values(store[collection])
        .filter((item: any) => item[field] === value)
        .map(v => JSON.parse(JSON.stringify(v)));
    })
  };
}

vi.mock('../src/repositories/firestoreRepo', () => {
  return {
    ProductsRepo: createMockRepo('products'),
    PolicyVersionsRepo: createMockRepo('versions'),
    PoliciesRepo: createMockRepo('policies'),
    QuotesRepo: createMockRepo('quotes'),
    PolicyTransactionsRepo: createMockRepo('transactions'),
    ClaimsRepo: createMockRepo('claims'),
    AuditsRepo: createMockRepo('audits')
  };
});

// Import repos after mock
import { 
  ProductsRepo, 
  PoliciesRepo, 
  QuotesRepo, 
  PolicyVersionsRepo,
  PolicyTransactionsRepo 
} from '../src/repositories/firestoreRepo';

describe('EduShield Enterprise Policy Administration System', () => {
  let sampleProduct: InsuranceProduct;
  let guardianUser: UserProfile;
  let studentUser: UserProfile;
  let adminUser: UserProfile;
  let claimsOfficerUser: UserProfile;

  beforeEach(async () => {
    // Reset in-memory collections
    store.products = {};
    store.versions = {};
    store.policies = {};
    store.quotes = {};
    store.transactions = {};
    store.claims = {};

    for (const prod of SEED_ENTERPRISE_PRODUCTS) {
      await ProductsRepo.create(prod);
    }
    for (const ver of SEED_ENTERPRISE_VERSIONS) {
      await PolicyVersionsRepo.create(ver);
    }

    sampleProduct = JSON.parse(JSON.stringify(SEED_ENTERPRISE_PRODUCTS[1])); // Comprehensive Campus Shield

    guardianUser = {
      id: 'usr_guardian_test',
      uid: 'usr_guardian_test',
      email: 'parent.test@edushield.demo',
      displayName: 'Rajesh Sharma',
      role: 'guardian',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    studentUser = {
      id: 'usr_student_test',
      uid: 'usr_student_test',
      email: 'aarav.sharma@edushield.demo',
      displayName: 'Aarav Sharma',
      role: 'student',
      universityId: 'univ_iitd',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    adminUser = {
      id: 'usr_admin_test',
      uid: 'usr_admin_test',
      email: 'admin.test@edushield.demo',
      displayName: 'System Administrator',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    claimsOfficerUser = {
      id: 'usr_officer_test',
      uid: 'usr_officer_test',
      email: 'officer.test@edushield.demo',
      displayName: 'Senior Claims Adjuster',
      role: 'claims_officer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  // ========================================================
  // TEST 1: Creating a valid policy template
  // ========================================================
  it('1. Creates a valid, complete policy template through the configuration engine', async () => {
    const newProductInput: any = {
      name: 'Executive STEM Scholar Shield',
      code: 'PROD-STEM-ELITE',
      tier: 'COMPREHENSIVE',
      category: 'COMPREHENSIVE',
      shortDescription: 'Tailored protection for postgraduate engineering students.',
      detailedDescription: 'Comprehensive cover covering tuition, lab expenses, and guardian health risks.',
      policyPurpose: 'Protect high-fee STEM degrees against family breadwinner eventualities.',
      targetCustomerSegment: 'Parents of M.Tech / PhD candidates',
      eligibleStudentCategories: ['Regular Full-Time', 'Postgraduate'],
      applicableInstitutions: ['univ_iitd', 'univ_bits'],
      applicableAcademicProgrammes: ['B.Tech / B.E. (Engineering)', 'M.Tech / M.E. (Postgraduate Engineering)'],
      applicableAdmissionCategories: ['Merit / Entrance Exam'],
      policyDurationYearsOptions: [1, 2, 3],
      currentVersion: '1.0.0',
      status: 'DRAFT',
      effectiveDate: '2026-07-01T00:00:00.000Z',
      expiryDate: '2028-06-30T23:59:59.000Z',
      eligibilityCriteria: {
        minAge: 20,
        maxAge: 32,
        allowedAdmissionStatuses: ['ADMITTED'],
        requireActiveEnrollment: true,
        allowedDegreeTypes: ['UNDERGRADUATE', 'POSTGRADUATE'],
        allowedCourseDurationsYears: [2, 3, 4],
        allowedAcademicYears: [1, 2],
        eligibleInstitutionIds: ['univ_iitd', 'univ_bits'],
        allowedResidencies: ['RESIDENT_INDIAN'],
        allowedStates: ['ALL_INDIA'],
        requireStudentIdProof: true,
        requireParentIdProof: true,
        requireRelationshipProof: true,
        requireAdmissionLetter: true,
        requireEnrollmentCertificate: true,
        requireUniversityVerification: true,
        ruleRequirementLevel: {
          minAge: 'MANDATORY',
          degreeType: 'MANDATORY',
          institutionEligibility: 'MANDATORY'
        }
      },
      coverageBenefits: [
        {
          id: 'cov_stem_tuition',
          name: 'Postgraduate Tuition Continuation',
          description: 'Payment of remaining semester tuition upon breadwinner death.',
          category: 'PARENT_DEATH',
          benefitAmount: 1500000,
          maxBenefitAmount: 1500000,
          perEventLimit: 750000,
          annualLimit: 750000,
          aggregateLimit: 1500000,
          waitingPeriodDays: 15,
          isOptionalAddon: false,
          addonPremium: 0,
          benefitRecipient: 'UNIVERSITY_DIRECT',
          requiredClaimDocuments: ['DEATH_CERTIFICATE', 'FEE_DEMAND_STATEMENT']
        }
      ],
      exclusions: [
        {
          id: 'ex_fraud',
          title: 'Document Forgery',
          detailedExplanation: 'Any intentional misrepresentation voids coverage.',
          applicableCategory: 'PARENT_DEATH'
        }
      ],
      financialLimits: {
        sumInsured: 1500000,
        maxCoverageLimit: 1500000,
        perEventLimit: 750000,
        annualClaimLimit: 750000,
        aggregateClaimLimit: 1500000,
        deductibleAmount: 5000,
        coPaymentPercent: 0,
        maxPayableBenefit: 1500000,
        minClaimAmount: 1000
      },
      premiumConfig: {
        baseRatePercent: 2.8,
        basePremium: 1500,
        ageBands: [{ minAge: 20, maxAge: 32, factor: 1.0 }],
        durationFactors: [{ durationYears: 2, factor: 0.95, discountPercent: 5 }],
        taxRatePercent: 18,
        minPremium: 2000,
        maxPremium: 50000,
        availableFrequencies: ['ANNUAL', 'QUARTERLY'],
        frequencyMultipliers: {
          ANNUAL: 1.0,
          SEMI_ANNUAL: 0.52,
          QUARTERLY: 0.27
        }
      },
      issuanceRequirements: {
        requireActiveEnrollment: true,
        requireIdentityVerification: true,
        requireParentKyc: true,
        requireUniversityVerification: true,
        requireStudentConsent: true,
        requireTermsAcceptance: true,
        requireMedicalDeclaration: true
      },
      renewalConditions: {
        isRenewable: true,
        renewalWindowDays: 30,
        gracePeriodDays: 15,
        reinstatementPeriodDays: 30,
        requiresReVerification: false,
        renewalDiscountPercent: 5,
        noticeBeforeExpiryDays: 30
      },
      cancellationConditions: {
        allowPolicyholderCancellation: true,
        freeLookPeriodDays: 15,
        noticePeriodDays: 15,
        refundMethod: 'SHORT_PERIOD',
        minRetainedPremiumPercent: 20,
        noRefundIfClaimsMade: true,
        cancellationReasons: ['Graduation']
      },
      termsAndConditions: {
        version: '1.0.0-STEM',
        effectiveDate: '2026-07-01',
        policyholderResponsibilities: ['Prompt payment of premiums'],
        insuredStudentResponsibilities: ['Maintaining academic standing'],
        disclosureObligations: 'Full medical disclosure',
        waitingPeriodClauses: '15-day initial waiting period',
        claimNotificationPeriodDays: 14,
        claimSubmissionTimelineDays: 30,
        benefitLimitations: ['Maximum payout ₹15,00,000'],
        disputeResolutionProcess: 'Ombudsman arbitration',
        grievanceContact: {
          name: 'Ombudsman',
          designation: 'Officer',
          email: 'grievance@edushield.demo',
          phone: '+91 11 2659 0000',
          address: 'IIT Delhi Research Park'
        },
        applicableJurisdiction: 'High Court of Delhi'
      }
    };

    const created = await policyEngine.createProductTemplate(newProductInput, adminUser);
    expect(created.id).toBeDefined();
    expect(created.code).toBe('PROD-STEM-ELITE');
    expect(created.status).toBe('DRAFT');
    expect(created.currentVersion).toBe('1.0.0');
    expect(created.coverageBenefits.length).toBe(1);
    expect(created.financialLimits.sumInsured).toBe(1500000);
  });

  // ========================================================
  // TEST 2: Rejecting an incomplete policy template
  // ========================================================
  it('2. Rejects incomplete policy templates missing required coverage benefits or financial limits', async () => {
    // Missing coverage benefits
    const incompleteInput: any = {
      name: 'Invalid Incomplete Plan',
      code: 'INVALID-001',
      category: 'COMPREHENSIVE',
      coverageBenefits: []
    };

    await expect(
      policyEngine.createProductTemplate(incompleteInput, adminUser)
    ).rejects.toThrow(/At least one covered risk and benefit schedule/);

    // Missing financial limits
    const missingLimits: any = {
      name: 'Missing Limits Plan',
      code: 'INVALID-002',
      category: 'COMPREHENSIVE',
      coverageBenefits: sampleProduct.coverageBenefits,
      financialLimits: { maxCoverageLimit: 0 }
    };

    await expect(
      policyEngine.createProductTemplate(missingLimits, adminUser)
    ).rejects.toThrow(/Valid positive maximum coverage financial limits/);
  });

  // ========================================================
  // TEST 3 & 4: Eligibility rule validation & rejection reasons
  // ========================================================
  it('3 & 4. Validates mandatory eligibility criteria and rejects ineligible students with exact descriptive reasons', () => {
    // Test 4a: Student Age below minimum (minAge = 16 in sampleProduct)
    const youngStudent: Student = {
      id: 'stu_young',
      guardianId: guardianUser.id,
      guardianName: guardianUser.displayName,
      fullName: 'Young Student',
      gender: 'MALE',
      dateOfBirth: '2015-01-01', // Age ~11 (below min 16)
      universityId: 'univ_iitd',
      universityName: 'Indian Institute of Technology Delhi',
      degreeType: 'UNDERGRADUATE',
      courseName: 'B.Tech Computer Science',
      currentAcademicYear: 1,
      totalCourseDurationYears: 4,
      studentIdNumber: 'IITD-2026-999',
      annualTuitionFee: 300000,
      otherEligibleExpenses: 70000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const resAge = policyEngine.validateStudentEligibility(youngStudent, sampleProduct, guardianUser);
    expect(resAge.isEligible).toBe(false);
    expect(resAge.reasons.length).toBeGreaterThan(0);
    expect(resAge.reasons.some(r => r.includes('outside the required eligibility range'))).toBe(true);

    // Test 4b: Ineligible University
    sampleProduct.applicableInstitutions = ['univ_iitd', 'univ_bits'];
    sampleProduct.eligibilityCriteria.eligibleInstitutionIds = ['univ_iitd', 'univ_bits'];

    const foreignUniStudent: Student = {
      ...youngStudent,
      dateOfBirth: '2004-01-01', // Age ~22
      universityId: 'univ_unapproved_foreign',
      universityName: 'Unapproved University'
    };

    const resUni = policyEngine.validateStudentEligibility(foreignUniStudent, sampleProduct, guardianUser);
    expect(resUni.isEligible).toBe(false);
    expect(resUni.reasons.some(r => r.includes('not included in this policy\'s eligible institution list'))).toBe(true);

    // Test 4c: Fully eligible student
    const eligibleStudent: Student = {
      ...youngStudent,
      dateOfBirth: '2004-01-01', // Age ~22
      universityId: 'univ_iitd',
      universityName: 'Indian Institute of Technology Delhi'
    };

    const resEligible = policyEngine.validateStudentEligibility(eligibleStudent, sampleProduct, guardianUser);
    expect(resEligible.isEligible).toBe(true);
    expect(resEligible.reasons.length).toBe(0);
  });

  // ========================================================
  // TEST 5 & 6: Coverage benefit and exclusion verification
  // ========================================================
  it('5 & 6. Configures coverage benefits with waiting periods and exposes explicit policy exclusions', () => {
    expect(sampleProduct.coverageBenefits.length).toBeGreaterThanOrEqual(4);

    const deathBenefit = sampleProduct.coverageBenefits.find(b => b.category === 'PARENT_DEATH');
    expect(deathBenefit).toBeDefined();
    expect(deathBenefit?.benefitAmount).toBeGreaterThan(0);
    expect(deathBenefit?.waitingPeriodDays).toBe(15);
    expect(deathBenefit?.benefitRecipient).toBe('UNIVERSITY_DIRECT');

    // Exclusions
    expect(sampleProduct.exclusions.length).toBeGreaterThanOrEqual(2);
    const firstExclusion = sampleProduct.exclusions[0];
    expect(firstExclusion).toBeDefined();
    expect(firstExclusion.title).toBeDefined();
    expect(firstExclusion.detailedExplanation).toBeDefined();
  });

  // ========================================================
  // TEST 7: Premium Calculation Engine formula & GST
  // ========================================================
  it('7. Calculates premium accurately with base rate, base fee, age factors, duration discounts, add-ons, and 18% GST', () => {
    // Formula verification for Comprehensive Shield:
    // Annual tuition 400,000 + other 100,000 = 500,000 annual cover. 4 years = 2,000,000 coverageAmount.
    // Base rate: 3.1% on 500,000 = 15,500
    // Base fee: 3,800
    // Unadjusted annual: 15,500 + 3,800 = 19,300
    // Age 20 factor: 1.00
    // Duration 4 years discount factor: 0.90 (10% discount) -> 19,300 * 0.90 = 17,370
    // Duration discount amount: 1,930
    // Add-on (Technical equipment / laptop shield rider cov_cmp_laptop): +2,400
    // Subtotal: 17,370 + 2,400 = 19,770
    // Statutory GST 18% on 19,770: 3,558.6 -> 3,559
    // Total Annual Premium: 19,770 + 3,559 = 23,329
    const calc = policyEngine.calculateEnterprisePremium({
      annualTuitionFee: 400000,
      otherEligibleExpenses: 100000,
      policyDurationYears: 4,
      studentAge: 20,
      product: sampleProduct,
      selectedAddonIds: ['cov_cmp_laptop'],
      frequency: 'ANNUAL'
    });

    expect(calc.coverageAmount).toBe(2000000);
    expect(calc.annualCoverageComponent).toBe(500000);
    expect(calc.baseRateComponent).toBe(15500);
    expect(calc.basePremium).toBe(3800);
    expect(calc.durationDiscountAmount).toBe(1930);
    expect(calc.addonPremiumTotal).toBe(2400);
    expect(calc.subtotal).toBe(19770);
    expect(calc.taxAmount).toBe(3559);
    expect(calc.totalAnnualPremium).toBe(23329);

    // Quarterly installment verification
    const quarterlyCalc = policyEngine.calculateEnterprisePremium({
      annualTuitionFee: 400000,
      otherEligibleExpenses: 100000,
      policyDurationYears: 4,
      studentAge: 20,
      product: sampleProduct,
      selectedAddonIds: ['cov_cmp_laptop'],
      frequency: 'QUARTERLY'
    });

    // 23,329 * 0.27 = 6,298.83 -> 6,299
    expect(quarterlyCalc.frequencyInstallmentAmount).toBe(Math.round(23329 * 0.27));
  });

  // ========================================================
  // TEST 8 & 9: Financial limits enforcement, deductibles & co-pay
  // ========================================================
  it('8 & 9. Enforces per-event limits, aggregate caps, deductibles and co-payment during claim adjudication', () => {
    const mockPolicy: EducationPolicy = {
      id: 'pol_test_limits',
      policyNumber: 'EDU-2026-99999',
      quoteId: 'q_test',
      guardianId: guardianUser.id,
      guardianName: guardianUser.displayName,
      guardianEmail: guardianUser.email,
      studentId: studentUser.id,
      studentName: studentUser.displayName,
      universityId: 'univ_iitd',
      universityName: 'Indian Institute of Technology Delhi',
      planId: sampleProduct.id,
      planName: sampleProduct.name,
      coverageAmount: 3500000,
      totalAnnualPremium: 20000,
      effectiveDate: '2026-01-01T00:00:00.000Z',
      expiryDate: '2027-01-01T00:00:00.000Z',
      renewalDueDate: '2026-12-01T00:00:00.000Z',
      waitingPeriodDays: 15,
      waitingPeriodEndsAt: '2026-01-16T00:00:00.000Z',
      status: 'ACTIVE',
      benefits: [],
      exclusions: [],
      financialLimitsSnapshot: {
        sumInsured: 3500000,
        maxCoverageLimit: 3500000,
        perEventLimit: 1500000,
        annualClaimLimit: 2000000,
        aggregateClaimLimit: 3500000,
        deductibleAmount: 10000,
        coPaymentPercent: 10,
        maxPayableBenefit: 1500000,
        minClaimAmount: 2500,
        sublimits: [
          { benefitCategory: 'EMERGENCY_MEDICAL', limitAmount: 300000 }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Case 1: Below minimum claim amount
    const belowMin = policyEngine.validateClaimAgainstPolicyLimits(
      1500, // min is 2,500
      mockPolicy,
      'PARENT_DEATH'
    );
    expect(belowMin.isAllowed).toBe(false);
    expect(belowMin.payableAmount).toBe(0);
    expect(belowMin.reason).toContain('below the policy minimum claim threshold');

    // Case 2: Claim within limits with deductible (10,000) and co-pay (10%)
    // Claim: 200,000 tuition fee
    // After deductible (10,000) = 190,000
    // Co-pay 10% (19,000) = Payable 171,000
    const validClaim = policyEngine.validateClaimAgainstPolicyLimits(
      200000,
      mockPolicy,
      'PARENT_DEATH'
    );
    expect(validClaim.isAllowed).toBe(true);
    expect(validClaim.eligibleAmount).toBe(200000);
    expect(validClaim.deductibleApplied).toBe(10000);
    expect(validClaim.coPayApplied).toBe(19000);
    expect(validClaim.payableAmount).toBe(171000);

    // Case 3: Category Sublimit capping
    // Category: EMERGENCY_MEDICAL (sublimit 300,000)
    // Claim: 500,000 -> capped at 300,000
    // After deductible (10,000) = 290,000
    // Co-pay 10% (29,000) = Payable 261,000
    const sublimitClaim = policyEngine.validateClaimAgainstPolicyLimits(
      500000,
      mockPolicy,
      'EMERGENCY_MEDICAL'
    );
    expect(sublimitClaim.isAllowed).toBe(true);
    expect(sublimitClaim.eligibleAmount).toBe(300000);
    expect(sublimitClaim.deductibleApplied).toBe(10000);
    expect(sublimitClaim.coPayApplied).toBe(29000);
    expect(sublimitClaim.payableAmount).toBe(261000);

    // Case 4: Aggregate Limit Exhaustion
    const exhaustedClaim = policyEngine.validateClaimAgainstPolicyLimits(
      100000,
      mockPolicy,
      'PARENT_DEATH',
      3500000 // previously paid full aggregate
    );
    expect(exhaustedClaim.isAllowed).toBe(false);
    expect(exhaustedClaim.payableAmount).toBe(0);
    expect(exhaustedClaim.reason).toContain('Aggregate policy benefit');
  });

  // ========================================================
  // TEST 10 & 11: Policy issuance & version immutability
  // ========================================================
  it('10 & 11. Validates successful policy issuance and guarantees immutable contract version preservation', async () => {
    const testQuote: Quote = {
      id: 'quote_test_issuance',
      quoteNumber: 'QTE-2026-TEST',
      guardianId: guardianUser.id,
      guardianName: guardianUser.displayName,
      guardianEmail: guardianUser.email,
      studentId: studentUser.id,
      studentName: studentUser.displayName,
      universityId: 'univ_iitd',
      universityName: 'Indian Institute of Technology Delhi',
      courseName: 'B.Tech Computer Science',
      annualTuitionFee: 300000,
      otherEligibleExpenses: 50000,
      policyDurationYears: 4,
      planId: sampleProduct.id,
      planName: sampleProduct.name,
      productId: sampleProduct.id,
      productCode: sampleProduct.code,
      policyVersion: sampleProduct.currentVersion,
      coverageAmount: 1400000,
      basePremium: 10850,
      riskFactorAdjustment: -1085,
      taxAmount: 1758,
      totalAnnualPremium: 11523,
      waitingPeriodDays: 15,
      benefits: [
        {
          benefitCode: 'TUITION_ESCROW',
          name: 'Direct Tuition Escrow',
          description: 'Tuition paid directly to IIT Delhi',
          coverageLimit: 1400000,
          deductible: 0
        }
      ],
      exclusions: ['Exclusion A', 'Exclusion B'],
      plainLanguageSummary: 'Comprehensive education insurance for IIT Delhi student.',
      calculatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'GENERATED'
    };

    await QuotesRepo.create(testQuote);

    const termsRecord: TermsAcceptanceRecord = {
      userId: guardianUser.id,
      userEmail: guardianUser.email,
      policyId: 'pending',
      policyVersion: sampleProduct.currentVersion,
      acceptedAt: new Date().toISOString(),
      declarationConfirmed: true
    };

    // 10. Policy Issuance
    const issuedPolicy = await policyService.bindPolicyFromQuote(
      testQuote,
      guardianUser,
      'SIMULATED_UPI',
      termsRecord
    );

    expect(issuedPolicy).toBeDefined();
    expect(issuedPolicy.policyNumber).toMatch(/^EDU-\d{4}-\d{5,6}$/);
    expect(issuedPolicy.status).toBe('ACTIVE');
    expect(issuedPolicy.policyVersion).toBe(sampleProduct.currentVersion);
    expect(issuedPolicy.versionSnapshot).toBeDefined();
    expect(issuedPolicy.versionSnapshot?.code).toBe(sampleProduct.code);
    expect(issuedPolicy.termsAcceptance?.declarationConfirmed).toBe(true);

    // 11. Version Immutability Test
    // Now simulate administrator updating the product template in the catalog (e.g. higher price, different limits)
    sampleProduct.financialLimits.sumInsured = 5000000;
    sampleProduct.financialLimits.deductibleAmount = 25000;
    sampleProduct.premiumConfig.basePremium = 5000;
    sampleProduct.currentVersion = '2.0.0';
    await ProductsRepo.update(sampleProduct.id, sampleProduct);

    // Verify that the issued policy contract preserves its original snapshot and values
    const reloadedIssued = await PoliciesRepo.getById(issuedPolicy.id);
    expect(reloadedIssued).toBeDefined();
    expect(reloadedIssued?.policyVersion).toBe('1.2.0'); // preserved original
    expect(reloadedIssued?.versionSnapshot?.financialLimits.deductibleAmount).toBe(5000); // unchanged by catalog update
    expect(reloadedIssued?.versionSnapshot?.currentVersion).toBe('1.2.0');
  });

  // ========================================================
  // TEST 12: Policy renewal eligibility, grace period & discount
  // ========================================================
  it('12. Evaluates renewal eligibility, handles grace period, and computes renewal discount', async () => {
    // Policy expiring in 10 days (within 30-day renewal window)
    const now = new Date();
    const expirySoon = new Date(now);
    expirySoon.setDate(expirySoon.getDate() + 10);
    const renewalDue = new Date(expirySoon);
    renewalDue.setDate(renewalDue.getDate() - 30);

    const activePolicy: EducationPolicy = {
      id: 'pol_test_renewal',
      policyNumber: 'EDU-2026-88888',
      quoteId: 'q_test',
      guardianId: guardianUser.id,
      guardianName: guardianUser.displayName,
      guardianEmail: guardianUser.email,
      studentId: studentUser.id,
      studentName: studentUser.displayName,
      universityId: 'univ_iitd',
      universityName: 'Indian Institute of Technology Delhi',
      planId: sampleProduct.id,
      planName: sampleProduct.name,
      coverageAmount: 1500000,
      totalAnnualPremium: 10000,
      effectiveDate: new Date(now.getTime() - 355 * 86400000).toISOString(),
      expiryDate: expirySoon.toISOString(),
      renewalDueDate: renewalDue.toISOString(),
      waitingPeriodDays: 15,
      waitingPeriodEndsAt: new Date(now.getTime() - 340 * 86400000).toISOString(),
      status: 'ACTIVE',
      benefits: [],
      exclusions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await PoliciesRepo.create(activePolicy);

    const evalRes = policyEngine.evaluateRenewalEligibility(activePolicy);
    expect(evalRes.isEligible).toBe(true);
    expect(evalRes.isGracePeriod).toBe(false);

    // Calculate renewal premium with 5% renewal discount
    const calc = policyEngine.calculateRenewalPremium(activePolicy, sampleProduct);
    expect(calc.discountPercent).toBe(5);
    expect(calc.discountAmount).toBeGreaterThan(0);
    expect(calc.finalRenewalPayable).toBeLessThan(activePolicy.totalAnnualPremium);

    // Process renewal
    const renewed = await policyService.renewPolicy(activePolicy.id, guardianUser);
    expect(renewed.status).toBe('ACTIVE');
    expect(renewed.renewalHistory?.length).toBe(1);
    expect(new Date(renewed.expiryDate).getFullYear()).toBe(expirySoon.getFullYear() + 1);
  });

  // ========================================================
  // TEST 13: Policy cancellation eligibility & refund calculation
  // ========================================================
  it('13. Calculates cancellation refunds correctly for Free-Look period (<= 15 days) vs Short-Period scale and 0% after claims', () => {
    const now = new Date();

    // Case 13a: Free-Look Period (Inception 5 days ago)
    const freeLookPolicy: EducationPolicy = {
      id: 'pol_cancel_freelook',
      policyNumber: 'EDU-2026-77771',
      quoteId: 'q_test',
      guardianId: guardianUser.id,
      guardianName: guardianUser.displayName,
      guardianEmail: guardianUser.email,
      studentId: studentUser.id,
      studentName: studentUser.displayName,
      universityId: 'univ_iitd',
      universityName: 'IIT Delhi',
      planId: sampleProduct.id,
      planName: sampleProduct.name,
      coverageAmount: 1000000,
      totalAnnualPremium: 12000,
      effectiveDate: new Date(now.getTime() - 5 * 86400000).toISOString(), // 5 days elapsed
      expiryDate: new Date(now.getTime() + 360 * 86400000).toISOString(),
      renewalDueDate: new Date(now.getTime() + 330 * 86400000).toISOString(),
      waitingPeriodDays: 15,
      waitingPeriodEndsAt: new Date(now.getTime() + 10 * 86400000).toISOString(),
      status: 'ACTIVE',
      benefits: [],
      exclusions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const freeLookRefund = policyEngine.calculateCancellationRefund(freeLookPolicy, false);
    expect(freeLookRefund.isFreeLook).toBe(true);
    expect(freeLookRefund.methodApplied).toBe('FREE_LOOK');
    expect(freeLookRefund.eligibleRefund).toBe(12000 - 100); // Less ₹100 stamp duty
    expect(freeLookRefund.retainedPremium).toBe(100);

    // Case 13b: Short Period Scale (45 days elapsed -> 60% refund, 40% retained)
    const midTermPolicy: EducationPolicy = {
      ...freeLookPolicy,
      id: 'pol_cancel_midterm',
      effectiveDate: new Date(now.getTime() - 45 * 86400000).toISOString()
    };
    const midTermRefund = policyEngine.calculateCancellationRefund(midTermPolicy, false);
    expect(midTermRefund.isFreeLook).toBe(false);
    expect(midTermRefund.methodApplied).toBe('SHORT_PERIOD_SCALE');
    expect(midTermRefund.retainedPremium).toBe(Math.round(12000 * 0.40));
    expect(midTermRefund.eligibleRefund).toBe(Math.round(12000 * 0.60));

    // Case 13c: 0% Refund if claim has been made
    const claimedRefund = policyEngine.calculateCancellationRefund(freeLookPolicy, true);
    expect(claimedRefund.eligibleRefund).toBe(0);
    expect(claimedRefund.methodApplied).toBe('NO_REFUND_AFTER_CLAIM');
    expect(claimedRefund.retainedPremium).toBe(12000);
  });

  // ========================================================
  // TEST 14: Policy state transitions
  // ========================================================
  it('14. Allows valid policy state transitions and strictly blocks invalid transitions', () => {
    // Valid transitions
    expect(policyEngine.canTransitionPolicyStatus('ACTIVE', 'CANCELLED')).toBe(true);
    expect(policyEngine.canTransitionPolicyStatus('ACTIVE', 'EXPIRED')).toBe(true);
    expect(policyEngine.canTransitionPolicyStatus('ACTIVE', 'SUSPENDED')).toBe(true);
    expect(policyEngine.canTransitionPolicyStatus('SUSPENDED', 'ACTIVE')).toBe(true);

    // Invalid transitions
    expect(policyEngine.canTransitionPolicyStatus('CANCELLED', 'ACTIVE')).toBe(false);
    expect(policyEngine.canTransitionPolicyStatus('EXPIRED', 'CANCELLED')).toBe(false);
  });

  // ========================================================
  // TEST 15: Role-based access control (Student vs Parent vs Admin)
  // ========================================================
  it('15. Strictly enforces role-based permissions preventing Students from purchasing or configuring policies', async () => {
    const testQuote: Quote = {
      id: 'quote_test_rbac',
      quoteNumber: 'QTE-2026-RBAC',
      guardianId: guardianUser.id,
      guardianName: guardianUser.displayName,
      guardianEmail: guardianUser.email,
      studentId: studentUser.id,
      studentName: studentUser.displayName,
      universityId: 'univ_iitd',
      universityName: 'Indian Institute of Technology Delhi',
      courseName: 'B.Tech Computer Science',
      annualTuitionFee: 200000,
      otherEligibleExpenses: 0,
      policyDurationYears: 4,
      planId: sampleProduct.id,
      planName: sampleProduct.name,
      coverageAmount: 800000,
      basePremium: 6000,
      riskFactorAdjustment: 0,
      taxAmount: 1080,
      totalAnnualPremium: 7080,
      waitingPeriodDays: 15,
      benefits: [],
      exclusions: [],
      plainLanguageSummary: 'Education insurance for RBAC test.',
      calculatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      status: 'GENERATED'
    };

    // 15a: Student attempts to bind/purchase a policy -> MUST BE REJECTED
    await expect(
      policyService.bindPolicyFromQuote(testQuote, studentUser)
    ).rejects.toThrow(/Unauthorized Operation: Premium payment initiation and policy binding are restricted exclusively to authenticated Parents\/Guardians/);

    // 15b: Student or Claims Officer attempts to configure a policy template -> MUST BE REJECTED
    await expect(
      policyEngine.createProductTemplate({ name: 'Hacked Plan' } as any, studentUser)
    ).rejects.toThrow(/Unauthorized Operation: Only Administrators can configure insurance products/);

    await expect(
      policyEngine.createProductTemplate({ name: 'Hacked Plan' } as any, claimsOfficerUser)
    ).rejects.toThrow(/Unauthorized Operation: Only Administrators can configure insurance products/);

    // 15c: Administrator can configure policy templates
    const adminCreated = await policyEngine.createProductTemplate(
      {
        name: 'Authorized Admin Product',
        code: 'PROD-AUTH-ADMIN',
        currentVersion: '1.0.0',
        category: 'COMPREHENSIVE',
        coverageBenefits: sampleProduct.coverageBenefits,
        financialLimits: sampleProduct.financialLimits,
        eligibilityCriteria: sampleProduct.eligibilityCriteria
      } as any,
      adminUser
    );
    expect(adminCreated.id).toBeDefined();
  });
});